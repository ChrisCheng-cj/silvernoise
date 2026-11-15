import { createRemoteJWKSet, jwtVerify } from 'jose';

const verifiers = new Map();
export async function verifyOwner(request, env, keyOverride) {
  const team = env.CF_ACCESS_TEAM_DOMAIN;
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team || '') || !env.CF_ACCESS_AUD || !env.PORTFOLIO_OWNER_EMAIL) return null;
  const cookie = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('CF_Authorization='))?.slice(17);
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie;
  if (!token || token.length > 20000) return null;
  const issuer = `https://${team}`;
  try {
    if (!keyOverride && !verifiers.has(issuer)) verifiers.set(issuer, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)));
    const { payload } = await jwtVerify(token, keyOverride || verifiers.get(issuer), {
      issuer, audience: env.CF_ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'email'],
    });
    if (typeof payload.email !== 'string' || payload.email.toLowerCase() !== env.PORTFOLIO_OWNER_EMAIL.toLowerCase()) return null;
    return { id: payload.sub, email: payload.email };
  } catch { return null; }
}

export function trustedRequest(request, identity) {
  const headers = new Headers(request.headers);
  // Discard caller-supplied Sites headers; only a verified Access token grants editing.
  headers.delete('oai-authenticated-user-id');
  headers.delete('oai-authenticated-user-email');
  if (identity) {
    headers.set('oai-authenticated-user-id', identity.id);
    headers.set('oai-authenticated-user-email', identity.email);
  }
  return new Request(request, { headers });
}
