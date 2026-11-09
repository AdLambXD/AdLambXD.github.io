const el = id => document.getElementById(id);

const state = {
  posts: [],
  current: null,
  isNew: true,
  dirty: false,
  slugTouched: false,
  previewTimer: null
};

/* ---------------- 基础工具 ---------------- */

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `请求失败（${res.status}）`);
  }
  return data;
}

function pad(n) { return String(n).padStart(2, '0'); }

function nowInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(value) {
  if (!value) return nowInputValue();
  return String(value).replace(' ', 'T').slice(0, 16);
}

function fromDateInput(value) {
  return value ? `${value.replace('T', ' ')}:00` : '';
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function autoSlug(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/['"“”‘’《》<>]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function toast(message, isError = false) {
  const node = el('toast');
  node.textContent = message;
  node.classList.toggle('error', isError);
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2600);
}

function setDirty() {
  state.dirty = true;
  const node = el('saveState');
  node.textContent = '未保存';
  node.classList.add('dirty');
  schedulePreview();
}

function setClean(message = '已保存') {
  state.dirty = false;
  const node = el('saveState');
  node.textContent = message;
  node.classList.remove('dirty');
}

/* ---------------- 文章列表 ---------------- */

function renderList() {
  const keyword = el('search').value.trim().toLowerCase();
  const list = el('postList');
  const filtered = state.posts.filter(post => {
    if (!keyword) return true;
    return [post.title, ...(post.tags || []), ...(post.categories || [])]
      .join(' ')
      .toLowerCase()
      .includes(keyword);
  });

  if (!filtered.length) {
    list.innerHTML = `<p class="post-empty">${state.posts.length ? '没有匹配的文章。' : '还没有文章。点上面的「新建文章」开始写第一篇。'}</p>`;
    return;
  }

  list.innerHTML = '';
  for (const post of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'post-item';
    button.dataset.file = post.file;
    if (state.current && state.current.file === post.file) button.classList.add('active');
    button.innerHTML = `
      <span class="pi-title">${escapeHtml(post.title)}</span>
      <span class="pi-meta">${escapeHtml(post.date.slice(0, 10))}${post.categories?.[0] ? ' · ' + escapeHtml(post.categories[0]) : ''}</span>
    `;
    button.addEventListener('click', () => selectPost(post.file));
    list.appendChild(button);
  }
}

function setActive(file) {
  document.querySelectorAll('.post-item').forEach(node => {
    node.classList.toggle('active', node.dataset.file === file);
  });
}

async function loadPosts() {
  const data = await api('/api/posts');
  state.posts = data.posts || [];
  renderList();
}

/* ---------------- 表单 ---------------- */

function updateCoverPreview() {
  const cover = el('cover').value.trim();
  const img = el('coverPreview');
  if (!cover) {
    img.hidden = true;
    img.removeAttribute('src');
    return;
  }
  img.src = cover;
  img.hidden = false;
}

function fillForm(post) {
  el('title').value = post.title || '';
  el('date').value = post.date ? toDateInput(post.date) : nowInputValue();
  el('category').value = post.categories?.[0] || '随笔';
  el('tags').value = (post.tags || []).join(', ');
  el('slug').value = post.slug || '';
  el('slug').disabled = !state.isNew;
  el('description').value = post.description || '';
  el('cover').value = post.cover || '';
  el('body').value = post.body || '';
  updateCoverPreview();

  if (!state.isNew && post.url) {
    const link = el('viewLink');
    link.href = `http://localhost:4000${post.url}`;
    link.hidden = false;
  } else {
    el('viewLink').hidden = true;
  }

  document.title = `${post.title || '新文章'} · 写作台`;
  renderPreview();
}

function newPost() {
  if (state.dirty && !confirm('当前内容还没保存，确定要新建文章吗？')) return;
  state.current = null;
  state.isNew = true;
  state.slugTouched = false;
  state.dirty = false;
  fillForm({
    title: '',
    date: fromDateInput(nowInputValue()),
    categories: ['随笔'],
    tags: [],
    description: '',
    cover: '',
    body: '',
    slug: ''
  });
  el('slug').disabled = false;
  el('saveState').textContent = '新文章';
  el('saveState').classList.remove('dirty');
  renderList();
  el('title').focus();
  document.querySelector('.sidebar')?.classList.remove('open');
}

async function selectPost(file) {
  if (state.dirty && !confirm('当前内容还没保存，确定要切换文章吗？')) return;
  try {
    const data = await api(`/api/post?file=${encodeURIComponent(file)}`);
    state.current = data.post;
    state.isNew = false;
    state.slugTouched = true;
    fillForm(data.post);
    setClean('已保存');
    renderList();
    setActive(file);
    document.querySelector('.sidebar')?.classList.remove('open');
  } catch (error) {
    toast(error.message, true);
  }
}

function collect() {
  return {
    file: state.current?.file || '',
    title: el('title').value.trim(),
    slug: state.isNew ? el('slug').value.trim() : state.current?.slug || '',
    date: fromDateInput(el('date').value),
    category: el('category').value.trim(),
    tags: el('tags').value,
    description: el('description').value.trim(),
    cover: el('cover').value.trim(),
    body: el('body').value
  };
}

async function save() {
  const payload = collect();
  if (!payload.title) {
    toast('先给文章起个标题', true);
    el('title').focus();
    return;
  }

  const button = el('saveBtn');
  button.disabled = true;
  el('saveState').textContent = '保存中…';

  try {
    const result = await api('/api/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (state.isNew) {
      state.isNew = false;
      state.current = { ...payload, file: result.file, slug: result.slug, url: result.url };
      el('slug').value = result.slug;
      el('slug').disabled = true;
      el('viewLink').href = `http://localhost:4000${result.url}`;
      el('viewLink').hidden = false;
    }

    state.current.file = result.file;
    state.current.slug = result.slug;
    state.current.url = result.url;
    el('viewLink').href = `http://localhost:4000${result.url}`;
    el('viewLink').hidden = false;
    await loadPosts();
    setActive(result.file);
    setClean(`已保存 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    document.title = `${payload.title} · 写作台`;
    toast(`已保存：${result.file}`);
    setTimeout(renderPreview, 800);
  } catch (error) {
    toast(error.message, true);
    el('saveState').textContent = '保存失败';
    el('saveState').classList.add('dirty');
  } finally {
    button.disabled = false;
  }
}

/* ---------------- 预览 ---------------- */

function schedulePreview() {
  clearTimeout(state.previewTimer);
  state.previewTimer = setTimeout(renderPreview, 450);
}

async function renderPreview() {
  const body = el('body').value;
  const title = el('title').value.trim();
  const preview = el('preview');

  if (!body.trim()) {
    preview.innerHTML = `<h1>${escapeHtml(title || '未命名文章')}</h1><p class="preview-empty">正文还是空的。</p>`;
    return;
  }

  try {
    const previewBody = body.replace(/<!--\s*more\s*-->/gi, '\n\n---\n\n');
    const data = await api('/api/preview', {
      method: 'POST',
      body: JSON.stringify({ body: previewBody })
    });
    const meta = [
      el('date').value ? el('date').value.replace('T', ' ') : '',
      el('category').value.trim(),
      el('tags').value.trim()
    ].filter(Boolean).map(escapeHtml).join(' · ');

    preview.innerHTML = `
      <h1>${escapeHtml(title || '未命名文章')}</h1>
      ${meta ? `<p class="preview-meta">${meta}</p>` : ''}
      ${data.html}
    `;
  } catch {
    preview.innerHTML = '<p class="preview-empty">预览生成失败，检查一下写作台是否还在运行。</p>';
  }
}

/* ---------------- 上传图片 ---------------- */

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(file, mode) {
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    toast('图片不能超过 8MB', true);
    return;
  }
  try {
    const dataUrl = await readAsDataUrl(file);
    const data = await api('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ name: file.name, dataUrl })
    });
    if (mode === 'cover') {
      el('cover').value = data.url;
      updateCoverPreview();
      setDirty();
      toast('封面已上传');
    } else {
      insertAtCursor(`\n${data.markdown}\n`);
      toast('图片已插入正文');
    }
  } catch (error) {
    toast(error.message, true);
  }
}

/* ---------------- 编辑器操作 ---------------- */

function insertAtCursor(text) {
  const ta = el('body');
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  ta.setRangeText(text, start, end, 'end');
  ta.focus();
  setDirty();
}

function wrapSelection(before, after, placeholder = '文字') {
  const ta = el('body');
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end) || placeholder;
  const text = `${before}${selected}${after}`;
  ta.setRangeText(text, start, end, 'end');
  ta.focus();
  ta.setSelectionRange(start + before.length, start + before.length + selected.length);
  setDirty();
}

function prefixLine(prefix) {
  const ta = el('body');
  const start = ta.selectionStart;
  const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
  ta.setRangeText(prefix, lineStart, lineStart, 'end');
  ta.focus();
  setDirty();
}

/* ---------------- 服务器状态 ---------------- */

async function checkStatus() {
  const node = el('serverStatus');
  try {
    const data = await api('/api/status');
    node.className = `server-status ${data.hexoRunning ? 'on' : 'off'}`;
    node.innerHTML = `<i class="dot"></i>${data.hexoRunning ? '预览服务运行中' : '预览服务未连接'}`;
  } catch {
    node.className = 'server-status off';
    node.innerHTML = '<i class="dot"></i>写作台未连接';
  }
}

/* ---------------- 事件绑定 ---------------- */

function bindEvents() {
  el('newBtn').addEventListener('click', newPost);
  el('saveBtn').addEventListener('click', save);
  el('search').addEventListener('input', renderList);
  el('previewToggle').addEventListener('click', () => {
    const wrap = el('bodyWrap');
    wrap.classList.toggle('show-preview');
    el('previewToggle').textContent = wrap.classList.contains('show-preview') ? '编辑' : '预览';
  });

  el('menuBtn').addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  el('title').addEventListener('input', () => {
    if (state.isNew && !state.slugTouched) {
      el('slug').value = autoSlug(el('title').value);
    }
    setDirty();
  });

  el('slug').addEventListener('input', () => {
    state.slugTouched = true;
  });

  ['date', 'category', 'tags', 'description', 'body'].forEach(id => {
    el(id).addEventListener('input', setDirty);
  });

  el('cover').addEventListener('input', () => {
    updateCoverPreview();
    setDirty();
  });

  el('coverPreview').addEventListener('error', () => {
    el('coverPreview').hidden = true;
  });

  el('coverBtn').addEventListener('click', () => el('coverImage').click());
  el('coverImage').addEventListener('change', event => {
    const file = event.target.files?.[0];
    uploadFile(file, 'cover');
    event.target.value = '';
  });

  el('imageBtn').addEventListener('click', () => el('inlineImage').click());
  el('inlineImage').addEventListener('change', event => {
    const file = event.target.files?.[0];
    uploadFile(file, 'inline');
    event.target.value = '';
  });

  el('toolbar').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    switch (button.dataset.action) {
      case 'h2': prefixLine('## '); break;
      case 'bold': wrapSelection('**', '**', '加粗文字'); break;
      case 'italic': wrapSelection('*', '*', '斜体文字'); break;
      case 'link': wrapSelection('[', '](https://)', '链接文字'); break;
      case 'code': wrapSelection('`', '`', 'code'); break;
      case 'quote': prefixLine('> '); break;
      case 'list': prefixLine('- '); break;
    }
  });

  el('body').addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const ta = el('body');
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      setDirty();
    }
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      save();
    }
  });

  window.addEventListener('beforeunload', event => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

/* ---------------- 启动 ---------------- */

async function init() {
  bindEvents();
  el('date').value = nowInputValue();

  try {
    await loadPosts();
    if (state.posts.length) {
      await selectPost(state.posts[0].file);
    } else {
      newPost();
    }
  } catch (error) {
    toast(error.message, true);
    newPost();
  }

  checkStatus();
  setInterval(checkStatus, 6000);
}

init();
