const site = window.QBJ_SITE;
const years = ['全部', ...Array.from(new Set(site.entries.map((entry) => String(entry.year)))).sort()];
let activeYear = '全部';

const archiveLeadEl = document.getElementById('archiveLead');
const archiveSideEl = document.getElementById('archiveSide');
const yearTabsEl = document.getElementById('yearTabs');
const archiveListEl = document.getElementById('archiveList');
const footerMetaEl = document.getElementById('footerMeta');

function imagePath(path) {
  return path || '';
}

function pagePath(slug) {
  return `pages/${slug}.html`;
}

function renderHero() {
  const lead = site.entries.find((entry) => entry.title.includes('新域名')) || site.entries[0];
  const sideEntries = ['Dongyi早报', '未来之群', '灯下白', '一周年']
    .map((title) => site.entries.find((entry) => entry.title === title))
    .filter(Boolean);

  archiveLeadEl.innerHTML = `
    <p class="eyebrow">Archive Lead</p>
    <h1>${lead.title}</h1>
    <div class="hero-meta">
      <span>${site.entries.length} 篇正文</span>
      <span>${years.length - 1} 个年份</span>
      <span>${site.generatedAt} 生成</span>
    </div>
    <p class="subtitle">目录页不再承担长卷的表演任务，而是把条目、时间和入口交代清楚，让人能够稳定地找到想看的那一篇。</p>
    <div class="hero-actions">
      <a class="button solid" href="${pagePath(lead.slug)}">阅读主打条目</a>
      <a class="button ghost" href="scroll.html">改走长卷</a>
    </div>
    ${lead.images[0] ? `<div class="archive-lead-figure"><img src="${imagePath(lead.images[0])}" alt="${lead.title}" /></div>` : ''}
  `;

  archiveSideEl.innerHTML = `
    <p class="eyebrow">卷旁提要</p>
    <h2>卷首与代表条目</h2>
    <a class="archive-side-item archive-side-item--preface" href="pages/${site.preface.slug}.html">
      <span>${site.preface.shortDate}</span>
      <strong>${site.preface.title}</strong>
      <p>${site.preface.summary}</p>
    </a>
    <div class="archive-side-list">
      ${sideEntries.map((entry) => `
        <a class="archive-side-item" href="${pagePath(entry.slug)}">
          <span>${entry.shortDate}</span>
          <strong>${entry.title}</strong>
          <p>${entry.summary}</p>
        </a>
      `).join('')}
    </div>
  `;
}

function renderYearTabs() {
  yearTabsEl.innerHTML = years.map((year) => `
    <button class="year-tab ${year === activeYear ? 'active' : ''}" data-year="${year}">${year}</button>
  `).join('');
}

function renderArchive() {
  const visibleEntries = activeYear === '全部'
    ? site.entries
    : site.entries.filter((entry) => String(entry.year) === activeYear);

  const grouped = visibleEntries.reduce((accumulator, entry) => {
    const key = String(entry.year);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(entry);
    return accumulator;
  }, {});

  archiveListEl.innerHTML = Object.keys(grouped)
    .sort((left, right) => Number(left) - Number(right))
    .map((year) => `
      <section class="year-block">
        <h3 class="year-title">${year}</h3>
        <div class="archive-grid">
          ${grouped[year].map((entry) => `
            <a class="archive-card" href="${pagePath(entry.slug)}">
              ${entry.images[0] ? `<img class="archive-thumb" src="${imagePath(entry.images[0])}" alt="${entry.title}" />` : '<div class="archive-thumb archive-thumb--fallback"></div>'}
              <div class="meta-row">
                <span>${entry.shortDate || entry.date}</span>
                <span>${entry.readingTime} 分钟</span>
              </div>
              <h3>${entry.title}</h3>
              <p>${entry.summary}</p>
            </a>
          `).join('')}
        </div>
      </section>
    `).join('');
}

yearTabsEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-year]');
  if (!button) {
    return;
  }
  activeYear = button.dataset.year;
  renderYearTabs();
  renderArchive();
});

renderHero();
renderYearTabs();
renderArchive();
footerMetaEl.textContent = `当前目录含卷首与 ${site.entries.length} 篇正文，可按年份进入。`;
