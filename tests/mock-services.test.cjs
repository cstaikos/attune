const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MockStore } = require('../.angular/mock-tests/services/mock/mock-store');
const { MockControls } = require('../.angular/mock-tests/services/mock/mock-controls');
const { MockAuth } = require('../.angular/mock-tests/services/mock/mock-auth');
const { MockPlaylists } = require('../.angular/mock-tests/services/mock/mock-playlists');
const { MockProfiles } = require('../.angular/mock-tests/services/mock/mock-profiles');
const { MockSocial } = require('../.angular/mock-tests/services/mock/mock-social');
const { MockInvitations } = require('../.angular/mock-tests/services/mock/mock-invitations');
const { MOCK_STORAGE_KEY } = require('../.angular/mock-tests/services/mock/mock-state');
const { createSeedState } = require('../.angular/mock-tests/data/seed-state');
const { validateState } = require('../.angular/mock-tests/services/mock/validate-state');
function setup(storage = { value: null, getItem() { return this.value; }, setItem(key, value) { this.value = value; } }) {
 const controls = new MockControls(); controls.latencyMs = 0;
 const store = new MockStore(storage, controls);
 return { storage, controls, store, auth: new MockAuth(store), playlists: new MockPlaylists(store), profiles: new MockProfiles(store), social: new MockSocial(store), invites: new MockInvitations(store) };
}
const credentials = n => ({email: `member${n}@example.test`, password: 'test-only-password'});
const join = (app, n = 1, inviteCode = 'BETA-2026') => app.auth.signUp({...credentials(n), username: `member-${n}`, practice: 'Facilitator', inviteCode});
const draft = (patch = {}) => ({title: 'Evening', modality: 'Meditation', duration: '1h 30m', energyCurve: [1,3,1], qualities: ['ambient'], notes: 'Quiet', links: {youtube: 'https://www.youtube.com/playlist?list=PLtest'}, tracks: [], listeningReviewed: true, listeningContext: '', creatorWarningLabels: [], ...patch});
const code = expected => error => error.code === expected;

test('seed loads with validated models; member-only reads reject guests', async () => {
 validateState(createSeedState());
 const app = setup();
 for (const read of [() => app.playlists.list(), () => app.profiles.list(), () => app.social.savedIds(), () => app.invites.listMine()]) await assert.rejects(read, code('unauthenticated'));
});

test('registration redeems invite, publishes session, hashes credentials, and survives reload', async () => {
 const app = setup(), sessions = [];
 const subscription = app.auth.session$.subscribe(s => sessions.push(s));
 const member = await join(app);
 assert.equal(sessions.at(-1).userId, member.id);
 assert.ok(!app.storage.value.includes('test-only-password'));
 const loaded = setup(app.storage);
 assert.equal((await loaded.profiles.get(member.id)).username, 'member-1');
 await loaded.auth.signOut();
 await assert.rejects(loaded.auth.signIn({...credentials(1), password:'incorrect'}), code('invalid-credentials'));
 assert.equal((await loaded.auth.signIn(credentials(1))).userId, member.id);
 await assert.rejects(join(loaded, 2), code('invalid-invite'));
 subscription.unsubscribe();
});

test('concurrent registrations cannot redeem one invitation twice', async () => {
 const app = setup();
 const outcomes = await Promise.allSettled([join(app,1), join(app,2)]);
 assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
 assert.equal(outcomes.find(x => x.status === 'rejected').reason.code, 'invalid-invite');
});

test('saves and follows are idempotent and isolated between members', async () => {
 const app = setup(); await join(app);
 await Promise.all([app.social.setSaved('p-warm-horizon',true), app.social.setSaved('p-warm-horizon',true)]);
 assert.equal((await app.playlists.get('p-warm-horizon')).savedCount, 1);
 await app.social.setFollowed('u-maya',true); await app.social.setFollowed('u-maya',true);
 assert.equal((await app.profiles.get('u-maya')).followerCount, 1);
 await join(app,2,'GUIDE-2026');
 assert.deepEqual(await app.social.savedIds(),[]); assert.deepEqual(await app.social.followedIds(),[]);
 await app.auth.signIn(credentials(1));
 assert.deepEqual(await app.social.savedIds(),['p-warm-horizon']);
 await app.social.setSaved('p-warm-horizon',false);
 assert.equal((await app.playlists.get('p-warm-horizon')).savedCount,0);
});

test('playlist edits enforce ownership and preserve discussion, saves, and others reports', async () => {
 const app = setup(), owner = await join(app);
 const playlist = await app.playlists.create(draft());
 const other = await join(app,2,'GUIDE-2026');
 await app.social.setSaved(playlist.id,true);
 await app.playlists.addComment(playlist.id,'Keep this discussion');
 await app.playlists.reportListeningNote(playlist.id,{label:'explicit language',context:'Track 2'});
 await assert.rejects(app.playlists.reportListeningNote(playlist.id,{label:'explicit language',context:''}),code('conflict'));
 await assert.rejects(app.playlists.update(playlist.id,draft()),code('forbidden'));
 await assert.rejects(app.playlists.delete(playlist.id),code('forbidden'));
 await app.auth.signIn(credentials(1));
 const edited = await app.playlists.update(playlist.id,draft({title:'New title',creatorId:other.id, savedCount:99}));
 assert.equal(edited.creatorId,owner.id); assert.equal(edited.savedCount,1);
 assert.equal(edited.comments[0].body,'Keep this discussion');
 assert.equal(edited.listeningReports[0].context,'Track 2');
 assert.equal(edited.warnings['explicit language'],1);
 await app.playlists.delete(playlist.id);
 await app.auth.signIn(credentials(2)); assert.deepEqual(await app.social.savedIds(),[]);
 await assert.rejects(app.playlists.get(playlist.id),code('not-found'));
});

test('queries combine duration, service, tags, exclusions, search, and personal views', async () => {
 const app = setup(); await join(app);
 const playlist = await app.playlists.create(draft({creatorWarningLabels:['explicit language']}));
 await app.social.setSaved(playlist.id,true);
 const query = {view:'saved', minDuration:90,maxDuration:90, services:['youtube'],qualities:['ambient'],search:'evening'};
 assert.deepEqual((await app.playlists.list(query)).map(p => p.id),[playlist.id]);
 assert.deepEqual(await app.playlists.list({...query,excludedWarnings:['explicit language']}),[]);
 assert.deepEqual(await app.playlists.list({...query,excludedQualities:['ambient']}),[]);
 assert.deepEqual(await app.playlists.list({...query,services:['spotify']}),[]);
 await assert.rejects(app.playlists.list({minDuration:91,maxDuration:90}),code('invalid-input'));
});

test('invalid playlist inputs fail without changes and returned data is detached', async () => {
 const app = setup(); await join(app);
 const before = app.storage.value;
 for (const patch of [{links:{url0:'javascript:alert(1)'}},{duration:'0m'},{qualities:['no vocals','sung lyrics']},{energyCurve:[9]}])
  await assert.rejects(app.playlists.create(draft(patch)),code('invalid-input'));
 assert.equal(app.storage.value,before);
 const list = await app.playlists.list(); list[0].title = 'Outside mutation';
 assert.notEqual((await app.playlists.get(list[0].id)).title,'Outside mutation');
});

test('storage and simulated failures leave state unchanged; failure is consumed once', async () => {
 const app = setup(); await join(app);
 app.controls.failNext('social.setSaved');
 await assert.rejects(app.social.setSaved('p-warm-horizon',true),code('unavailable'));
 assert.deepEqual(await app.social.savedIds(),[]);
 await app.social.setSaved('p-warm-horizon',true);
 const previous = app.storage.value;
 app.storage.setItem = () => { throw new Error('quota'); };
 await assert.rejects(app.social.setSaved('p-warm-horizon',false),code('storage'));
 assert.deepEqual(await app.social.savedIds(),['p-warm-horizon']); assert.equal(app.storage.value,previous);
 await assert.rejects(app.auth.signOut(),code('storage'));
 assert.equal((await app.playlists.list()).length > 0,true);
});

test('invalid stored state is preserved and never silently reset; legacy key is untouched', () => {
 const reads=[]; const storage={getItem(key) { reads.push(key); return '{bad'; },setItem() { assert.fail('must not overwrite'); }};
 assert.throws(() => setup(storage),code('storage')); assert.deepEqual(reads,[MOCK_STORAGE_KEY]);
 const state=createSeedState(); state.session={userId:'missing'};
 assert.throws(() => setup({getItem:() => JSON.stringify(state),setItem(){}}),code('storage'));
});

test('profile changes whitelist editable fields; invitations consume allowance', async () => {
 const app = setup(), member=await join(app);
 const updated=await app.profiles.updateMine({displayName:'Listener',practice:'Music',location:'',bio:'',id:'fake',inviteCount:100});
 assert.equal(updated.id,member.id); assert.equal(updated.inviteCount,3);
 for(let i=0;i<3;i++) await app.invites.create();
 assert.equal((await app.invites.listMine()).length,3);
 await assert.rejects(app.invites.create(),code('forbidden'));
});

test('creator reports remain selected and retain context during later edits', async () => {
 const app = setup(); await join(app);
 const playlist = await app.playlists.create(draft());
 await app.playlists.reportListeningNote(playlist.id,{label:'sudden loud sounds',context:'Track 2, 1:20'});
 const current=await app.playlists.get(playlist.id);
 assert.deepEqual(current.creatorWarningLabels,['sudden loud sounds']);
 const updated=await app.playlists.update(playlist.id,draft({title:'Edited',creatorWarningLabels:current.creatorWarningLabels}));
 assert.equal(updated.listeningReports[0].context,'Track 2, 1:20');
 assert.equal(updated.warnings['sudden loud sounds'],1);
});

test('login return destinations reject external locations and auth loops', () => {
 const { safeReturnUrl } = require('../.angular/mock-tests/utils/return-url');
 for(const value of [null,'https://example.com','//example.com','/\\example.com','/login','/join?returnUrl=/saved']) assert.equal(safeReturnUrl(value),'/library');
 assert.equal(safeReturnUrl('/playlist/123?from=saved'),'/playlist/123?from=saved');
});


test('generic URLs detect providers and multiple links survive editing and reload', async () => {
 const { parsePlaylistLink } = require('../.angular/mock-tests/utils/playlist-link');
 for (const [url, provider] of [['https://open.spotify.com/playlist/abc','spotify'],['https://music.apple.com/us/playlist/example/pl.123','apple'],['https://youtu.be/example','youtube'],['https://example.com/','other'],['https://open.spotify.com.example.com/','other']]) {
  assert.equal(parsePlaylistLink(url).key, provider);
 }
 for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com/', 'invalid']) assert.equal(parsePlaylistLink(url), null);
 const app = setup(); await join(app);
 const links = {url0:'https://example.com/',url1:'https://example.org/music',url2:'https://open.spotify.com/playlist/abc',url3:'https://open.spotify.com/playlist/def'};
 const playlist = await app.playlists.create(draft({links}));
 await app.playlists.update(playlist.id,draft({links,title:'Updated'}));
 assert.deepEqual((await setup(app.storage).playlists.get(playlist.id)).links,links);
});

test('comments retain their text through reload and edits without warning markers', async () => {
 const app = setup(); await join(app);
 const playlist = await app.playlists.create(draft());
 await app.playlists.addComment(playlist.id,'Sudden loud sounds in tracks 2 and 5.');
 await app.playlists.addComment(playlist.id,'Thanks for sharing.');
 await app.playlists.update(playlist.id,draft({title:'Updated'}));
 const comments = (await setup(app.storage).playlists.get(playlist.id)).comments;
 assert.equal(comments[0].warning,undefined);
 assert.equal(comments[0].body,'Sudden loud sounds in tracks 2 and 5.');
 assert.equal(comments[1].warning,undefined);
 await assert.rejects(app.playlists.addComment(playlist.id,' '),code('invalid-input'));
});

test('energy labels default at endpoints and preserve custom and cleared labels after reload', async () => {
 const app = setup();
 await join(app);
 const playlist = await app.playlists.create(draft());
 assert.deepEqual(playlist.energyLabels, ['start', '', 'finish']);
 await app.playlists.update(playlist.id, draft({energyLabels: ['', ' Peak ', '']}));
 const loaded = setup(app.storage);
 assert.deepEqual((await loaded.playlists.get(playlist.id)).energyLabels, ['', 'Peak', '']);
 await assert.rejects(app.playlists.update(playlist.id, draft({energyLabels: ['start']})), code('invalid-input'));
});
