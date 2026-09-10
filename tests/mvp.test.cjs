const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8').split('if (!location.hash)')[0];
function app() {
  const nodes = {};
  const ctx = vm.createContext({
    FormData: class {
      constructor(form) { this.values = form.values || {}; }
      get(key) { return this.values[key] ?? null; }
      getAll(key) { return this.values[key] || []; }
    },
    structuredClone, URL,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      querySelector: selector => nodes[selector] ||= { listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; }, querySelectorAll: () => [], reset: () => {} },
      querySelectorAll: () => []
    },
    location: { hash: '#library' },
    window: { confirm: () => true, addEventListener: () => {} }
  });
  vm.runInContext(source + '\nrender = () => {}; showToast = () => {};', ctx);
  vm.runInContext(`bindEvents(); renderArcBuilder = () => {}; getArcBuilderValues = () => [1,2,1];`, ctx);
  return code => vm.runInContext(code, ctx);
}

test('playlist URLs reject homepages, unsafe schemes, and known non-playlists', () => {
  const run = app();
  for (const url of ['https://open.spotify.com/', 'https://open.spotify.com/album/123', 'https://music.youtube.com/', 'https://music.apple.com/us/album/test/123', 'javascript:alert(1)', 'https://user:pass@example.com/playlist']) {
    assert.equal(run(`parsePlaylistLink(${JSON.stringify(url)})`), null, url);
  }
  for (const [url, key] of [
    ['https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', 'spotify'],
    ['https://www.youtube.com/playlist?list=PLtest', 'youtube'],
    ['https://music.apple.com/us/playlist/example/pl.123', 'apple'],
    ['https://example.com/my-music', 'other']
  ]) assert.equal(run(`parsePlaylistLink(${JSON.stringify(url)}).key`), key);
  assert.equal(run(`parsePlaylistLink('https://example.com/spotify/playlist').key`), 'other');
});

test('saved lists are scoped to identity and save count changes once', () => {
  const run = app();
  run(`state.currentUserId='u-maya'; toggleFavorite('p-warm-horizon');`);
  assert.equal(run(`getPlaylist('p-warm-horizon').savedCount`), 49);
  assert.equal(run(`savedPlaylistIds().includes('p-warm-horizon')`), true);
  run(`location.hash='#saved'`);
  assert.equal(run('filteredPlaylists().length'), 1);
  run(`state.currentUserId='u-elias'`);
  assert.equal(run('filteredPlaylists().length'), 0);
  run(`state.currentUserId='u-maya'; toggleFavorite('p-warm-horizon')`);
  assert.equal(run(`getPlaylist('p-warm-horizon').savedCount`), 48);
});

test('contributions filter includes only the current creator', () => {
  const run = app();
  run(`state.currentUserId='u-maya'; location.hash='#contributions'`);
  assert.equal(run('filteredPlaylists().length'), 2);
  assert.equal(run(`filteredPlaylists().every(p => p.creatorId === 'u-maya')`), true);
});

test('delete enforces ownership, respects cancellation, and cleans all saved lists', () => {
  const run = app();
  run(`state.currentUserId='u-elias'; deletePlaylist('p-warm-horizon')`);
  assert.equal(run(`Boolean(getPlaylist('p-warm-horizon'))`), true);
  run(`state.currentUserId='u-maya'; window.confirm=()=>false; deletePlaylist('p-warm-horizon')`);
  assert.equal(run(`Boolean(getPlaylist('p-warm-horizon'))`), true);
  run(`window.confirm=()=>true; state.favoritesByUser={'u-maya':['p-warm-horizon'], 'u-elias':['p-warm-horizon']}; deletePlaylist('p-warm-horizon')`);
  assert.equal(run(`Boolean(getPlaylist('p-warm-horizon'))`), false);
  assert.equal(run(`Object.values(state.favoritesByUser).flat().length`), 0);
  assert.equal(run('location.hash'), '#contributions');
});

function formValues(run) {
  run(`state.currentUserId='u-maya'; elements.playlistForm.values={title:'Test playlist', durationHours:'1', durationMinutes:'10', serviceLink:'https://www.youtube.com/playlist?list=PLtest', modality:'Meditation', quality:['ambient'], warning:['abrupt transitions'], notes:'Test notes'};`);
}

test('create requires a playlist URL and persists a complete entry', () => {
  const run = app(); formValues(run);
  run(`elements.playlistForm.values.serviceLink=''; elements.playlistForm.listeners.submit({preventDefault(){}})`);
  assert.equal(run('state.playlists.length'), 6);
  assert.match(run('elements.playlistError.textContent'), /direct playlist link/);
  run(`elements.playlistForm.values.serviceLink='https://www.youtube.com/playlist?list=PLtest'; elements.playlistForm.listeners.submit({preventDefault(){}})`);
  assert.equal(run('state.playlists.length'), 7);
  assert.equal(run('state.playlists[0].duration'), '1h 10m');
  assert.equal(run('state.playlists[0].creatorId'), 'u-maya');
  assert.equal(run('location.hash'), run('`#playlist/${state.playlists[0].id}`'));
});

test('edit preserves identity, discussion, saves, and other contributors listening notes', () => {
  const run = app(); formValues(run);
  run(`editingId='p-warm-horizon'; const original=getPlaylist(editingId); original.listeningReports=[{userId:'u-elias', label:'sudden loud sounds', context:'Track three'}]; original.warnings['sudden loud sounds']=1; elements.playlistForm.listeners.submit({preventDefault(){}})`);
  assert.equal(run('state.playlists.length'), 6);
  assert.equal(run(`getPlaylist('p-warm-horizon').title`), 'Test playlist');
  assert.equal(run(`getPlaylist('p-warm-horizon').savedCount`), 48);
  assert.equal(run(`getPlaylist('p-warm-horizon').comments.length`), 1);
  assert.equal(run(`getPlaylist('p-warm-horizon').listeningReports.find(r=>r.userId==='u-elias').context`), 'Track three');
  assert.equal(run(`getPlaylist('p-warm-horizon').warnings['sudden loud sounds']`), 1);
  assert.equal(run('location.hash'), '#playlist/p-warm-horizon');
});

test('edit handler rejects another creator even if a stale form is submitted', () => {
  const run = app(); formValues(run);
  run(`editingId='p-mesa-arc'; elements.playlistForm.listeners.submit({preventDefault(){}})`);
  assert.equal(run(`getPlaylist('p-mesa-arc').title`), 'Mesa Arc');
  assert.match(run('elements.playlistError.textContent'), /own contributions/);
});
