#!/usr/bin/env node
/**
 * 本地写作台
 * 用法：npm run write
 *
 * 启动后会在 http://127.0.0.1:4321 打开一个简单的编辑器：
 * - 新建 / 编辑 source/_posts 下的 Markdown 文章
 * - 上传图片到 source/images/posts
 * - 实时预览 Markdown
 * - 自动启动 Hexo 预览服务（4000 端口）
 *
 * 这个服务只监听本机，不要把它暴露到公网。
 */

import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exec, spawn } from 'node:child_process';
import yaml from 'js-yaml';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const IMAGES_DIR = path.join(ROOT, 'source', 'images', 'posts');
const UI_DIR = path.join(__dirname, 'writer');

const HEXO_PORT = 4000;
const WRITER_PORT_START = 4321;
let hexoProcess = null;
let writerPort = WRITER_PORT_START;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

/* ---------------- 工具函数 ---------------- */

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('内容太大，单次最多 12MB'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(input) {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())} ${pad(input.getHours())}:${pad(input.getMinutes())}:${pad(input.getSeconds())}`;
  }
  const raw = String(input || '').trim();
  if (!raw) {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  const normalized = raw.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19);
  return normalized.length >= 16 ? normalized : `${normalized} 00:00:00`;
}

function dateParts(value) {
  const s = formatDate(value);
  return { y: s.slice(0, 4), m: s.slice(5, 7), d: s.slice(8, 10) };
}

function slugify(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/['"“”‘’《》<>]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function splitFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw };
  let data = {};
  try {
    data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) || {};
  } catch {
    data = {};
  }
  return { data, body: raw.slice(match[0].length) };
}

function toArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return (Array.isArray(value) ? value : [value]).map(v => String(v).trim()).filter(Boolean);
}

function toTagArray(value) {
  if (value === undefined || value === null || value === '') return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap(v => String(v).split(/[,，、]/))
    .map(v => v.trim())
    .filter(Boolean);
}

function postUrl(slug, date) {
  const { y, m, d } = dateParts(date);
  return `/${y}/${m}/${d}/${encodeURIComponent(slug)}/`;
}

async function listPosts() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    if (entry.name.startsWith('_')) continue;
    const file = entry.name;
    const full = path.join(POSTS_DIR, file);
    const stat = await fs.stat(full);
    const raw = await fs.readFile(full, 'utf8');
    const { data } = splitFrontMatter(raw);
    const slug = file.replace(/\.md$/, '');
    posts.push({
      file,
      slug,
      title: String(data.title || slug),
      date: formatDate(data.date || stat.mtime),
      categories: toArray(data.categories),
      tags: toArray(data.tags),
      description: String(data.description || ''),
      cover: String(data.cover || ''),
      url: postUrl(slug, data.date || stat.mtime),
      mtime: stat.mtimeMs
    });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

async function getPost(file) {
  if (!file || !file.endsWith('.md') || file.includes('/') || file.includes('\\')) {
    throw new Error('无效的文件名');
  }
  const full = path.join(POSTS_DIR, file);
  const raw = await fs.readFile(full, 'utf8');
  const { data, body } = splitFrontMatter(raw);
  const slug = file.replace(/\.md$/, '');
  return {
    file,
    slug,
    title: String(data.title || slug),
    date: formatDate(data.date),
    categories: toArray(data.categories),
    tags: toArray(data.tags),
    description: String(data.description || ''),
    cover: String(data.cover || ''),
    body,
    url: postUrl(slug, data.date)
  };
}

async function savePost(payload) {
  const title = String(payload.title || '').trim();
  if (!title) throw new Error('标题不能为空');

  const date = formatDate(payload.date);
  const categories = toArray(payload.category ?? payload.categories);
  const tags = toTagArray(payload.tags);
  const description = String(payload.description || '').trim();
  const cover = String(payload.cover || '').trim();
  const body = String(payload.body || '').replace(/\r\n/g, '\n');

  let file = payload.file ? String(payload.file) : '';
  let slug;
  const isNew = !file;

  if (isNew) {
    const wanted = slugify(payload.slug || title) || `post-${Date.now()}`;
    slug = wanted;
    let candidate = `${slug}.md`;
    let n = 2;
    while (true) {
      try {
        await fs.access(path.join(POSTS_DIR, candidate));
        candidate = `${slug}-${n++}.md`;
      } catch {
        break;
      }
    }
    if (candidate !== `${slug}.md`) {
      slug = candidate.replace(/\.md$/, '');
    }
    file = candidate;
  } else {
    if (!file.endsWith('.md') || file.includes('/') || file.includes('\\')) {
      throw new Error('无效的文件名');
    }
    slug = file.replace(/\.md$/, '');
  }

  const data = {
    title,
    date,
    categories,
    tags,
    ...(description ? { description } : {}),
    ...(cover ? { cover } : {})
  };
  const frontMatter = yaml.dump(data, { lineWidth: -1, noRefs: true, quotingType: '"' });
  const content = `---\n${frontMatter}---\n\n${body.trim()}\n`;
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.writeFile(path.join(POSTS_DIR, file), content, 'utf8');

  return { file, slug, url: postUrl(slug, date), isNew };
}

async function saveImage(name, dataUrl) {
  const match = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(String(dataUrl || ''));
  if (!match) throw new Error('只支持 PNG / JPEG / WebP / GIF 图片');
  const mime = match[1].toLowerCase();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg';
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 8 * 1024 * 1024) throw new Error('图片不能超过 8MB');

  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const base = slugify(String(name || 'image').replace(/\.[^.]+$/, '')) || 'image';
  const filename = `${stamp}-${base}.${ext}`;
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.writeFile(path.join(IMAGES_DIR, filename), buffer);
  return { url: `/images/posts/${filename}`, markdown: `![${base}](/images/posts/${filename})` };
}

/* ---------------- 端口 / 进程 ---------------- */

function isPortOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const done = value => {
      socket.destroy();
      resolve(value);
    };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.setTimeout(700, () => done(false));
  });
}

async function ensureHexo() {
  if (await isPortOpen(HEXO_PORT)) {
    console.log(`[写作台] 检测到 ${HEXO_PORT} 端口已有服务，直接使用。`);
    return true;
  }
  console.log('[写作台] 正在启动 Hexo 预览服务...');
  hexoProcess = spawn('npx hexo server --port 4000', {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true
  });
  hexoProcess.on('exit', code => {
    console.log(`[写作台] Hexo 预览服务已退出（${code}）。`);
    hexoProcess = null;
  });
  for (let i = 0; i < 40; i++) {
    if (await isPortOpen(HEXO_PORT)) {
      console.log('[写作台] Hexo 预览服务已就绪。');
      return true;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.warn('[写作台] Hexo 预览服务启动超时，仍可编辑文章。');
  return false;
}

async function findPort(start) {
  for (let port = start; port < start + 30; port++) {
    if (!(await isPortOpen(port))) return port;
  }
  throw new Error('找不到可用的端口');
}

function openBrowser(url) {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

/* ---------------- HTTP 服务 ---------------- */

async function serveStatic(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname === '/' || pathname === '/index.html') {
      return serveStatic(res, path.join(UI_DIR, 'index.html'));
    }
    if (pathname === '/writer.css') {
      return serveStatic(res, path.join(UI_DIR, 'writer.css'));
    }
    if (pathname === '/writer.js') {
      return serveStatic(res, path.join(UI_DIR, 'writer.js'));
    }
    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      return res.end();
    }

    // 让编辑器里能直接预览已上传的图片
    if (pathname.startsWith('/images/')) {
      const rel = pathname.slice('/images/'.length);
      const base = path.join(ROOT, 'source', 'images');
      const full = path.join(base, rel);
      if (!full.startsWith(base)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      return serveStatic(res, full);
    }

    if (pathname === '/api/status') {
      return json(res, 200, {
        ok: true,
        hexoRunning: await isPortOpen(HEXO_PORT),
        hexoUrl: `http://localhost:${HEXO_PORT}/`,
        postsDir: path.relative(ROOT, POSTS_DIR)
      });
    }

    if (pathname === '/api/posts' && req.method === 'GET') {
      return json(res, 200, { ok: true, posts: await listPosts() });
    }

    if (pathname === '/api/post' && req.method === 'GET') {
      const file = url.searchParams.get('file');
      return json(res, 200, { ok: true, post: await getPost(file) });
    }

    if (pathname === '/api/save' && req.method === 'POST') {
      const payload = JSON.parse(await readBody(req));
      const result = await savePost(payload);
      return json(res, 200, { ok: true, ...result });
    }

    if (pathname === '/api/preview' && req.method === 'POST') {
      const payload = JSON.parse(await readBody(req));
      const html = marked.parse(String(payload.body || ''), { gfm: true, breaks: true });
      return json(res, 200, { ok: true, html });
    }

    if (pathname === '/api/upload' && req.method === 'POST') {
      const payload = JSON.parse(await readBody(req));
      const result = await saveImage(payload.name, payload.dataUrl);
      return json(res, 200, { ok: true, ...result });
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (error) {
    console.error('[写作台]', error);
    json(res, 400, { ok: false, error: error.message || String(error) });
  }
});

/* ---------------- 启动 ---------------- */

(async () => {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  writerPort = await findPort(WRITER_PORT_START);
  await ensureHexo();

  server.listen(writerPort, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${writerPort}/`;
    console.log('');
    console.log('  ✍️  写作台已启动');
    console.log(`  编辑器: ${url}`);
    console.log(`  预览:   http://localhost:${HEXO_PORT}/`);
    console.log('  按 Ctrl+C 停止');
    console.log('');
    if (!process.env.WRITER_NO_OPEN) openBrowser(url);
  });
})();

function shutdown() {
  if (hexoProcess) {
    try { hexoProcess.kill(); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
