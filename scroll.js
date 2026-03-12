const site = window.QBJ_SITE;
const progressLabels = ['卷轴起笔', '卷身渐深', '群史回旋', '卷中遇人', '卷势更长', '卷尾未尽'];
const entryPositions = [
  { top: 110, x: 36, rotate: -6 },
  { top: 270, x: 61, rotate: 5 },
  { top: 430, x: 43, rotate: -3 },
  { top: 610, x: 57, rotate: 4 },
  { top: 790, x: 39, rotate: -5 },
  { top: 970, x: 63, rotate: 3 },
  { top: 1160, x: 46, rotate: -2 },
  { top: 1360, x: 58, rotate: 6 },
  { top: 1560, x: 40, rotate: -4 },
  { top: 1760, x: 61, rotate: 4 },
  { top: 1960, x: 45, rotate: -3 },
  { top: 2140, x: 55, rotate: 5 }
];

const heroMetaEl = document.getElementById('scrollHeroMeta');
const sidePanelEl = document.getElementById('scrollSidePanel');
const scrollSectionEl = document.getElementById('journeySection');
const scrollBackdropEl = document.getElementById('scrollBackdrop');
const scrollProgressEl = document.getElementById('scrollProgress');
const windingFrameEl = document.getElementById('windingFrame');
const windingTrackEl = document.getElementById('windingTrack');
const entryFieldEl = document.getElementById('scrollEntryField');
const codaEl = document.getElementById('scrollCoda');
const footerMetaEl = document.getElementById('footerMeta');

let ticking = false;

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function imagePath(path) {
  return path || '';
}

function pagePath(slug) {
  return `pages/${slug}.html`;
}

function renderHero() {
  const years = Array.from(new Set(site.entries.map((entry) => String(entry.year)))).sort();
  heroMetaEl.innerHTML = [
    `<span>${site.entries.length} 篇正文</span>`,
    `<span>${years.length} 个年份</span>`,
    `<span>${site.entries.filter((entry) => entry.images.length).length} 篇带图</span>`
  ].join('');

  const latestEntries = [...site.entries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-3)
    .reverse();

  sidePanelEl.innerHTML = `
    <p class="eyebrow">卷边题签</p>
    <h2>先漫游，再细读</h2>
    <p>长卷页只做一件事，就是把人带进卷中。真正要按年份、按次序、按条目精确翻的时候，再转去目录页。</p>
    <div class="scroll-side-list">
      ${latestEntries.map((entry) => `
        <a class="scroll-side-item" href="${pagePath(entry.slug)}">
          <span>${entry.shortDate}</span>
          <strong>${entry.title}</strong>
        </a>
      `).join('')}
    </div>
  `;
}

function renderScrollEntries() {
  const selected = shuffle(site.entries.filter((entry) => entry.title)).slice(0, entryPositions.length);

  entryFieldEl.innerHTML = selected.map((entry, index) => {
    const position = entryPositions[index % entryPositions.length];
    const imageMarkup = entry.images[0]
      ? `<div class="winding-entry-thumb"><img src="${imagePath(entry.images[0])}" alt="${entry.title}" /></div>`
      : `<div class="winding-entry-thumb winding-entry-thumb--fallback"><strong>${entry.title}</strong></div>`;

    return `
      <a class="winding-entry" href="${pagePath(entry.slug)}" style="top:${position.top}px; left:${position.x}%; --entry-rotate:${position.rotate}deg;">
        ${imageMarkup}
        <div class="winding-entry-meta">
          <span class="scroll-entry-date">${entry.shortDate || entry.date}</span>
          <h3 class="scroll-entry-title">${entry.title}</h3>
          <p class="scroll-entry-copy">${entry.summary}</p>
        </div>
      </a>
    `;
  }).join('');
}

function renderCoda() {
  const featured = site.entries
    .filter((entry) => entry.images.length)
    .slice(0, 3);

  codaEl.innerHTML = `
    <div class="scroll-coda-card">
      <p class="eyebrow">卷尾转向</p>
      <h2>想精确地找某一年，就改走目录页</h2>
      <p>长卷里适合偶遇，目录里适合回查。两边分开之后，首页就不再让两种逻辑彼此打架了。</p>
      <div class="hero-actions">
        <a class="button solid" href="archive.html">打开群史目录</a>
        <a class="button ghost" href="pages/preface.html">先看卷首</a>
      </div>
    </div>
    <div class="scroll-coda-grid">
      ${featured.map((entry) => `
        <a class="scroll-coda-entry" href="${pagePath(entry.slug)}">
          <span>${entry.shortDate}</span>
          <strong>${entry.title}</strong>
        </a>
      `).join('')}
    </div>
  `;
}

function updateJourney() {
  if (!scrollSectionEl || !windingFrameEl || !windingTrackEl) {
    return;
  }

  const sectionTop = scrollSectionEl.offsetTop;
  const maxTravel = Math.max(1, scrollSectionEl.offsetHeight - window.innerHeight);
  const progress = clamp((window.scrollY - sectionTop + window.innerHeight * 0.22) / maxTravel, 0, 1);
  const contentTravel = Math.max(0, windingTrackEl.scrollHeight - windingFrameEl.clientHeight + 120);
  const translateY = -progress * contentTravel;
  const backdropShift = progress * 54;
  const labelIndex = Math.min(progressLabels.length - 1, Math.floor(progress * progressLabels.length));

  windingTrackEl.style.transform = `translate3d(0, ${translateY}px, 0)`;
  scrollBackdropEl.style.transform = `translate3d(0, ${backdropShift}px, 0) scale(${1 + progress * 0.03})`;
  scrollProgressEl.textContent = progressLabels[labelIndex];
}

function scheduleUpdate() {
  if (ticking) {
    return;
  }
  ticking = true;
  window.requestAnimationFrame(() => {
    updateJourney();
    ticking = false;
  });
}

renderHero();
renderScrollEntries();
renderCoda();
footerMetaEl.textContent = `最新导入自 带图本纪.docx，当前长卷散落 ${entryPositions.length} 个卷中入口。`;
updateJourney();
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
