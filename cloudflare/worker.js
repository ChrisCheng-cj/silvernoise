import portfolio from '../worker/index.js';
import { verifyOwner, trustedRequest } from './access.js';

export default {
  async fetch(request, env, ctx) {
    const identity = await verifyOwner(request, env);
    // Keep the original site's owner-only audience during migration, including media.
    if (!identity) return Response.json({ error: '请通过 Cloudflare Access 使用网站所有者邮箱登录。' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    const url = new URL(request.url);
    if (url.pathname === '/signin-with-chatgpt') return Response.redirect(new URL('/', url).href, 302);
    return portfolio.fetch(trustedRequest(request, identity), env, ctx);
  },
};
