const site = window.QBJ_SITE;
const years = ['全部', ...Array.from(new Set(site.entries.map((entry) => String(entry.year)))).sort()];
const signPositions = [
  { top: 90, x: 18 },
  { top: 880, x: 78 },
  { top: 1870, x: 18 },
  { top: 2920, x: 78 }
];
const viewNotes = {
  'home-view': '',
  'scroll-view': '这一视图适合慢慢滑，像逛一条弯着走的内容河道。',
  'archive-view': '这一视图适合回查、补看和按年份精确进入。'
};
const searchPrompts = ['Dongyi', '未来之群', '灯下白', '龙虾大户', '群徽', '一周年'];
const musicTracks = [
  { title: '私语', src: 'music/私语.wav' },
  { title: '观卷', src: 'music/观卷.mp4' }
];
const musicTrackStoreKey = 'qbj-music-track';
const musicModeStoreKey = 'qbj-music-mode';
const musicVolumeStoreKey = 'qbj-music-volume';
const musicPlayingStoreKey = 'qbj-music-playing';
const musicTimeStoreKey = 'qbj-music-time';
const musicModes = [
  { key: 'sequential', label: '顺序' },
  { key: 'single', label: '单曲' },
  { key: 'loop', label: '循环' }
];

let activeYear = '全部';
let ticking = false;
let activeView = 'home-view';
let activeTrackIndex = 0;
let activeMusicMode = 'sequential';
let activeMusicVolume = 0.68;
let scrollChapters = [];
let scrollPositionedEntries = [];
const allEntries = [...site.entries].sort((left, right) => left.date.localeCompare(right.date));
const searchIndex = [site.preface, ...allEntries].map((entry) => ({
  slug: entry.slug,
  title: entry.title,
  date: entry.date,
  shortDate: entry.shortDate,
  summary: entry.summary,
  keywords: [
    entry.title,
    entry.summary,
    ...(entry.paragraphs || []),
    String(entry.year || ''),
    entry.month || ''
  ].join(' ').toLowerCase()
}));

const railNoteEl = document.getElementById('railNote');
const railToggleEl = document.getElementById('leftRailToggle');
const leftRailEl = document.getElementById('leftRail');
const topbarEl = document.querySelector('.topbar');
const topbarNavEl = document.getElementById('topbarNav');
const topbarNavToggleEl = document.getElementById('topbarNavToggle');
const topbarNavToggleLabelEl = document.getElementById('topbarNavToggleLabel');
const scrollSectionEl = document.getElementById('journeySection');
const scrollBackdropEl = document.getElementById('scrollBackdrop');
const windingFrameEl = document.getElementById('windingFrame');
const windingTrackEl = document.getElementById('windingTrack');
const mobileScrollListEl = document.getElementById('mobileScrollList');
const scrollEntryFieldEl = document.getElementById('scrollEntryField');
const scrollSignFieldEl = document.getElementById('scrollSignField');
const scrollCodaEl = document.getElementById('scrollCoda');
const yearTabsEl = document.getElementById('yearTabs');
const archiveListEl = document.getElementById('archiveList');
const footerMetaEl = document.getElementById('footerMeta');
const coverDateRangeEl = document.getElementById('coverDateRange');
const homeEditorialEl = document.getElementById('homeEditorial');
const homeShelvesEl = document.getElementById('homeShelves');
const homeSearchInputEl = document.getElementById('homeSearchInput');
const searchSuggestionsEl = document.getElementById('searchSuggestions');
const searchSubmitEl = document.getElementById('searchSubmit');
const searchResultsEl = document.getElementById('searchResults');
const musicDockEl = document.getElementById('musicDock');
const musicToggleEl = document.getElementById('musicToggle');
const musicPanelEl = document.getElementById('musicPanel');
const musicCloseEl = document.getElementById('musicClose');
const musicPlayToggleEl = document.getElementById('musicPlayToggle');
const musicModeToggleEl = document.getElementById('musicModeToggle');
const musicVolumeEl = document.getElementById('musicVolume');
const musicVolumeValueEl = document.getElementById('musicVolumeValue');
const musicNowEl = document.getElementById('musicNow');
const musicAudioEl = document.getElementById('musicAudio');
const musicTrackButtons = Array.from(document.querySelectorAll('[data-track-index]'));
const viewSections = Array.from(document.querySelectorAll('.view-section'));
const viewLinks = Array.from(document.querySelectorAll('[data-view-link]'));
const mobileNavMedia = window.matchMedia('(max-width: 720px)');

function imagePath(path) {
  return path || '';
}

function pagePath(slug) {
  return `pages/${slug}.html`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function summarizeYear(year, entries) {
  const dates = entries.map((entry) => entry.shortDate || entry.date);
  return `这一年共收录 ${entries.length} 则，最早可见 ${dates[0]}，最晚可见 ${dates[dates.length - 1]}。`;
}

function getArchiveMonthLabel(entry) {
  if (entry.month && entry.month.trim()) {
    return entry.month.trim();
  }
  const matched = String(entry.date || '').match(/^\d{4}\.(\d{1,2})\./);
  if (!matched) {
    return '未归月';
  }
  return `${Number(matched[1])}月`;
}

function getArchiveFeatureEntry(entries) {
  const withImage = entries.filter((entry) => (entry.images || []).length > 0);
  return withImage[withImage.length - 1] || entries[entries.length - 1] || entries[0];
}

function trimText(text, maxLength = 92) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function uniqueEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry || seen.has(entry.slug)) {
      return false;
    }
    seen.add(entry.slug);
    return true;
  });
}

function getStablePickIndex(length, seedOffset = 0) {
  if (!length) {
    return 0;
  }
  const seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, '')) + seedOffset;
  return Math.abs(seed) % length;
}

function getEntryTypeLabel(entry) {
  const imageCount = (entry.images || []).length;
  const paragraphCount = (entry.paragraphs || []).length;
  if (imageCount >= 3) {
    return '图文特辑';
  }
  if (imageCount >= 1) {
    return '带图条目';
  }
  if (paragraphCount <= 3) {
    return '短札';
  }
  return '群史正文';
}

function getEntryIntro(entry, paragraphLimit = 2, maxLength = 88) {
  const visibleParagraphs = getVisibleEntryParagraphs(entry).slice(0, paragraphLimit);
  const source = visibleParagraphs.length ? visibleParagraphs.join(' ') : (entry.summary || '');
  return trimText(source.replace(/<br\s*\/?>/gi, ' '), maxLength);
}

function setTopbarNavOpen(isOpen) {
  if (!topbarEl || !topbarNavToggleEl || !topbarNavToggleLabelEl) {
    return;
  }
  const nextOpen = Boolean(isOpen) && mobileNavMedia.matches;
  topbarEl.classList.toggle('nav-open', nextOpen);
  topbarNavToggleEl.setAttribute('aria-expanded', String(nextOpen));
  topbarNavToggleLabelEl.textContent = nextOpen ? '收起入口' : '展开入口';
}

function syncTopbarNavState() {
  if (!topbarEl) {
    return;
  }
  if (mobileNavMedia.matches) {
    setTopbarNavOpen(topbarEl.classList.contains('nav-open'));
    return;
  }
  topbarEl.classList.remove('nav-open');
  if (topbarNavToggleEl) {
    topbarNavToggleEl.setAttribute('aria-expanded', 'false');
  }
  if (topbarNavToggleLabelEl) {
    topbarNavToggleLabelEl.textContent = '展开入口';
  }
}

function getHomePicks() {
  const daily = allEntries[getStablePickIndex(allEntries.length, 17)];
  const latest = [...allEntries].slice(-1)[0];
  const opener = allEntries[0];
  const visual = [...allEntries].sort((left, right) => ((right.images || []).length - (left.images || []).length) || ((right.paragraphs || []).length - (left.paragraphs || []).length))[0] || latest;
  const substantial = [...allEntries].sort((left, right) => (right.paragraphs || []).length - (left.paragraphs || []).length)[0] || latest;
  const conversation = [...allEntries].sort((left, right) => String(left.title || '').length - String(right.title || '').length)[getStablePickIndex(allEntries.length, 41)] || latest;
  return { daily, latest, opener, visual, substantial, conversation };
}

function getEntryPositions(entries) {
  const realYears = years.filter((year) => year !== '全部');
  let cursorTop = 180;
  const positions = [];

  realYears.forEach((year, yearIndex) => {
    const yearEntries = entries.filter((entry) => String(entry.year) === year);
    if (!yearEntries.length) {
      return;
    }

    yearEntries.forEach((entry, entryIndex) => {
      if (entryIndex === 0) {
        positions.push({
          entry,
          top: cursorTop,
          x: 50,
          rotate: yearIndex % 2 === 0 ? -2 : 2,
          widthClass: 'major',
          laneClass: 'center'
        });
        return;
      }

      const offsetIndex = entryIndex - 1;
      const lane = offsetIndex % 2;
      const row = Math.floor(offsetIndex / 2);
      positions.push({
        entry,
        top: cursorTop + 328 + row * 294 + (lane === 1 ? 24 : 0),
        x: lane === 0 ? 31 : 69,
        rotate: lane === 0 ? -5 : 5,
        widthClass: row === 0 ? 'standard' : 'minor',
        laneClass: lane === 0 ? 'left' : 'right'
      });
    });

    const stackedRows = Math.ceil(Math.max(yearEntries.length - 1, 0) / 2);
    cursorTop += 520 + stackedRows * 294;
  });

  return positions;
}

function setHoveredScrollEntry(slug = '') {
  if (!scrollEntryFieldEl) {
    return;
  }
  scrollEntryFieldEl.querySelectorAll('.winding-entry').forEach((node) => {
    node.classList.toggle('is-hovered', Boolean(slug) && node.getAttribute('data-scroll-slug') === slug);
  });
}

function describeScrollSign(entries) {
  if (!entries.length) {
    return '暂未收录';
  }
  const first = entries[0].entry.shortDate || entries[0].entry.date;
  const last = entries[entries.length - 1].entry.shortDate || entries[entries.length - 1].entry.date;
  if (first === last) {
    return `${entries.length} 则 · ${first}`;
  }
  return `${entries.length} 则 · ${first} 至 ${last}`;
}

function getViewFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'journeySection' || hash === 'scroll-view') {
    return 'scroll-view';
  }
  if (hash === 'archive-view' || hash === 'home-view') {
    return hash;
  }
  return 'home-view';
}

function subsequenceMatch(query, target) {
  let cursor = 0;
  for (const char of query) {
    cursor = target.indexOf(char, cursor);
    if (cursor === -1) {
      return false;
    }
    cursor += 1;
  }
  return true;
}

function scoreSearch(query, record) {
  if (!query) {
    return 0;
  }
  let score = 0;
  if (record.title.toLowerCase().includes(query)) {
    score += 12;
  }
  if (record.keywords.includes(query)) {
    score += 7;
  }
  if (subsequenceMatch(query, record.title.toLowerCase())) {
    score += 4;
  }
  if (subsequenceMatch(query, record.keywords)) {
    score += 2;
  }
  return score;
}

function renderSearchSuggestions() {
  if (!searchSuggestionsEl) {
    return;
  }
  searchSuggestionsEl.innerHTML = searchPrompts.map((prompt) => `
    <button class="search-chip" type="button" data-prompt="${prompt}">${prompt}</button>
  `).join('');
}

function renderSearchResults(query = '') {
  if (!searchResultsEl) {
    return;
  }

  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    const { daily, latest, visual } = getHomePicks();
    const starterEntries = uniqueEntries([daily, latest, visual]).slice(0, 3);
    searchResultsEl.innerHTML = `
      <div class="search-results-intro">
        <span>不知道搜什么</span>
        <strong>就先从这三篇开卷。</strong>
      </div>
      ${starterEntries.map((record) => `
        <a class="search-result-card search-result-card--starter" href="pages/${record.slug}.html">
          <span>${record.shortDate || record.date}</span>
          <h3>${record.title}</h3>
          <p>${getEntryIntro(record, 2, 78)}</p>
        </a>
      `).join('')}
    `;
    return;
  }

  const results = searchIndex
    .map((record) => ({ ...record, score: scoreSearch(normalized, record) }))
    .filter((record) => record.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  if (!results.length) {
    searchResultsEl.innerHTML = `
      <article class="search-empty">
        <strong>暂时没搜到完全贴近的条目</strong>
        <p>可以换个人名、梗名、年份，或者试试一句您还记得的原话。</p>
      </article>
    `;
    return;
  }

  searchResultsEl.innerHTML = results.map((record) => `
    <a class="search-result-card" href="pages/${record.slug}.html">
      <span>${record.shortDate || record.date}</span>
      <h3>${record.title}</h3>
      <p>${record.summary}</p>
    </a>
  `).join('');
}
function setActiveView(view) {
  activeView = view;
  viewSections.forEach((section) => {
    section.classList.toggle('active', section.dataset.view === view);
  });
  viewLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${view}`;
    link.classList.toggle('is-active', isActive);
  });
  if (railNoteEl) {
    railNoteEl.textContent = viewNotes[view] || '';
  }

  if (view !== 'scroll-view') {
    window.scrollTo(0, 0);
  }

  if (!footerMetaEl) {
    return;
  }
  if (view === 'home-view') {
    footerMetaEl.textContent = `当前共 ${site.entries.length + 1} 个页面入口，卷首与正文都已接入同一入口页。`;
  } else if (view === 'scroll-view') {
    footerMetaEl.textContent = `当前长卷已纳入 ${site.entries.length} 篇正文，点击即可进入对应文章页。`;
    updateJourney();
  } else {
    footerMetaEl.textContent = `当前目录含卷首与 ${site.entries.length} 篇正文，可按年份进入。`;
  }
  setTopbarNavOpen(false);
}

function renderScrollSigns() {
  if (!scrollSignFieldEl) {
    return;
  }
  const positionedEntries = scrollPositionedEntries.length ? scrollPositionedEntries : getEntryPositions(allEntries);
  const chapters = scrollChapters.length ? scrollChapters : getScrollChapters(positionedEntries, 0);
  scrollSignFieldEl.innerHTML = chapters.slice(0, signPositions.length).map((chapter, index) => {
    const left = index % 2 === 0 ? 16 : 78;
    const top = Math.max(chapter.top - 76, 34);
    const yearEntries = positionedEntries.filter(({ entry }) => String(entry.year) === chapter.year);
    return `
      <div class="scroll-sign" style="top:${top}px; left:${left}%;">
        <span>${chapter.year}</span>
        <p>${describeScrollSign(yearEntries)}</p>
      </div>
    `;
  }).join('');
}

function getScrollChapters(positionedEntries, trackHeight) {
  const realYears = years.filter((year) => year !== '全部');
  return realYears.map((year) => {
    const yearEntries = positionedEntries.filter(({ entry }) => String(entry.year) === year);
    const first = yearEntries[0];
    const last = yearEntries[yearEntries.length - 1] || first;
    const startDate = first ? (first.entry.shortDate || first.entry.date) : '';
    const endDate = last ? (last.entry.shortDate || last.entry.date) : startDate;
    return {
      year,
      count: yearEntries.length,
      top: first ? first.top : 0,
      activeTop: first ? Math.max(first.top - 140, 0) : 0,
      bottom: last ? last.top + 360 : 0,
      startDate,
      endDate
    };
  }).filter((chapter) => chapter.count > 0);
}

function renderScrollEntries() {
  if (!scrollEntryFieldEl || !windingTrackEl) {
    return;
  }

  const positionedEntries = getEntryPositions(allEntries);
  scrollPositionedEntries = positionedEntries;
  const trackHeight = Math.max(3800, positionedEntries[positionedEntries.length - 1].top + 520);
  scrollChapters = getScrollChapters(positionedEntries, trackHeight);
  windingTrackEl.style.height = `${trackHeight}px`;

  scrollEntryFieldEl.innerHTML = positionedEntries.map(({ entry, top, x, rotate, widthClass, laneClass }) => {
    const imageMarkup = entry.images[0]
      ? `<div class="winding-entry-thumb"><img src="${imagePath(entry.images[0])}" alt="${entry.title}" /></div>`
      : `<div class="winding-entry-thumb winding-entry-thumb--fallback"><strong>${entry.title}</strong></div>`;
    const excerpt = getScrollEntryCopy(entry);
    const kind = `${entry.year} · ${getEntryTypeLabel(entry)}`;

    return `
      <a class="winding-entry winding-entry--${widthClass} winding-entry--${laneClass}" data-scroll-slug="${entry.slug}" data-scroll-year="${entry.year}" href="${pagePath(entry.slug)}" style="top:${top}px; left:${x}%; --entry-rotate:${rotate}deg;">
        ${imageMarkup}
        <div class="winding-entry-meta">
          <div class="scroll-entry-topline">
            <span class="scroll-entry-date">${entry.shortDate || entry.date}</span>
            <span class="scroll-entry-kind">${kind}</span>
          </div>
          <h3 class="scroll-entry-title">${entry.title}</h3>
          <p class="scroll-entry-copy">${excerpt}</p>
        </div>
      </a>
    `;
  }).join('');
}

function renderScrollCoda() {
  if (!scrollCodaEl) {
    return;
  }

  const featured = [...allEntries].slice(-3).reverse();
  scrollCodaEl.innerHTML = `
    <div class="scroll-coda-card">
      <p class="eyebrow">卷尾转向</p>
      <h2>想精确地找某一年，就切到目录视图</h2>
      <p>长卷里适合偶遇，目录里适合回查。现在两边在同一个入口文件里切换，但内部职责仍然分开。</p>
      <div class="hero-actions">
        <a class="button solid" href="#archive-view">打开群史目录</a>
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

function renderCoverDateRange() {
  if (!coverDateRangeEl) {
    return;
  }
  coverDateRangeEl.textContent = '';
  coverDateRangeEl.setAttribute('aria-hidden', 'true');
}

function renderHomeEditorial() {
  if (!homeEditorialEl) {
    return;
  }
  homeEditorialEl.innerHTML = '';
  homeEditorialEl.hidden = true;
}

function renderHomeShelves() {
  if (!homeShelvesEl) {
    return;
  }
  homeShelvesEl.innerHTML = '';
  homeShelvesEl.hidden = true;
}
function getVisibleEntryParagraphs(entry) {
  const sourceParagraphs = Array.isArray(entry.paragraphs) ? entry.paragraphs : [];
  return sourceParagraphs.filter((paragraph) => (
    paragraph
    && !/^附链接：?$/.test(paragraph)
    && !/^https?:\/\//.test(paragraph)
    && !/^(小宇宙|喜马拉雅|网易云音乐)：https?:\/\//.test(paragraph)
  ));
}

function getScrollEntryCopy(entry) {
  const visibleParagraphs = getVisibleEntryParagraphs(entry);

  if (visibleParagraphs.length) {
    return visibleParagraphs.join('<br><br>').trim();
  }

  return (entry.summary || '').replace(/\.\.\.$/, '').trim();
}

function getArchiveCardCopy(entry) {
  const visibleParagraphs = getVisibleEntryParagraphs(entry).slice(0, 2);

  if (visibleParagraphs.length) {
    return visibleParagraphs.join('<br>').trim();
  }

  return (entry.summary || '').replace(/\.\.\.$/, '').trim();
}

function getMobileScrollCardCopy(entry) {
  return getEntryIntro(entry, 2, 90);
}

function renderMobileScrollList() {
  if (!mobileScrollListEl) {
    return;
  }

  const groupedEntries = allEntries.reduce((accumulator, entry) => {
    const key = String(entry.year);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(entry);
    return accumulator;
  }, {});

  const orderedYears = Object.keys(groupedEntries).sort((left, right) => Number(left) - Number(right));
  const expandedYear = orderedYears[orderedYears.length - 1];

  mobileScrollListEl.innerHTML = orderedYears
    .map((year) => {
      const entries = groupedEntries[year];
      const isOpen = year === expandedYear;
      return `
        <section class="mobile-scroll-year ${isOpen ? 'is-open' : ''}" data-mobile-scroll-year="${year}">
          <button class="mobile-scroll-year-head" type="button" data-mobile-scroll-toggle="${year}" aria-expanded="${isOpen ? 'true' : 'false'}">
            <div>
              <span class="mobile-scroll-year-kicker">沿卷漫游</span>
              <h2>${year}</h2>
            </div>
            <span class="mobile-scroll-year-meta">
              <span class="mobile-scroll-year-count">${entries.length} 则</span>
              <span class="mobile-scroll-year-arrow" aria-hidden="true"></span>
            </span>
          </button>
          <div class="mobile-scroll-year-body">
            <p class="mobile-scroll-year-note">${summarizeYear(year, entries)}</p>
            <div class="mobile-scroll-cards">
            ${entries.map((entry, index) => `
              <a class="mobile-scroll-card ${index === 0 ? 'mobile-scroll-card--lead' : ''}" href="${pagePath(entry.slug)}">
                <div class="mobile-scroll-card-head">
                  <span class="mobile-scroll-card-date">${entry.shortDate || entry.date}</span>
                  <span class="mobile-scroll-card-kind">${getEntryTypeLabel(entry)}</span>
                </div>
                ${entry.images[0]
                  ? `<div class="mobile-scroll-card-image"><img src="${imagePath(entry.images[0])}" alt="${entry.title}" /></div>`
                  : ''}
                <div class="mobile-scroll-card-body">
                  <h3>${entry.title}</h3>
                  <p>${getMobileScrollCardCopy(entry)}</p>
                </div>
              </a>
            `).join('')}
            </div>
          </div>
        </section>
      `;
    }).join('');
}

function renderYearTabs() {
  if (!yearTabsEl) {
    return;
  }
  yearTabsEl.innerHTML = years.map((year) => `
    <button class="year-tab ${year === activeYear ? 'active' : ''}" data-year="${year}">${year}</button>
  `).join('');
}

function renderArchiveList() {
  if (!archiveListEl) {
    return;
  }

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
    .map((year) => {
      const entries = [...grouped[year]].sort((left, right) => left.date.localeCompare(right.date));
      const featureEntry = getArchiveFeatureEntry(entries);
      const listEntries = entries.length > 1
        ? entries.filter((entry) => entry.slug !== featureEntry.slug)
        : [];
      const monthGroups = listEntries.reduce((accumulator, entry) => {
        const key = getArchiveMonthLabel(entry);
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(entry);
        return accumulator;
      }, {});
      const monthOrder = Object.keys(monthGroups).sort((left, right) => {
        const leftNum = Number.parseInt(left, 10);
        const rightNum = Number.parseInt(right, 10);
        if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) {
          return left.localeCompare(right, 'zh-CN');
        }
        return leftNum - rightNum;
      });
      return `
        <section class="year-block year-block--directory">
          <div class="year-heading year-heading--refined">
            <div>
              <h3 class="year-title">${year}</h3>
              <p class="year-note">${summarizeYear(year, entries)}</p>
            </div>
            <span class="year-count">${entries.length} 则</span>
          </div>
          <div class="archive-directory-layout">
            <a class="archive-year-feature" href="${pagePath(featureEntry.slug)}">
              <div class="archive-year-feature-head">
                <span class="archive-year-kicker">最新</span>
                <span class="archive-year-tag">${featureEntry.shortDate || featureEntry.date}</span>
              </div>
              ${featureEntry.images[0] ? `<img class="archive-year-feature-image" src="${imagePath(featureEntry.images[0])}" alt="${featureEntry.title}" />` : '<div class="archive-year-feature-image archive-thumb--fallback"></div>'}
              <div class="archive-year-feature-body">
                <h3>${featureEntry.title}</h3>
                <p>${getArchiveCardCopy(featureEntry)}</p>
              </div>
            </a>
            <div class="archive-directory-panel">
              ${monthOrder.length ? monthOrder.map((month) => `
                <section class="archive-month-section">
                  <div class="archive-month-head">
                    <span class="archive-month-label">${month}</span>
                    <span class="archive-month-count">${monthGroups[month].length} 篇</span>
                  </div>
                  <div class="archive-month-list">
                    ${monthGroups[month].map((entry) => `
                      <a class="archive-line" href="${pagePath(entry.slug)}">
                        ${entry.images[0]
                          ? `<img class="archive-line-thumb" src="${imagePath(entry.images[0])}" alt="${entry.title}" />`
                          : '<div class="archive-line-thumb archive-line-thumb--fallback">卷</div>'}
                        <div class="archive-line-main">
                          <div class="archive-line-meta">
                            <span class="archive-line-date">${entry.shortDate || entry.date}</span>
                            <span class="archive-line-kind">${getEntryTypeLabel(entry)}</span>
                          </div>
                          <strong>${entry.title}</strong>
                          <p>${getArchiveCardCopy(entry)}</p>
                        </div>
                      </a>
                    `).join('')}
                  </div>
                </section>
              `).join('') : `
                <div class="archive-directory-empty">
                  <span class="archive-directory-empty-tag">${featureEntry.shortDate || featureEntry.date}</span>
                  <strong>本年仅此一篇</strong>
                  <p>左侧已经展开这一年的最新条目，直接点进去就可以读正文。</p>
                </div>
              `}
            </div>
          </div>
        </section>
      `;
    }).join('');
}
function getStoredMusicMode() {
  try {
    const stored = window.localStorage.getItem(musicModeStoreKey);
    if (musicModes.some((mode) => mode.key === stored)) {
      return stored;
    }
  } catch (error) {
    return 'sequential';
  }
  return 'sequential';
}

function storeMusicMode(mode) {
  try {
    window.localStorage.setItem(musicModeStoreKey, mode);
  } catch (error) {
    return;
  }
}

function getStoredMusicVolume() {
  try {
    const stored = Number(window.localStorage.getItem(musicVolumeStoreKey));
    if (Number.isFinite(stored) && stored >= 0 && stored <= 1) {
      return stored;
    }
  } catch (error) {
    return 0.68;
  }
  return 0.68;
}

function storeMusicVolume(volume) {
  try {
    window.localStorage.setItem(musicVolumeStoreKey, String(volume));
  } catch (error) {
    return;
  }
}

function getMusicControlIcon(kind) {
  if (kind === 'pause') {
    return '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>';
  }

  if (kind === 'single') {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8H17L15.2 6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 8V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 16H7L8.8 17.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 16V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12.2 9.7H13.6V15.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  if (kind === 'loop') {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8H17L15.2 6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 8V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 16H7L8.8 17.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 16V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  if (kind === 'sequential') {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 12H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 17H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 7V17L20 14.2V9.8L16 7Z" fill="currentColor"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 6.5V17.5L17.5 12L8 6.5Z"/></svg>';
}

function renderMusicPlayToggle() {
  if (!musicPlayToggleEl || !musicAudioEl) {
    return;
  }

  const isPaused = musicAudioEl.paused || musicAudioEl.ended;
  musicPlayToggleEl.innerHTML = `<span class="music-control-icon" aria-hidden="true">${getMusicControlIcon(isPaused ? 'play' : 'pause')}</span>`;
  musicPlayToggleEl.setAttribute('aria-label', isPaused ? '播放' : '暂停');
}

function applyMusicVolume() {
  const volumePercent = Math.round(activeMusicVolume * 100);

  if (musicAudioEl) {
    musicAudioEl.volume = activeMusicVolume;
  }

  if (musicVolumeEl) {
    musicVolumeEl.value = String(volumePercent);
  }

  if (musicVolumeValueEl) {
    musicVolumeValueEl.textContent = `${volumePercent}%`;
  }
}

function updateMusicVolume(nextValue, options = {}) {
  const { announce = false } = options;
  activeMusicVolume = clamp(Number(nextValue), 0, 1);
  storeMusicVolume(activeMusicVolume);
  applyMusicVolume();

  if (announce) {
    if (activeMusicVolume === 0) {
      setMusicNow('音量已经调到静音。');
    } else {
      setMusicNow(`音量已调到 ${Math.round(activeMusicVolume * 100)}%。`);
    }
  }
}
function getMusicModeMeta() {
  return musicModes.find((mode) => mode.key === activeMusicMode) || musicModes[0];
}

function applyMusicMode() {
  if (musicAudioEl) {
    musicAudioEl.loop = activeMusicMode === 'single';
  }

  if (musicModeToggleEl) {
    const modeMeta = getMusicModeMeta();
    musicModeToggleEl.innerHTML = `<span class="music-control-icon" aria-hidden="true">${getMusicControlIcon(modeMeta.key)}</span>`;
    musicModeToggleEl.setAttribute('aria-label', `${modeMeta.label}播放`);
  }
}
function cycleMusicMode() {
  const currentIndex = musicModes.findIndex((mode) => mode.key === activeMusicMode);
  const nextMode = musicModes[(currentIndex + 1) % musicModes.length] || musicModes[0];
  activeMusicMode = nextMode.key;
  storeMusicMode(activeMusicMode);
  applyMusicMode();

  if (activeMusicMode === 'single') {
    setMusicNow(`当前模式是单曲循环，${getActiveTrack().title} 会反复播放。`);
  } else if (activeMusicMode === 'loop') {
    setMusicNow('当前模式是列表循环，两首歌会顺着一直播下去。');
  } else {
    setMusicNow('当前模式是顺序播放，播完当前曲目后会停下。');
  }
}

function getStoredTrackIndex() {
  try {
    const stored = Number(window.localStorage.getItem(musicTrackStoreKey));
    if (Number.isInteger(stored) && stored >= 0 && stored < musicTracks.length) {
      return stored;
    }
  } catch (error) {
    return 0;
  }
  return 0;
}

function storeTrackIndex(index) {
  try {
    window.localStorage.setItem(musicTrackStoreKey, String(index));
  } catch (error) {
    return;
  }
}

function setMusicPanelOpen(open) {
  if (!musicPanelEl || !musicToggleEl) {
    return;
  }
  musicPanelEl.hidden = !open;
  musicToggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function getActiveTrack() {
  return musicTracks[activeTrackIndex] || musicTracks[0];
}

function syncMusicButtons() {
  musicTrackButtons.forEach((button) => {
    const index = Number(button.dataset.trackIndex);
    button.classList.toggle('is-active', index === activeTrackIndex);
  });

  renderMusicPlayToggle();

  applyMusicMode();
  applyMusicMode();

  if (musicDockEl && musicAudioEl) {
    musicDockEl.classList.toggle('is-playing', !musicAudioEl.paused && !musicAudioEl.ended);
  }
}

function setMusicNow(text) {
  if (musicNowEl) {
    musicNowEl.textContent = text;
  }
}

function getStoredMusicPlaying() {
  try {
    return window.localStorage.getItem(musicPlayingStoreKey) === 'true';
  } catch (error) {
    return false;
  }
}

function storeMusicPlaying(isPlaying) {
  try {
    window.localStorage.setItem(musicPlayingStoreKey, isPlaying ? 'true' : 'false');
  } catch (error) {
    return;
  }
}

function getStoredMusicTime() {
  try {
    const stored = Number(window.localStorage.getItem(musicTimeStoreKey));
    if (Number.isFinite(stored) && stored >= 0) {
      return stored;
    }
  } catch (error) {
    return 0;
  }
  return 0;
}

function storeMusicTime(time) {
  try {
    window.localStorage.setItem(musicTimeStoreKey, String(Math.max(0, Number(time) || 0)));
  } catch (error) {
    return;
  }
}

function restoreMusicTime(timeValue = getStoredMusicTime()) {
  if (!musicAudioEl) {
    return;
  }

  const nextTime = Math.max(0, Number(timeValue) || 0);
  if (nextTime <= 0) {
    return;
  }

  const applyTime = () => {
    const duration = Number.isFinite(musicAudioEl.duration) ? musicAudioEl.duration : 0;
    musicAudioEl.currentTime = duration ? Math.min(nextTime, Math.max(duration - 0.25, 0)) : nextTime;
  };

  if (musicAudioEl.readyState >= 1) {
    applyTime();
    return;
  }

  musicAudioEl.addEventListener('loadedmetadata', applyTime, { once: true });
}

function loadTrack(index, options = {}) {
  if (!musicAudioEl) {
    return;
  }

  const { preserveTime = false, quiet = false } = options;
  activeTrackIndex = clamp(index, 0, musicTracks.length - 1);
  const track = getActiveTrack();
  const encodedSrc = encodeURI(track.src);
  const hasChanged = !musicAudioEl.getAttribute('src') || musicAudioEl.getAttribute('src') !== encodedSrc;

  if (hasChanged) {
    musicAudioEl.src = encodedSrc;
    musicAudioEl.load();
  }

  storeTrackIndex(activeTrackIndex);
  if (!preserveTime) {
    storeMusicTime(0);
  }
  syncMusicButtons();
  if (!quiet) {
    setMusicNow(`已选 ${track.title}，点播放就能开始。`);
  }
}

function playCurrentTrack(options = {}) {
  if (!musicAudioEl) {
    return;
  }

  const { resume = false } = options;
  if (!musicAudioEl.getAttribute('src')) {
    loadTrack(activeTrackIndex);
  }
  const track = getActiveTrack();
  musicAudioEl.play()
    .then(() => {
      storeMusicPlaying(true);
      storeMusicTime(musicAudioEl.currentTime || 0);
      syncMusicButtons();
      if (resume && (musicAudioEl.currentTime || 0) > 0) {
        setMusicNow(`继续播放 ${track.title}，刚才听到的位置已经接上了。`);
      } else {
        setMusicNow(`正在播放 ${track.title}，您可以一边看一边听。`);
      }
    })
    .catch(() => {
      storeMusicPlaying(false);
      syncMusicButtons();
      setMusicNow(`已选 ${track.title}，浏览器还需要您再点一次播放。`);
    });
}

function pauseCurrentTrack() {
  if (!musicAudioEl) {
    return;
  }
  musicAudioEl.pause();
  storeMusicPlaying(false);
  storeMusicTime(musicAudioEl.currentTime || 0);
  syncMusicButtons();
  setMusicNow(`已经暂停 ${getActiveTrack().title}。`);
}

function initMusicPlayer() {
  if (!musicAudioEl) {
    return;
  }

  activeTrackIndex = getStoredTrackIndex();
  activeMusicMode = getStoredMusicMode();
  activeMusicVolume = getStoredMusicVolume();
  const resumePlaying = getStoredMusicPlaying();
  const resumeTime = getStoredMusicTime();

  loadTrack(activeTrackIndex, { preserveTime: true, quiet: true });
  applyMusicMode();
  applyMusicVolume();
  restoreMusicTime(resumeTime);
  setMusicPanelOpen(false);

  if (musicToggleEl) {
    musicToggleEl.addEventListener('click', () => {
      setMusicPanelOpen(musicPanelEl.hidden);
    });
  }

  if (musicCloseEl) {
    musicCloseEl.addEventListener('click', () => {
      setMusicPanelOpen(false);
    });
  }

  musicTrackButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextIndex = Number(button.dataset.trackIndex || 0);
      loadTrack(nextIndex);
      playCurrentTrack();
      setMusicPanelOpen(true);
    });
  });

  if (musicPlayToggleEl) {
    musicPlayToggleEl.addEventListener('click', () => {
      if (musicAudioEl.paused) {
        playCurrentTrack();
      } else {
        pauseCurrentTrack();
      }
    });
  }

  if (musicModeToggleEl) {
    musicModeToggleEl.addEventListener('click', () => {
      cycleMusicMode();
    });
  }

  if (musicVolumeEl) {
    musicVolumeEl.addEventListener('input', (event) => {
      updateMusicVolume(Number(event.target.value) / 100);
    });

    musicVolumeEl.addEventListener('change', (event) => {
      updateMusicVolume(Number(event.target.value) / 100, { announce: true });
    });
  }

  musicAudioEl.addEventListener('play', () => {
    storeMusicPlaying(true);
    syncMusicButtons();
  });

  musicAudioEl.addEventListener('pause', () => {
    storeMusicTime(musicAudioEl.currentTime || 0);
    syncMusicButtons();
  });

  musicAudioEl.addEventListener('timeupdate', () => {
    storeMusicTime(musicAudioEl.currentTime || 0);
  });

  musicAudioEl.addEventListener('ended', () => {
    if (activeMusicMode === 'loop') {
      const nextIndex = (activeTrackIndex + 1) % musicTracks.length;
      loadTrack(nextIndex);
      playCurrentTrack();
      return;
    }

    storeMusicPlaying(false);
    storeMusicTime(0);
    syncMusicButtons();
    setMusicNow(`${getActiveTrack().title} 播放完了，可以换一首继续听。`);
  });

  window.addEventListener('beforeunload', () => {
    storeTrackIndex(activeTrackIndex);
    storeMusicMode(activeMusicMode);
    storeMusicVolume(activeMusicVolume);
    storeMusicTime(musicAudioEl.currentTime || 0);
    storeMusicPlaying(!musicAudioEl.paused && !musicAudioEl.ended);
  });

  if (resumePlaying) {
    const continuePlayback = () => {
      restoreMusicTime(resumeTime);
      playCurrentTrack({ resume: resumeTime > 0 });
    };

    if (musicAudioEl.readyState >= 1) {
      continuePlayback();
    } else {
      musicAudioEl.addEventListener('loadedmetadata', continuePlayback, { once: true });
    }
  } else {
    setMusicNow(`已选 ${getActiveTrack().title}，点播放就能开始。`);
  }
}
function updateScrollChapterState(focusY = 0) {
  if (!scrollChapters.length) {
    return;
  }

  let activeChapter = scrollChapters[0];
  scrollChapters.forEach((chapter) => {
    if (focusY >= chapter.activeTop) {
      activeChapter = chapter;
    }
  });

  const activeEntryRecord = scrollPositionedEntries.reduce((closest, current) => {
    if (!closest) {
      return current;
    }
    const currentDistance = Math.abs(current.top - focusY);
    const closestDistance = Math.abs(closest.top - focusY);
    return currentDistance < closestDistance ? current : closest;
  }, null);
  const activeEntry = activeEntryRecord?.entry;

  if (scrollEntryFieldEl) {
    scrollEntryFieldEl.querySelectorAll('.winding-entry').forEach((node) => {
      node.classList.toggle('is-current', node.getAttribute('data-scroll-slug') === activeEntry?.slug);
    });
  }
}
function updateJourney() {
  if (
    activeView !== 'scroll-view'
    || mobileNavMedia.matches
    || !scrollSectionEl
    || !windingFrameEl
    || !windingTrackEl
    || !scrollBackdropEl
  ) {
    return;
  }

  const sectionTop = scrollSectionEl.getBoundingClientRect().top + window.scrollY;
  const maxTravel = Math.max(1, scrollSectionEl.offsetHeight - window.innerHeight);
  const progress = clamp((window.scrollY - sectionTop + window.innerHeight * 0.1) / maxTravel, 0, 1);
  const contentTravel = Math.max(0, windingTrackEl.scrollHeight - windingFrameEl.clientHeight + 120);
  const translateY = -progress * contentTravel;
  const backdropShift = progress * 34;
  const focusY = Math.abs(translateY) + windingFrameEl.clientHeight * 0.34;

  windingTrackEl.style.transform = `translate3d(0, ${translateY}px, 0)`;
  scrollBackdropEl.style.transform = `translate3d(0, ${backdropShift}px, 0) scale(${1 + progress * 0.016})`;
  updateScrollChapterState(focusY);
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

function handleHashChange() {
  setActiveView(getViewFromHash());
}

if (yearTabsEl) {
  yearTabsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-year]');
    if (!button) {
      return;
    }
    activeYear = button.dataset.year;
    renderYearTabs();
    renderArchiveList();
  });
}

if (scrollEntryFieldEl) {
  scrollEntryFieldEl.addEventListener('pointerover', (event) => {
    const card = event.target.closest('.winding-entry');
    if (!card) {
      return;
    }
    setHoveredScrollEntry(card.getAttribute('data-scroll-slug') || '');
  });

  scrollEntryFieldEl.addEventListener('pointerout', (event) => {
    const card = event.target.closest('.winding-entry');
    if (!card) {
      return;
    }
    const related = event.relatedTarget ? event.relatedTarget.closest('.winding-entry') : null;
    if (related && related !== card) {
      setHoveredScrollEntry(related.getAttribute('data-scroll-slug') || '');
      return;
    }
    setHoveredScrollEntry('');
  });
}

if (mobileScrollListEl) {
  mobileScrollListEl.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-mobile-scroll-toggle]');
    if (!toggle) {
      return;
    }

    const targetYear = toggle.getAttribute('data-mobile-scroll-toggle');
    mobileScrollListEl.querySelectorAll('[data-mobile-scroll-year]').forEach((section) => {
      const isTarget = section.getAttribute('data-mobile-scroll-year') === targetYear;
      section.classList.toggle('is-open', isTarget);
      const button = section.querySelector('[data-mobile-scroll-toggle]');
      if (button) {
        button.setAttribute('aria-expanded', String(isTarget));
      }
    });
  });
}

if (searchSuggestionsEl) {
  searchSuggestionsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-prompt]');
    if (!button || !homeSearchInputEl) {
      return;
    }
    homeSearchInputEl.value = button.dataset.prompt;
    renderSearchResults(button.dataset.prompt);
  });
}

if (homeSearchInputEl) {
  homeSearchInputEl.addEventListener('input', (event) => {
    renderSearchResults(event.target.value || '');
  });
}

if (searchSubmitEl) {
  searchSubmitEl.addEventListener('click', () => {
    const query = homeSearchInputEl ? homeSearchInputEl.value || '' : '';
    renderSearchResults(query);
    if (homeSearchInputEl) {
      homeSearchInputEl.focus();
    }
  });
}

if (topbarNavToggleEl) {
  topbarNavToggleEl.addEventListener('click', () => {
    const isOpen = topbarEl ? topbarEl.classList.contains('nav-open') : false;
    setTopbarNavOpen(!isOpen);
  });
}

if (topbarNavEl) {
  topbarNavEl.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) {
      return;
    }
    setTopbarNavOpen(false);
  });
}

if (railToggleEl && leftRailEl) {
  railToggleEl.addEventListener('click', () => {
    leftRailEl.classList.toggle('collapsed');
  });
}

renderCoverDateRange();
renderHomeEditorial();
renderHomeShelves();
renderSearchSuggestions();
renderSearchResults();
renderScrollEntries();
renderScrollSigns();
renderMobileScrollList();
renderScrollCoda();
renderYearTabs();
renderArchiveList();
initMusicPlayer();
syncTopbarNavState();
setActiveView(getViewFromHash());
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
mobileNavMedia.addEventListener('change', syncTopbarNavState);

