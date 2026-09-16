const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emailCallback, emailCallbackPath } = require('../.angular/mock-tests/utils/auth-callback');

test('site-root recovery and magic links reach the callback before protected routes', () => {
  for (const type of ['recovery', 'magiclink']) {
    const url = new URL(`http://localhost:4200/#access_token=access&refresh_token=refresh&type=${type}`);
    const path = emailCallbackPath(url);
    assert.equal(path, `/auth/callback${url.hash}`);
    const callback = emailCallback(new URL(path, url.origin));
    assert.deepEqual(callback.tokens, { access_token: 'access', refresh_token: 'refresh' });
    assert.equal(callback.recovery, type === 'recovery');
  }
});

test('PKCE recovery links retain their code and destination', () => {
  const url = new URL('http://localhost:4200/auth/callback?code=one-use&recovery=1');
  assert.equal(emailCallbackPath(url), '/auth/callback?code=one-use&recovery=1');
  assert.equal(emailCallback(url).code, 'one-use');
  assert.equal(emailCallback(url).recovery, true);
});

test('expired email links reach callback error handling, including fragment errors', () => {
  for (const suffix of ['?error=access_denied', '#error=access_denied&error_code=otp_expired']) {
    const url = new URL(`http://localhost:4200/${suffix}`);
    assert.equal(emailCallbackPath(url), `/auth/callback${suffix}`);
    assert.equal(emailCallback(url).error, true);
  }
});

test('ordinary app URLs are not treated as email callbacks', () => {
  for (const path of ['/', '/login', '/library#playlist', '/join?invite=example']) {
    assert.equal(emailCallbackPath(new URL(path, 'http://localhost:4200')), null);
  }
});
