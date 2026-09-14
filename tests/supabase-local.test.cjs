// Opt-in integration test. Uses only the local stack and local captured email.
// ATTUNE_LOCAL_STATUS must point to `supabase status -o json` output; never commit it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { SupabaseAuth } = require('../.angular/mock-tests/services/supabase/supabase-auth');
const { SupabaseProfiles } = require('../.angular/mock-tests/services/supabase/supabase-profiles');
const { SupabaseInvitations } = require('../.angular/mock-tests/services/supabase/supabase-invitations');
const { SupabasePlaylists } = require('../.angular/mock-tests/services/supabase/supabase-playlists');
const { SupabaseSocial } = require('../.angular/mock-tests/services/supabase/supabase-social');

test('local Auth delivers confirmation and recovery emails, verifies PKCE, and changes the password', { skip: !process.env.ATTUNE_LOCAL_STATUS }, async () => {
  const config = JSON.parse(readFileSync(process.env.ATTUNE_LOCAL_STATUS, 'utf8'));
  assert.equal(config.API_URL, 'http://127.0.0.1:54321');
  const inbox = config.MAILPIT_URL;
  assert.equal(inbox, 'http://127.0.0.1:54324');
  const client = createClient(config.API_URL, config.PUBLISHABLE_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: false, autoRefreshToken: false } });
  const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const auth = new SupabaseAuth(client, 'http://localhost:4200');
  const email = `auth-test-${Date.now()}@example.test`;
  const password = 'Local-test-password-123';
  const invitation = randomBytes(32).toString('hex');
  let accountId;
  function sql(input) {
    return execFileSync('docker', ['exec', '-i', 'supabase_db_attune-local', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  }
  async function emailCode(subject) {
    let message;
    for (let attempt = 0; attempt < 20; attempt++) {
      const data = await (await fetch(`${inbox}/api/v1/messages`)).json();
      message = data.messages.find(item => item.Subject.toLowerCase().includes(subject) && item.To.some(to => to.Address === email));
      if (message) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(message, `Expected a ${subject} email`);
    const detail = await (await fetch(`${inbox}/api/v1/message/${message.ID}`)).json();
    const link = detail.HTML.match(/href="([^"]*\/auth\/v1\/verify[^\"]*)"/)[1].replaceAll('&amp;', '&');
    assert.equal(new URL(link).hostname, '127.0.0.1');
    const response = await fetch(link, { redirect: 'manual' });
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.origin, 'http://localhost:4200');
    assert.equal(destination.pathname, '/auth/callback');
    assert.ok(destination.searchParams.get('code'), 'Email must return a PKCE code');
    return destination;
  }
  try {
    await auth.signUp({ email, password });
    await assert.rejects(auth.signIn({ email, password }), /confirmed/i);
    const confirmation = await emailCode('confirm');
    await auth.completeCallback(confirmation.searchParams.get('code'));
    accountId = (await client.auth.getUser()).data.user.id;
    const access = await auth.getAccess();
    assert.equal(access.membership, 'pending');
    const content = await client.from('playlists').select('id');
    assert.equal(content.error, null);
    assert.deepEqual(content.data, [], 'A verified account without an invitation has no community access');
    await assert.rejects(auth.redeemInvitation({ inviteCode: 'invalid-integration-test', username: 'test-member', practice: 'Test' }), /invalid, expired/);
    sql(`insert into private.invitations(token_hash) values (extensions.digest('${invitation}','sha256'));`);
    await auth.redeemInvitation({ inviteCode: invitation, username: `test-${Date.now()}`, practice: 'Test practice' });
    assert.equal((await auth.getAccess()).membership, 'active');
    const profiles = new SupabaseProfiles(client);
    const invitations = new SupabaseInvitations(client);
    const playlists = new SupabasePlaylists(client, profiles);
    const social = new SupabaseSocial(client);
    assert.equal((await profiles.get(accountId)).inviteCount, 3);
    const created = await invitations.create();
    assert.match(created.code, /^[0-9a-f]{64}$/);
    assert.equal((await invitations.listMine())[0].code, undefined, 'Invitation history never reveals codes');
    assert.equal((await profiles.get(accountId)).inviteCount, 2);
    await profiles.updateMine({ displayName: 'Integration test', practice: 'Test', location: '', bio: '' });
    const draft = { title: 'Integration playlist', modality: 'Meditation', duration: '30m', energyCurve: [1,2,1], qualities: ['ambient'], listeningReviewed: true, listeningContext: '', creatorWarningLabels: ['explicit language'], notes: '', links: { other: 'https://example.com/music' }, tracks: [] };
    const playlist = await playlists.create(draft);
    assert.deepEqual(playlist.creatorWarningLabels, ['explicit language']);
    await social.setSaved(playlist.id, true);
    await social.setSaved(playlist.id, true);
    assert.deepEqual(await social.savedIds(), [playlist.id]);
    assert.equal((await playlists.list({ view: 'saved' }))[0].savedCount, 1);
    await playlists.addComment(playlist.id, 'Integration comment');
    const edited = await playlists.update(playlist.id, { ...draft, title: 'Edited integration playlist', creatorWarningLabels: [] });
    assert.equal(edited.comments[0].body, 'Integration comment');
    assert.deepEqual(edited.creatorWarningLabels, []);
    await playlists.delete(playlist.id);
    assert.deepEqual(await social.savedIds(), []);
    await assert.rejects(auth.completeCallback(confirmation.searchParams.get('code')), /invalid or expired/);
    await auth.signOut();
    assert.equal(await auth.getAccess(), null);
    await auth.signIn({ email, password });
    await auth.signOut();
    await auth.requestPasswordReset(email);
    const recovery = await emailCode('reset');
    assert.equal(recovery.searchParams.get('recovery'), '1');
    await auth.completeCallback(recovery.searchParams.get('code'));
    await auth.updatePassword('Changed-local-password-456');
    assert.equal(await auth.getAccess(), null);
    await assert.rejects(auth.signIn({ email, password }), /Invalid login/);
    await auth.signIn({ email, password: 'Changed-local-password-456' });
    await auth.signOut();
  } finally {
    auth.destroy();
    if (accountId) {
      assert.match(accountId, /^[0-9a-f-]{36}$/);
      sql(`begin;
        delete from public.playlists where creator_id='${accountId}';
        delete from private.invitations where created_by='${accountId}' or redeemed_by='${accountId}' or token_hash=extensions.digest('${invitation}','sha256');
        delete from public.profiles where id='${accountId}';
        delete from private.memberships where user_id='${accountId}';
        commit;`);
      const { error } = await admin.auth.admin.deleteUser(accountId);
      assert.equal(error, null);
    }
  }
});
