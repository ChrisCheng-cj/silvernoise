import defaults from '../public/project-defaults.json' with { type: 'json' };

const fonts = ['sans', 'serif', 'mono', 'chinese'];
const alignments = ['left', 'center', 'right'];
const known = id => Object.hasOwn(defaults, id);
const personalCategories = {'personal-3d':'个人创作','personal-motion':'个人创作','personal-visual':'个人创作'};
const validCategory = id => known(id) || Object.hasOwn(personalCategories, id);
const projectData = (data, id) => ({ ...data, brand: data.brand || (known(id) ? id : '') });
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
function owner(request, env) {
  return Boolean(env.PORTFOLIO_OWNER_EMAIL && request.headers.get('oai-authenticated-user-id') && request.headers.get('oai-authenticated-user-email')?.toLowerCase() === env.PORTFOLIO_OWNER_EMAIL.toLowerCase());
}
function validSource(value) {
  return typeof value === 'string' && (/^\/assets\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg|gif|mp4|webm)$/.test(value) || /^\/media\/[a-f0-9-]+\.(webp|png|jpg|gif|mp4|webm)$/.test(value));
}
function text(value, limit) { if (typeof value !== 'string' || value.length > limit) throw Error('文字长度超出限制'); return value.trim(); }
function style(value, title = false) {
  if (!value || !fonts.includes(value.font) || !alignments.includes(value.align) || ![400, 500, 600, 700].includes(value.weight) || !Number.isInteger(value.size) || value.size < 12 || value.size > (title ? 72 : 36)) throw Error('文字样式无效');
  if (value.color !== undefined && !/^#[0-9a-f]{6}$/i.test(value.color)) throw Error('文字颜色无效');
  return { font: value.font, align: value.align, weight: value.weight, size: value.size, ...(value.color ? {color:value.color} : {}) };
}
export function validate(data) {
  if (!data || !Array.isArray(data.media) || data.media.length > 60) throw Error('最多添加 60 个媒体文件');
  const result = { title: text(data.title, 200), client: text(data.client, 100), date: text(data.date, 100), description: text(data.description, 15000), cover: null, titleStyle: style(data.titleStyle, true), bodyStyle: style(data.bodyStyle), media: [] };
  if (!result.title) throw Error('请填写项目标题');
  if (data.cover) { if (!validSource(data.cover.src) || /\.(mp4|webm)$/.test(data.cover.src)) throw Error('封面必须是图片'); result.cover = { src: data.cover.src, alt: text(data.cover.alt || '', 300) }; }
  for (const item of data.media) {
    if (item.type === 'text') { result.media.push({type:'text',text:text(item.text,15000),style:style(item.style)}); continue; }
    if (!validSource(item.src) || !['image', 'video'].includes(item.type) || (item.type === 'video') !== /\.(mp4|webm)$/.test(item.src)) throw Error('媒体格式无效');
    result.media.push({ type: item.type, src: item.src, alt: text(item.alt || '', 300), caption: text(item.caption || '', 1000) });
  }
  return result;
}
function sniff(bytes) {
  const s = new TextDecoder('latin1').decode(bytes.slice(0, 32));
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ['jpg', 'image/jpeg'];
  if (bytes[0] === 137 && s.slice(1, 4) === 'PNG') return ['png', 'image/png'];
  if (/^GIF8[79]a/.test(s)) return ['gif', 'image/gif'];
  if (s.startsWith('RIFF') && s.slice(8, 12) === 'WEBP') return ['webp', 'image/webp'];
  if (s.slice(4, 8) === 'ftyp' && /isom|iso2|mp41|mp42|avc1|M4V /.test(s.slice(8))) return ['mp4', 'video/mp4'];
  if (bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163) return ['webm', 'video/webm'];
  return null;
}
async function handle(request, env) {
  const url = new URL(request.url), path = url.pathname;
  const isOwner = owner(request, env);
  if (path === '/api/session') return json({ canEdit: isOwner });
  if (path.startsWith('/api/')) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      if (!isOwner) return json({ error: '只有网站所有者可以编辑' }, 403);
      if (request.headers.get('Origin') !== url.origin || request.headers.get('X-Portfolio-Editor') !== '1') return json({ error: '请从本站编辑器提交' }, 403);
    }
    if (path === '/api/projects' && request.method === 'GET') {
      const includeDrafts = url.searchParams.get('editor') === '1' && isOwner;
      const rows = await env.DB.prepare(includeDrafts ? 'SELECT id, published, draft FROM projects ORDER BY rowid' : 'SELECT id, published FROM projects WHERE published IS NOT NULL ORDER BY rowid').all();
      const projects = Object.fromEntries(Object.entries(defaults).map(([id, data]) => [id, projectData(data, id)]));
      for (const row of rows.results) {
        if (row.published) projects[row.id] = projectData(JSON.parse(row.published), row.id);
        else if (includeDrafts && !known(row.id)) projects[row.id] = { ...projectData(JSON.parse(row.draft), row.id), isDraft: true };
      }
      return json(projects);
    }
    if (path === '/api/projects' && request.method === 'POST') {
      const raw = await request.text();
      if (raw.length > 2000) return json({ error: '请求过大' }, 400);
      let body;try { body = JSON.parse(raw); } catch { return json({ error: '请求无效' }, 400); }
      if (!validCategory(body.brand) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(body.requestId)) return json({ error: '请选择有效分类' }, 400);
      const id = body.brand + '-' + body.requestId;
      const data = { title: '未命名项目', client: defaults[body.brand]?.client || personalCategories[body.brand], date: '', description: '', brand: body.brand, cover: null, titleStyle: { font:'sans',size:44,weight:400,align:'left' }, bodyStyle: { font:'sans',size:16,weight:400,align:'left' }, media: [] };
      await env.DB.prepare('INSERT OR IGNORE INTO projects (id,draft,published,revision,updated_at,published_at) VALUES (?,?,NULL,1,?,NULL)').bind(id, JSON.stringify(data), new Date().toISOString()).run();
      return json({ id }, 201);
    }
    const match = path.match(/^\/api\/projects\/([a-z0-9-]+)$/);
    if (match) {
      const id = match[1];
      const row = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
      if (!known(id) && !row) return json({ error: '项目不存在' }, 404);
      if (request.method === 'GET') {
        const draft = url.searchParams.get('draft') === '1';
        if (draft && !isOwner) return json({ error: '无权查看草稿' }, 403);
        const data = row && (draft ? row.draft : row.published);
        if (!data && !known(id)) return json({ error: '项目尚未发布' }, 404);
        return json({ data: projectData(data ? JSON.parse(data) : defaults[id], id), revision: draft ? row?.revision || 0 : undefined, updatedAt: draft ? row?.updated_at : undefined, publishedAt: row?.published_at || null });
      }
      if (request.method === 'PUT') {
        if (Number(request.headers.get('Content-Length')) > 150000) return json({ error: '内容过大' }, 413);
        const raw = await request.text();
        if (raw.length > 150000) return json({ error: '内容过大' }, 413);
        let body, data;
        try { body = JSON.parse(raw); data = validate(body.data); } catch (e) { return json({ error: e.message }, 400); }
        data.brand = known(id) ? id : JSON.parse(row.draft).brand;
        if (!Number.isInteger(body.revision) || body.revision < 0 || !['draft', 'publish'].includes(body.action)) return json({ error: '保存请求无效' }, 400);
        const now = new Date().toISOString(), content = JSON.stringify(data), publishing = body.action === 'publish';
        const result = await env.DB.prepare(`INSERT INTO projects (id,draft,published,revision,updated_at,published_at) SELECT ?,?,?,1,?,? WHERE ?=0 ON CONFLICT(id) DO UPDATE SET draft=excluded.draft,published=CASE WHEN ? THEN excluded.draft ELSE projects.published END,revision=projects.revision+1,updated_at=excluded.updated_at,published_at=CASE WHEN ? THEN excluded.updated_at ELSE projects.published_at END WHERE projects.revision=?`).bind(id, content, publishing ? content : null, now, publishing ? now : null, body.revision, publishing ? 1 : 0, publishing ? 1 : 0, body.revision).run();
        // Existing documents with a nonzero revision cannot use the insertion branch.
        let changed = result.meta.changes;
        if (!changed && body.revision > 0) {
          const update = await env.DB.prepare('UPDATE projects SET draft=?,published=CASE WHEN ? THEN ? ELSE published END,revision=revision+1,updated_at=?,published_at=CASE WHEN ? THEN ? ELSE published_at END WHERE id=? AND revision=?').bind(content, publishing ? 1 : 0, content, now, publishing ? 1 : 0, now, id, body.revision).run();
          changed = update.meta.changes;
        }
        if (!changed) return json({ error: '其他窗口已修改此项目。请复制未保存的内容，再重新载入。' }, 409);
        return json({ revision: body.revision + 1, updatedAt: now, published: publishing });
      }
      return json({ error: '请求方式不支持' }, 405);
    }
    if (path === '/api/media' && request.method === 'POST') {
      const max = 50 * 1024 * 1024;
      if (Number(request.headers.get('Content-Length')) > max + 10000) return json({ error: '单个文件不能超过 50 MB' }, 413);
      const form = await request.formData(), file = form.get('file');
      if (!file || typeof file.arrayBuffer !== 'function' || file.size > max || file.size === 0) return json({ error: '请选择不超过 50 MB 的图片或视频' }, 400);
      const format = sniff(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
      if (!format) return json({ error: '仅支持 JPG、PNG、WebP、GIF、MP4、WebM，不接受 PDF' }, 400);
      const key = `media/${crypto.randomUUID()}.${format[0]}`;
      await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: format[1] } });
      return json({ src: '/' + key, type: format[1].startsWith('video') ? 'video' : 'image', alt: '', caption: '' });
    }
    return json({ error: '接口不存在' }, 404);
  }
  const projectPage = path.match(/^\/projects\/([a-z0-9-]+)(?:\.html)?\/?$/);
  if (projectPage && !known(projectPage[1])) {
    const row = await env.DB.prepare('SELECT published FROM projects WHERE id=?').bind(projectPage[1]).first();
    if (!row || (!row.published && !(isOwner && url.searchParams.get('preview') === '1'))) return new Response('项目不存在或尚未发布', { status:404, headers:{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'no-store'} });
    const template = new URL('/project', url.origin);
    return env.ASSETS.fetch(new Request(template, { method:request.method, headers:request.headers }));
  }
  if (path.startsWith('/media/')) {
    if (!validSource(path)) return new Response('Not found', { status: 404 });
    const object = await env.BUCKET.get(path.slice(1), { range: request.headers });
    if (!object) return new Response('Not found', { status: 404 });
    const headers = new Headers({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes', 'ETag': object.httpEtag });
    object.writeHttpMetadata(headers);
    const partial = request.headers.has('Range') && object.range;
    if (partial) headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
    headers.set('Content-Length', String(object.range?.length ?? object.size));
    return new Response(request.method === 'HEAD' ? null : object.body, { status: partial ? 206 : 200, headers });
  }
  return env.ASSETS.fetch(request);
}
export default { async fetch(request, env) { try { return await handle(request, env); } catch (e) { console.error('Portfolio request failed', e.message); return json({ error: '服务暂时不可用，请稍后重试；未确认保存的内容请保留在当前窗口。' }, 503); } } };
