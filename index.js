const site = window.QBJ_SITE;
const years = ['全部', ...Array.from(new Set(site.entries.map((entry) => String(entry.year)))).sort()];
const progressLabels = ['起卷', '成形', '补录'];
const signPositions = [
  { top: 90, x: 18 },
  { top: 880, x: 78 },
  { top: 1870, x: 18 },
  { top: 2920, x: 78 }
];
const yearDescriptors = {
  '2024': '草蛇灰线，群史起笔，许多后来的热闹都还藏在暗处。',
  '2025': '声量渐满，人物与名场面一起长出来，群像开始真正成形。',
  '2026': '回望与续写并行，群体记忆开始带着自觉被重新编排。'
};
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
const scrollSectionEl = document.getElementById('journeySection');
const scrollBackdropEl = document.getElementById('scrollBackdrop');
const scrollProgressEl = document.getElementById('scrollProgress');
const scrollJumpbarEl = document.getElementById('scrollJumpbar');
const windingFrameEl = document.getElementById('windingFrame');
const windingTrackEl = document.getElementById('windingTrack');
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
  const descriptor = yearDescriptors[year] || '这一年的群像继续生长，话题和人物都在往外扩。';
  const dates = entries.map((entry) => entry.shortDate || entry.date);
  return `${descriptor} 这一年共收录 ${entries.length} 则，最早可见 ${dates[0]}，最晚可见 ${dates[dates.length - 1]}。`;
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
  return entries.map((entry, index) => {
    const lane = index % 4;
    const cycle = Math.floor(index / 4);
    const top = 250 + index * 245 + cycle * 28;
    const xValues = [35, 61, 44, 58];
    const rotates = [-7, 5, -4, 4];
    const widths = ['major', 'minor', 'standard', 'minor'];
    return {
      entry,
      top,
      x: xValues[lane],
      rotate: rotates[lane] + ((cycle % 3) - 1),
      widthClass: widths[lane]
    };
  });
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
}

function renderScrollSigns() {
  if (!scrollSignFieldEl) {
    return;
  }
  const realYears = years.filter((year) => year !== '全部');
  scrollSignFieldEl.innerHTML = realYears.slice(0, signPositions.length).map((year, index) => {
    const position = signPositions[index];
    return `
      <div class="scroll-sign" style="top:${position.top}px; left:${position.x}%;">
        <span>${year}</span>
        <p>${yearDescriptors[year] || '这一段的群像逐渐铺开。'}</p>
      </div>
    `;
  }).join('');
}

function getScrollChapters(positionedEntries, trackHeight) {
  const realYears = years.filter((year) => year !== '全部');
  return realYears.map((year, index) => {
    const yearEntries = positionedEntries.filter(({ entry }) => String(entry.year) === year);
    const first = yearEntries[0];
    const last = yearEntries[yearEntries.length - 1] || first;
    return {
      year,
      label: progressLabels[Math.min(index, progressLabels.length - 1)],
      note: yearDescriptors[year] || '这一段的群像继续往前铺开。',
      count: yearEntries.length,
      top: first ? first.top : 0,
      activeTop: first ? Math.max(first.top - 140, 0) : 0,
      bottom: last ? last.top + 320 : 0
    };
  }).filter((chapter) => chapter.count > 0);
}

function renderScrollEntries() {
  if (!scrollEntryFieldEl || !windingTrackEl) {
    return;
  }

  const positionedEntries = getEntryPositions(allEntries);
  const trackHeight = Math.max(4200, positionedEntries[positionedEntries.length - 1].top + 420);
  scrollChapters = getScrollChapters(positionedEntries, trackHeight);
  windingTrackEl.style.height = `${trackHeight}px`;

  scrollEntryFieldEl.innerHTML = positionedEntries.map(({ entry, top, x, rotate, widthClass }) => {
    const imageMarkup = entry.images[0]
      ? `<div class="winding-entry-thumb"><img src="${imagePath(entry.images[0])}" alt="${entry.title}" /></div>`
      : `<div class="winding-entry-thumb winding-entry-thumb--fallback"><strong>${entry.title}</strong></div>`;
    const excerpt = getScrollEntryCopy(entry);
    const kind = `${entry.year} · ${getEntryTypeLabel(entry)}`;

    return `
      <a class="winding-entry winding-entry--${widthClass}" href="${pagePath(entry.slug)}" style="top:${top}px; left:${x}%; --entry-rotate:${rotate}deg;">
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

function getScrollYearPosition(year) {
  const positionedEntries = getEntryPositions(allEntries);
  const firstMatch = positionedEntries.find(({ entry }) => String(entry.year) === String(year));
  return firstMatch ? firstMatch.top : 0;
}

function renderScrollJumpbar() {
  if (!scrollJumpbarEl) {
    return;
  }

  if (!scrollChapters.length) {
    const positionedEntries = getEntryPositions(allEntries);
    const trackHeight = Math.max(4200, positionedEntries[positionedEntries.length - 1].top + 420);
    scrollChapters = getScrollChapters(positionedEntries, trackHeight);
  }

  const currentChapter = scrollChapters[0];
  if (!currentChapter) {
    scrollJumpbarEl.innerHTML = '';
    return;
  }

  scrollJumpbarEl.innerHTML = `
    <div class="scroll-jump-compact">
      <span class="scroll-jump-label">快速切年</span>
      <div class="scroll-jump-chips">
        ${scrollChapters.map((chapter, index) => `
          <button class="scroll-jump-chip ${index === 0 ? 'is-active' : ''}" type="button" data-scroll-year="${chapter.year}">
            <strong>${chapter.year}</strong>
            <span>${chapter.count} 则</span>
          </button>
        `).join('')}
      </div>
      <span class="scroll-jump-current" data-scroll-current>${currentChapter.year}</span>
    </div>
  `;
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
      return `
        <section class="year-block year-block--refined">
          <div class="year-heading year-heading--refined">
            <div>
              <h3 class="year-title">${year}</h3>
              <p class="year-note">${summarizeYear(year, entries)}</p>
            </div>
            <span class="year-count">${entries.length} 则</span>
          </div>
          <div class="archive-grid archive-grid--stacked">
            ${entries.map((entry) => `
              <a class="archive-card" href="${pagePath(entry.slug)}">
                ${entry.images[0] ? `<img class="archive-thumb" src="${imagePath(entry.images[0])}" alt="${entry.title}" />` : '<div class="archive-thumb archive-thumb--fallback"></div>'}
                <div class="archive-card-body">
                  <div class="archive-card-topline">
                    <span>${entry.shortDate || entry.date}</span>
                    <span>${getEntryTypeLabel(entry)}</span>
                  </div>
                  <h3>${entry.title}</h3>
                  <p>${getArchiveCardCopy(entry)}</p>
                </div>
              </a>
            `).join('')}
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
    if (scrollProgressEl) {
      scrollProgressEl.textContent = '当前年份';
    }
    return;
  }

  let activeChapter = scrollChapters[0];
  scrollChapters.forEach((chapter) => {
    if (focusY >= chapter.activeTop) {
      activeChapter = chapter;
    }
  });

  if (scrollProgressEl) {
    scrollProgressEl.textContent = activeChapter.year;
  }

  if (!scrollJumpbarEl) {
    return;
  }

  const currentEl = scrollJumpbarEl.querySelector('[data-scroll-current]');
  if (currentEl) {
    currentEl.textContent = activeChapter.year;
  }

  scrollJumpbarEl.querySelectorAll('[data-scroll-year]').forEach((button) => {
    button.classList.toggle('is-active', button.getAttribute('data-scroll-year') === activeChapter.year);
  });
}
function updateJourney() {
  if (activeView !== 'scroll-view' || !scrollSectionEl || !windingFrameEl || !windingTrackEl || !scrollBackdropEl || !scrollProgressEl) {
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

if (scrollJumpbarEl) {
  scrollJumpbarEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-scroll-year]');
    if (!button || !scrollSectionEl) {
      return;
    }

    const targetTop = getScrollYearPosition(button.dataset.scrollYear);
    setActiveView('scroll-view');
    window.scrollTo({
      top: scrollSectionEl.offsetTop + Math.max(targetTop - 140, 0),
      behavior: 'smooth'
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
renderScrollSigns();
renderScrollEntries();
renderScrollJumpbar();
renderScrollCoda();
renderYearTabs();
renderArchiveList();
initMusicPlayer();
setActiveView(getViewFromHash());
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);

