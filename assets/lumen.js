(function () {
  'use strict';
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const KEY = 'lumen-theme';
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function applyTheme(mode, persist) {
    root.dataset.theme = mode;
    document.querySelector('meta[name="theme-color"]').content = mode === 'dark' ? '#131922' : '#F6F7F5';
    toggle.setAttribute('aria-pressed', String(mode === 'dark'));
    toggle.title = mode === 'dark' ? '切换到日间模式' : '切换到夜间模式';
    if (persist) { try { localStorage.setItem(KEY, mode); } catch (_) {} }
    document.dispatchEvent(new CustomEvent('lumen:themechange', { detail: { mode } }));
  }
  applyTheme(root.dataset.theme || 'light', false);
  toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    let stored;
    try { stored = localStorage.getItem(KEY); } catch (_) {}
    if (stored !== 'dark' && stored !== 'light') applyTheme(e.matches ? 'dark' : 'light', false);
  });

  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  function setMenu(open, restore = false) {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (open) nav.querySelector('a').focus();
    else if (restore) menu.focus();
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  header.addEventListener('focusout', e => { if (!header.contains(e.relatedTarget)) setMenu(false); });
  document.addEventListener('click', e => { if (!header.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  matchMedia('(min-width: 768px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  const prose = document.getElementById('prose');
  const progress = document.querySelector('.reading-progress');
  const tocLinks = Array.from(document.querySelectorAll('.post-toc a'));
  const tocEntries = tocLinks.map(link => ({ link, heading: document.getElementById(decodeURIComponent(link.hash.slice(1))) })).filter(item => item.heading);
  let scrollQueued = false;
  function onScroll() {
    scrollQueued = false;
    header.classList.toggle('is-scrolled', scrollY > 4);
    if (progress && prose) {
      const distance = Math.max(1, prose.offsetHeight - innerHeight * .6);
      const value = Math.min(1, Math.max(0, -prose.getBoundingClientRect().top / distance));
      progress.style.transform = 'scaleX(' + value.toFixed(4) + ')';
    }
    if (tocEntries.length) {
      const line = parseFloat(getComputedStyle(root).scrollPaddingTop) || 80;
      let current = tocEntries[0];
      for (const item of tocEntries) if (item.heading.getBoundingClientRect().top <= line + 1) current = item;
      for (const item of tocEntries) {
        const active = item === current;
        item.link.classList.toggle('is-active', active);
        if (active) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      }
    }
  }
  function queueScroll() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  window.addEventListener('hashchange', queueScroll);
  window.addEventListener('load', queueScroll);
  onScroll();

  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }
  const LANG = { csharp: 'C#', 'c#': 'C#', cs: 'C#', js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript', json: 'JSON', bash: 'Bash', shell: 'Shell', sh: 'Shell', powershell: 'PowerShell', python: 'Python', py: 'Python', cpp: 'C++', 'c++': 'C++', c: 'C', yaml: 'YAML', yml: 'YAML', xml: 'XML', html: 'HTML', css: 'CSS', lua: 'Lua', java: 'Java', go: 'Go', rust: 'Rust', sql: 'SQL', ini: 'INI', toml: 'TOML', markdown: 'Markdown', md: 'Markdown', vim: 'Vim', diff: 'Diff', plaintext: '', text: '', plain: '' };
  const COPY_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5"/></svg>';
  async function copyText(text) {
    if (navigator.clipboard && isSecureContext) return navigator.clipboard.writeText(text);
    const input = document.createElement('textarea');
    input.value = text;
    input.readOnly = true;
    input.style.cssText = 'position:fixed;opacity:0';
    const previous = document.activeElement;
    document.body.append(input);
    input.select();
    try { if (!document.execCommand('copy')) throw new Error('Copy unavailable'); }
    finally { input.remove(); if (previous) previous.focus(); }
  }
  document.querySelectorAll('.prose figure.highlight:not(.mermaid)').forEach(figure => {
    if (figure.querySelector('code.mermaid, code.language-mermaid')) return;
    const raw = figure.classList[1] || '';
    const language = Object.hasOwn(LANG, raw.toLowerCase()) ? LANG[raw.toLowerCase()] : raw;
    const head = document.createElement('div');
    head.className = 'code-head';
    head.innerHTML = '<span class="code-lang">' + esc(language) + '</span><button type="button" class="code-copy" aria-label="复制代码">' + COPY_ICON + '<span>复制</span></button>';
    figure.prepend(head);
    const button = head.querySelector('button');
    let reset;
    button.addEventListener('click', async () => {
      const code = figure.querySelector('td.code pre') || figure.querySelector('pre');
      try {
        await copyText(code.innerText.replace(/\n$/, ''));
        button.classList.add('is-done');
        button.lastChild.textContent = '已复制';
        showToast('已复制代码');
        clearTimeout(reset);
        reset = setTimeout(() => { button.classList.remove('is-done'); button.lastChild.textContent = '复制'; }, 2000);
      } catch (_) { showToast('复制失败：请手动选择代码复制'); }
    });
  });

  const imageDialog = document.getElementById('image-dialog');
  const largeImage = imageDialog.querySelector('img');
  const caption = imageDialog.querySelector('p');
  let imageOpener;
  document.querySelectorAll('.prose img').forEach(image => {
    if (image.closest('a, .about-tetris, .game-hall')) return;
    function enable() {
      if (image.naturalWidth < 160) return;
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', '放大查看：' + (image.alt || '图片'));
      image.addEventListener('click', () => {
        imageOpener = image;
        largeImage.src = image.currentSrc || image.src;
        largeImage.alt = image.alt || '';
        caption.textContent = image.alt || '';
        caption.hidden = !image.alt;
        imageDialog.showModal();
      });
      image.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); image.click(); } });
    }
    if (image.complete) enable(); else image.addEventListener('load', enable, { once: true });
  });
  imageDialog.querySelector('.image-close').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('click', e => { if (e.target === imageDialog) imageDialog.close(); });
  imageDialog.addEventListener('close', () => { largeImage.removeAttribute('src'); if (imageOpener) imageOpener.focus(); });

  const dialog = document.getElementById('search-dialog');
  const input = document.getElementById('search-input');
  const status = document.getElementById('search-status');
  const results = document.getElementById('search-results');
  let opener, index, loading, searchTimer, failed = false;
  async function loadIndex() {
    if (index) return;
    if (!loading) {
      failed = false;
      status.textContent = '正在载入文章索引…';
      loading = fetch(dialog.dataset.index).then(response => {
        if (!response.ok) throw new Error('Index unavailable');
        return response.json();
      }).then(data => { index = data; }).catch(() => {
        failed = true;
        status.textContent = '索引载入失败：请检查网络后重新打开搜索。';
      }).finally(() => { loading = null; });
    }
    await loading;
  }
  async function openSearch() {
    if (!dialog.open) { opener = document.activeElement; dialog.showModal(); }
    input.focus(); input.select();
    await loadIndex();
    runSearch();
  }
  function closeSearch() { dialog.close(); }
  document.querySelectorAll('.search-btn, [data-open-search]').forEach(button => button.addEventListener('click', openSearch));
  dialog.querySelector('.search-close').addEventListener('click', closeSearch);
  dialog.addEventListener('close', () => { clearTimeout(searchTimer); if (opener) opener.focus(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) closeSearch(); });
  dialog.querySelector('form').addEventListener('submit', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    const typing = e.target.matches('input, textarea, select') || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
  });
  function highlight(text, terms) {
    // Match raw text once, then escape each fragment: overlapping terms cannot corrupt HTML entities or markup.
    const pattern = new RegExp(terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|'), 'ig');
    let position = 0, output = '';
    for (const match of text.matchAll(pattern)) {
      output += esc(text.slice(position, match.index)) + '<mark>' + esc(match[0]) + '</mark>';
      position = match.index + match[0].length;
    }
    return output + esc(text.slice(position));
  }
  function snippet(text, terms) {
    const lower = text.toLowerCase();
    const matches = terms.map(term => lower.indexOf(term)).filter(position => position >= 0);
    if (!matches.length) return text.slice(0, 80);
    const start = Math.max(0, Math.min(...matches) - 24);
    return (start ? '…' : '') + text.slice(start, start + 90) + (start + 90 < text.length ? '…' : '');
  }
  function runSearch() {
    results.replaceChildren();
    if (!index) {
      if (!loading && !failed) status.textContent = '输入关键词搜索全部文章。';
      return;
    }
    const query = input.value.trim();
    if (!query) { status.textContent = '输入关键词，在 ' + index.length + ' 篇文章中查找。'; return; }
    const terms = [...new Set(query.toLowerCase().split(/\s+/))];
    const hits = index.map(post => {
      const title = post.title.toLowerCase(), tags = post.tags.join(' ').toLowerCase(), text = post.text.toLowerCase();
      let score = 0;
      const matched = terms.every(term => {
        const value = (title.includes(term) ? 3 : 0) + (tags.includes(term) ? 2 : 0) + (text.includes(term) ? 1 : 0);
        score += value;
        return value > 0;
      });
      return matched ? { post, score } : null;
    }).filter(Boolean).sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date)).slice(0, 20);
    status.textContent = hits.length ? '找到 ' + hits.length + ' 篇相关文章' : '没有找到与「' + query + '」相关的文章。换个关键词试试，例如 Unity 或 热更新。';
    results.innerHTML = hits.map(({ post }) => '<li><a href="' + esc(dialog.dataset.root + post.path) + '"><span class="sr-title">' + highlight(post.title, terms) + '</span><span class="sr-meta"><time datetime="' + esc(post.date) + '">' + esc(post.date) + '</time>' + (post.categories[0] ? '<span class="meta-cat">' + esc(post.categories[0]) + '</span>' : '') + '</span><span class="sr-snippet">' + highlight(snippet(post.text, terms), terms) + '</span></a></li>').join('');
  }
  input.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 120); });
  results.addEventListener('click', e => { if (e.target.closest('a')) closeSearch(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
    const links = Array.from(results.querySelectorAll('a'));
    if (!links.length) return;
    const current = links.indexOf(document.activeElement);
    if (e.key === 'Enter') { if (document.activeElement === input) { e.preventDefault(); links[0].click(); } return; }
    if (current < 0 && document.activeElement !== input) return;
    e.preventDefault();
    if (e.key === 'ArrowDown') links[Math.min(current + 1, links.length - 1)].focus();
    else if (current <= 0) input.focus();
    else links[current - 1].focus();
  });

  const diagrams = [];
  const diagramNodes = new Set(Array.from(document.querySelectorAll('.prose figure.highlight.mermaid, .prose pre > code.mermaid, .prose pre > code.language-mermaid, .prose pre.mermaid'), source => source.closest('figure.highlight') || (source.matches('code') ? source.parentElement : source)));
  diagramNodes.forEach(node => {
    const code = node.matches('figure') ? (node.querySelector('td.code pre') || node.querySelector('pre')) : node;
    const clone = code.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    const diagram = document.createElement('div');
    diagram.className = 'mermaid-diagram';
    diagram.setAttribute('role', 'img');
    diagram.setAttribute('aria-label', 'Mermaid 图表');
    diagram.dataset.src = clone.textContent;
    node.replaceWith(diagram);
    diagrams.push(diagram);
  });
  if (diagrams.length) {
    const palettes = {
      light: ['#FFFFFF', '#E3E8FA', '#2A47BF', '#1C2430', '#DCEFE2', '#2D6A4E', '#F6F7F5', '#7A867F', '#4A5463', '#B9D3C2', '#EDF0EC', '#FFFFFF'],
      dark: ['#1A212C', '#222D4A', '#93ACFF', '#E3E7EC', '#24463A', '#7CC7A2', '#131922', '#6B7B8F', '#B0B8C4', '#2C4A3B', '#212A37', '#131922']
    };
    function variables(mode) {
      const [surface, primary, accent, ink, secondary, green, bg, strong, line, grid, note, onAccent] = palettes[mode];
      return { background: surface, primaryColor: primary, mainBkg: primary, primaryBorderColor: accent, nodeBorder: accent, primaryTextColor: ink, textColor: ink, secondaryColor: secondary, secondaryBorderColor: green, secondaryTextColor: ink, tertiaryColor: bg, tertiaryBorderColor: strong, tertiaryTextColor: ink, lineColor: line, clusterBkg: bg, clusterBorder: grid, edgeLabelBackground: surface, actorBkg: primary, actorBorder: accent, actorTextColor: ink, actorLineColor: strong, signalColor: ink, signalTextColor: ink, labelBoxBkgColor: secondary, labelBoxBorderColor: green, labelTextColor: ink, loopTextColor: ink, noteBkgColor: note, noteBorderColor: strong, noteTextColor: ink, activationBkgColor: secondary, activationBorderColor: green, sequenceNumberColor: onAccent, fontSize: '15px' };
    }
    function renderFailure(diagram) {
      diagram.removeAttribute('role');
      diagram.innerHTML = '<p class="mermaid-error">图表渲染失败，下面是图表源码。</p><pre>' + esc(diagram.dataset.src) + '</pre>';
    }
    const ready = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = document.body.dataset.mermaid;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    let generation = 0;
    // Serialize Mermaid's global configuration as well as discarding stale output.
    let rendering = Promise.resolve();
    function renderDiagrams() {
      const request = ++generation;
      rendering = rendering.then(async () => {
        try { await ready; } catch (_) { if (request === generation) diagrams.forEach(renderFailure); return; }
        if (request !== generation) return;
        const mode = root.dataset.theme;
        window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', darkMode: mode === 'dark', fontFamily: getComputedStyle(root).getPropertyValue('--font-sans').trim(), themeVariables: variables(mode), suppressErrorRendering: true });
        for (let i = 0; i < diagrams.length; i++) {
          if (request !== generation) return;
          const diagram = diagrams[i];
          try {
            const { svg } = await window.mermaid.render('mmd-' + request + '-' + i, diagram.dataset.src);
            if (request !== generation) return;
            diagram.innerHTML = svg;
            diagram.setAttribute('role', 'img');
          } catch (_) { if (request === generation) renderFailure(diagram); }
        }
        queueScroll();
      });
    }
    document.addEventListener('lumen:themechange', renderDiagrams);
    renderDiagrams();
  }
})();
