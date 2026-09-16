const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SupabaseAuth } = require('../.angular/mock-tests/services/supabase/supabase-auth');

function setup({ confirmed = true, membership = 'active', signedIn = true } = {}) {
  const calls = [];
  let listener;
  const client = {
    auth: {
      onAuthStateChange(callback) { listener = callback; return { data: { subscription: { unsubscribe() {} } } }; },
      async getSession() { return { data: { session: signedIn ? {} : null }, error: null }; },
      async getUser() { return { data: { user: { id: 'member-id', email_confirmed_at: confirmed ? '2026-09-14' : null } }, error: null }; },
      async signInWithPassword(input) { calls.push(['login', input]); signedIn = true; return { error: null }; },
      async signUp(input) { calls.push(['signup', input]); return { error: null }; },
      async resend(input) { calls.push(['resend', input]); return { error: null }; },
      async resetPasswordForEmail(...input) { calls.push(['recover', ...input]); return { error: null }; },
      async exchangeCodeForSession(code) { calls.push(['exchange', code]); return { error: null }; },
      async setSession(tokens) { calls.push(['setSession', tokens]); return { error: null }; },
      async updateUser(input) { calls.push(['update', input]); return { error: null }; },
      async signOut(input) { calls.push(['logout', input]); signedIn = false; listener('SIGNED_OUT'); return { error: null }; },
    },
    async rpc(name, input) {
      calls.push([name, input]);
      return { data: name === 'my_membership' ? membership ? [{ status: membership }] : [] : {}, error: null };
    },
  };
  const auth = new SupabaseAuth(client, 'https://attune.example');
  const sessions = [];
  auth.session$.subscribe(value => sessions.push(value));
  return { client, auth, calls, sessions, event: event => listener(event) };
}

test('restoration waits for server-verified identity and membership before publishing', async () => {
  const app = setup();
  assert.equal(app.sessions.length, 0);
  assert.deepEqual(await app.auth.getAccess(), { userId: 'member-id', membership: 'active' });
  assert.equal(app.sessions.length, 1);
});

test('unverified users, guests, pending members and suspended users have distinct access', async () => {
  assert.equal(await setup({ confirmed: false }).auth.getAccess(), null);
  assert.equal(await setup({ signedIn: false }).auth.getAccess(), null);
  assert.equal((await setup({ membership: null }).auth.getAccess()).membership, 'pending');
  assert.equal((await setup({ membership: 'suspended' }).auth.getAccess()).membership, 'suspended');
});

test('server or membership failures fail closed and do not trust stored sessions', async () => {
  const app = setup();
  await app.auth.getAccess();
  app.client.rpc = async () => ({ data: null, error: new Error('offline') });
  await assert.rejects(app.auth.getAccess(), /offline/);
  assert.equal(app.sessions.at(-1), null);
});

test('signup sends credentials only and does not consume or store an invitation', async () => {
  const app = setup({ signedIn: false });
  await app.auth.signUp({ email: ' Member@Example.com ', password: 'password123', username: 'member', practice: 'test', inviteCode: 'secret-invite' });
  assert.deepEqual(app.calls, [['signup', { email: 'member@example.com', password: 'password123', options: { emailRedirectTo: 'https://attune.example/auth/callback' } }]]);
  assert.equal(app.sessions.length, 0);
});

test('sign in normalizes email and propagates incorrect-password failures', async () => {
  const app = setup();
  await app.auth.signIn({ email: ' Member@Example.com ', password: 'password123' });
  assert.equal(app.calls[0][1].email, 'member@example.com');
  app.client.auth.signInWithPassword = async () => ({ error: new Error('Invalid login credentials') });
  await assert.rejects(app.auth.signIn({ email: 'member@example.com', password: 'wrong' }), /Invalid login/);
});

test('verification resend and recovery use fixed same-origin callback destinations', async () => {
  const app = setup();
  await app.auth.resendVerification(' Member@Example.com ');
  await app.auth.requestPasswordReset(' Member@Example.com ');
  assert.equal(app.calls[0][1].type, 'signup');
  assert.equal(app.calls[0][1].options.emailRedirectTo, 'https://attune.example/auth/callback');
  assert.deepEqual(app.calls[1], ['recover', 'member@example.com', { redirectTo: 'https://attune.example/auth/callback?recovery=1' }]);
});

test('missing and expired callback codes fail even with a previous session', async () => {
  const app = setup();
  await assert.rejects(app.auth.completeCallback(''), /missing or expired/);
  assert.equal(app.calls.length, 0);
  app.client.auth.exchangeCodeForSession = async () => ({ error: new Error('expired') });
  await assert.rejects(app.auth.completeCallback('used-code'), /invalid or expired/);
});

test('implicit email links establish a session using both tokens', async () => {
  const app = setup({ signedIn: false });
  const tokens = { access_token: 'access', refresh_token: 'refresh' };
  await app.auth.completeCallback('', tokens);
  assert.deepEqual(app.calls, [['setSession', tokens]]);
});

test('incomplete or rejected implicit links fail even with a previous session', async () => {
  const app = setup();
  await assert.rejects(app.auth.completeCallback('', { access_token: 'access', refresh_token: '' }), /missing or expired/);
  assert.equal(app.calls.length, 0);
  app.client.auth.setSession = async () => ({ error: new Error('expired') });
  await assert.rejects(app.auth.completeCallback('', { access_token: 'access', refresh_token: 'refresh' }), /invalid or expired/);
});

test('a different browser gets sign-in guidance instead of a false expiry message', async () => {
  for (const error of [
    { name: 'AuthPKCECodeVerifierMissingError' },
    { code: 'pkce_code_verifier_not_found' },
    { code: 'bad_code_verifier' },
  ]) {
    const app = setup({ signedIn: false });
    app.client.auth.exchangeCodeForSession = async () => ({ error });
    await assert.rejects(app.auth.completeCallback('email-code'), failure => {
      assert.match(failure.message, /email may already be verified/);
      assert.match(failure.message, /try signing in with your email and password/);
      assert.doesNotMatch(failure.message, /expired/);
      return true;
    });
    assert.equal(app.sessions.length, 0, 'Failure must not grant a session');
  }
});

test('invitation redemption preserves code case and uses only the atomic RPC', async () => {
  const app = setup();
  await app.auth.redeemInvitation({ inviteCode: ' aBc123 ', username: ' New-Member ', practice: ' Facilitator ', displayName: ' ' });
  assert.deepEqual(app.calls[0], ['redeem_invitation', { code: 'aBc123', username: 'new-member', display_name: null, practice: 'Facilitator' }]);
  assert.equal(app.sessions.at(-1).membership, 'active');
});

test('rejected invitations never publish membership', async () => {
  const app = setup({ membership: null });
  app.client.rpc = async () => ({ error: { code: '22023', message: 'invalid' }, data: null });
  await assert.rejects(app.auth.redeemInvitation({ inviteCode: 'bad', username: 'member', practice: 'test' }), /invalid, expired, or already used/);
  assert.equal(app.sessions.length, 0);
});

test('password change validates length and revokes refresh sessions only after success', async () => {
  const app = setup();
  await assert.rejects(app.auth.updatePassword('short'), /at least 8/);
  assert.equal(app.calls.length, 0);
  await app.auth.updatePassword('new-password123');
  assert.deepEqual(app.calls.slice(0, 2), [['update', { password: 'new-password123' }], ['logout', { scope: 'global' }]]);
  assert.equal(app.sessions.at(-1), null);
});

test('failed password changes do not report success or sign out', async () => {
  const app = setup();
  app.client.auth.updateUser = async () => ({ error: new Error('expired') });
  await assert.rejects(app.auth.updatePassword('new-password123'), /expired/);
  assert.equal(app.calls.length, 0);
});

test('logout in another tab wins over an in-flight access check', async () => {
  const app = setup();
  let resolve;
  app.client.auth.getUser = () => new Promise(r => { resolve = r; });
  const access = app.auth.getAccess();
  await new Promise(setImmediate);
  app.event('SIGNED_OUT');
  resolve({ data: { user: { id: 'member-id', email_confirmed_at: '2026-09-14' } }, error: null });
  assert.equal(await access, null, 'Route guards must not accept a stale result after logout');
  assert.deepEqual(app.sessions, [null]);
});
