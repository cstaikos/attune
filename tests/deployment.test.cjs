const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'attune-deploy-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'deploy', 'src/environments', 'bin']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '../scripts/deploy.mjs'), path.join(root, 'scripts/deploy.mjs'));
  fs.copyFileSync(path.join(__dirname, '../wrangler.jsonc'), path.join(root, 'wrangler.jsonc'));
  for (const target of ['staging', 'production']) {
    fs.writeFileSync(path.join(root, `deploy/${target}.json`), JSON.stringify({
      workerName: `attune-${target}`,
      supabase: { url: `https://${(target === 'staging' ? 'a' : 'b').repeat(20)}.supabase.co`, publishableKey: 'sb_publishable_test', unexpected: 'must-not-compile' },
    }));
  }
  fs.writeFileSync(path.join(root, 'bin/pnpm'), `#!/bin/sh\nprintf '%s\\n' "$*" >> calls.txt\ncat src/environments/*.generated.ts > browser-config.txt\n`, { mode: 0o755 });
  return {
    root,
    run: (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/deploy.mjs'), ...args], { encoding: 'utf8', env: { ...process.env, PATH: `${root}/bin:${process.env.PATH}` } }),
    read: name => fs.readFileSync(path.join(root, name), 'utf8'),
  };
}

for (const target of ['staging', 'production']) {
  test(`deploy targets ${target} with only public browser settings`, t => {
    const f = fixture(t);
    const result = f.run('deploy', target);
    assert.equal(result.status, 0, result.stderr);
    assert.match(f.read('calls.txt'), new RegExp(`production,release-${target} --output-path dist/${target}`));
    assert.match(f.read('calls.txt'), new RegExp(`deploy --config wrangler.jsonc --env ${target}`));
    assert.doesNotMatch(f.read('browser-config.txt'), /must-not-compile/);
    assert.equal(fs.existsSync(path.join(f.root, `src/environments/environment.${target}.generated.ts`)), false);
    assert.equal(fs.existsSync(path.join(f.root, `.deploy-${target}.lock`)), false);
  });
}

test('preview uses Wrangler dry run', t => {
  const f = fixture(t);
  assert.equal(f.run('preview', 'production').status, 0);
  assert.match(f.read('calls.txt'), /--env production --dry-run/);
});

test('shared database fails before any command', t => {
  const f = fixture(t);
  const config = JSON.parse(f.read('deploy/production.json'));
  config.supabase.url = JSON.parse(f.read('deploy/staging.json')).supabase.url;
  fs.writeFileSync(path.join(f.root, 'deploy/production.json'), JSON.stringify(config));
  assert.equal(f.run('deploy', 'production').status, 1);
  assert.equal(fs.existsSync(path.join(f.root, 'calls.txt')), false);
});

test('mismatched Worker fails before any command', t => {
  const f = fixture(t);
  const config = JSON.parse(f.read('deploy/production.json'));
  config.workerName = 'attune-staging';
  fs.writeFileSync(path.join(f.root, 'deploy/production.json'), JSON.stringify(config));
  assert.equal(f.run('deploy', 'production').status, 1);
  assert.equal(fs.existsSync(path.join(f.root, 'calls.txt')), false);
});
