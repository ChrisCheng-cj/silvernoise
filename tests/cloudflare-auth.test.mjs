import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyOwner, trustedRequest } from '../cloudflare/access.js';
import worker from '../cloudflare/worker.js';

const env = { CF_ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com', CF_ACCESS_AUD: 'test-app', PORTFOLIO_OWNER_EMAIL: 'owner@example.test' };
const { publicKey, privateKey } = await generateKeyPair('RS256');
async function token(overrides = {}) {
  return new SignJWT({ email: env.PORTFOLIO_OWNER_EMAIL, sub: 'owner-id', iss: 'https://' + env.CF_ACCESS_TEAM_DOMAIN, aud: env.CF_ACCESS_AUD, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+300, ...overrides }).setProtectedHeader({ alg: 'RS256' }).sign(privateKey);
}
test('only valid owner tokens are accepted; wrong audience, issuer, email and expired tokens fail', async () => {
  for (const claims of [{}, { aud: 'other-app' }, { iss: 'https://other.cloudflareaccess.com' }, { email: 'visitor@example.test' }, { exp: 1 }]) {
    const request = new Request('https://portfolio.test/api/session', { headers: { 'Cf-Access-Jwt-Assertion': await token(claims) } });
    assert.equal(Boolean(await verifyOwner(request, env, publicKey)), Object.keys(claims).length === 0);
  }
  const cookieRequest = new Request('https://portfolio.test/', { headers: { Cookie: 'CF_Authorization=' + await token() } });
  assert.equal((await verifyOwner(cookieRequest, env, publicKey)).id, 'owner-id');
  const { publicKey: wrongKey } = await generateKeyPair('RS256');
  assert.equal(await verifyOwner(cookieRequest, env, wrongKey), null);
});
test('forged Sites headers cannot access the independent deployment', async () => {
  const request = new Request('https://portfolio.test/api/session', { headers: { 'oai-authenticated-user-id': 'owner', 'oai-authenticated-user-email': env.PORTFOLIO_OWNER_EMAIL } });
  assert.equal(trustedRequest(request, null).headers.has('oai-authenticated-user-id'), false);
  assert.equal((await worker.fetch(request, env, {})).status, 403);
  assert.equal((await worker.fetch(new Request('https://portfolio.test/assets/omega-hd.mp4'), {}, {})).status, 403);
});
