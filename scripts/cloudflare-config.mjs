import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['CF_DATABASE_ID', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD', 'PORTFOLIO_OWNER_EMAIL'];
for (const name of required) if (!process.env[name]) throw Error(`Missing deployment setting: ${name}`);
if (!/^[a-f0-9-]{36}$/.test(process.env.CF_DATABASE_ID) || process.env.CF_DATABASE_ID === '00000000-0000-4000-8000-000000000000') throw Error('Use a real Cloudflare D1 database ID');
if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(process.env.CF_ACCESS_TEAM_DOMAIN)) throw Error('Invalid Cloudflare Access team domain');
const config = {
  name: 'silvernoise', main: '../cloudflare/worker.js', compatibility_date: '2026-05-15', workers_dev: true, preview_urls: false,
  assets: { directory: '../public', binding: 'ASSETS', run_worker_first: true },
  d1_databases: [{ binding: 'DB', database_name: 'silvernoise-content', database_id: process.env.CF_DATABASE_ID, migrations_dir: '../drizzle' }],
  r2_buckets: [{ binding: 'BUCKET', bucket_name: 'silvernoise-media' }],
  vars: Object.fromEntries(required.filter(n => n !== 'CF_DATABASE_ID').map(n => [n, process.env[n]])),
};
await fs.mkdir(path.join(root, '.cloudflare'), { recursive: true });
await fs.writeFile(path.join(root, '.cloudflare/wrangler.json'), JSON.stringify(config, null, 2));
console.log('Cloudflare deployment configuration ready.');
