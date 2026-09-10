const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8').split('if (!location.hash) location.hash')[0];
function app() {
  const context = vm.createContext({ structuredClone, localStorage: { getItem: () => null, setItem() {} }, document: { querySelector: () => ({ value: '' }) } });
  vm.runInContext(source + '\nrender = () => {}; showToast = () => {};', context);
  return expression => vm.runInContext(expression, context);
}
test('migration preserves uncertainty, moves lyrics, and is idempotent', () => {
  const run = app();
  const result = JSON.parse(run(`JSON.stringify(migratePlaylist({ qualities: ['instrumental', 'vocal', 'ceremonial', 'rhythmic'], warnings: {'contains lyrics': 3, 'religious content': 2, 'dark/intense': 5}, notes: 'Keep me' }))`));
  assert.deepEqual(result.qualities, ['sung lyrics']);
  assert.equal(result.warnings['religious or devotional content'], 2);
  assert.equal(result.warnings['dark/intense'], 5);
  assert.ok(!('contains lyrics' in result.warnings));
  assert.equal(result.notes, 'Keep me');
  assert.equal(result.legacyQualities.length, 3);
  assert.deepEqual(JSON.parse(run(`JSON.stringify(migratePlaylist(${JSON.stringify(result)}))`)), result);
  assert.equal(run(`migratePlaylist({qualities:['instrumental'], warnings:{}}).qualities.includes('no vocals')`), false);
});
test('exclusions use any selected note and leave lyrics-only playlists visible', () => {
  const run = app();
  run(`filters.excludedWarnings = ['abrupt transitions', 'religious or devotional content']`);
  assert.equal(run('filteredPlaylists().length'), 3);
  assert.equal(run(`filteredPlaylists().some(p => p.id === 'p-warm-horizon')`), true);
  run('clearFilters()');
  assert.equal(run('filteredPlaylists().length'), 6);
  run(`filters.qualities = ['acoustic', 'sung lyrics']`);
  assert.equal(run('filteredPlaylists().length'), 2);
});
test('note reports deduplicate per account and preserve context', () => {
  const run = app();
  run(`state.currentUserId = 'u-maya'; addWarning('p-quiet-body', 'sudden loud sounds', 'Track 2, 1:20'); addWarning('p-quiet-body', 'sudden loud sounds', 'duplicate')`);
  assert.equal(run(`getPlaylist('p-quiet-body').listeningReports.length`), 1);
  assert.equal(run(`getPlaylist('p-quiet-body').listeningReports[0].context`), 'Track 2, 1:20');
  run(`state.currentUserId = 'u-nadia'; addWarning('p-quiet-body', 'sudden loud sounds', 'Second listener')`);
  assert.equal(run(`getPlaylist('p-quiet-body').listeningReports.length`), 2);
  assert.equal(run(`warningEntries(getPlaylist('p-quiet-body')).length`), 1);
  run(`addWarning('p-quiet-body', 'unknown label')`);
  assert.equal(run(`getPlaylist('p-quiet-body').listeningReports.length`), 2);
});
test('empty review states and contributed text remain distinct and escaped', () => {
  const run = app();
  assert.match(run(`warningPanel(getPlaylist('p-quiet-body'))`), /not been marked as reviewed/);
  run(`getPlaylist('p-quiet-body').listeningReviewed = true`);
  assert.match(run(`warningPanel(getPlaylist('p-quiet-body'))`), /reviewed.*marked none/);
  run(`getPlaylist('p-quiet-body').listeningContext = '<img src=x onerror=alert(1)>'`);
  assert.match(run(`warningPanel(getPlaylist('p-quiet-body'))`), /&lt;img/);
});
