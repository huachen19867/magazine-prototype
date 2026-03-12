const site = window.QBJ_SITE;
const slug = document.body.dataset.slug;
const orderedEntries = [site.preface, ...site.entries];
const currentIndex = orderedEntries.findIndex((entry) => entry.slug === slug);
const entry = orderedEntries[currentIndex];
const root = document.getElementById('articleRoot');
const musicTracks = [
  { title: '私语', src: '../music/私语.wav' },
  { title: '观卷', src: '../music/观卷.mp4' }
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

let activeTrackIndex = 0;
let activeMusicMode = 'sequential';
let activeMusicVolume = 0.68;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function assetPath(path) {
  return path ? `../${path}` : '';
}

function pagePath(targetSlug) {
  return `${targetSlug}.html`;
}

function getFriendlyLinkLabel(url, explicitLabel = '') {
  if (explicitLabel) {
    if (/小宇宙|喜马拉雅|网易云音乐/.test(explicitLabel)) {
      return '收听';
    }
    if (/附链接|链接|原文/.test(explicitLabel)) {
      explicitLabel = '';
    } else {
      return '打开';
    }
  }

  if (/mp\.weixin\.qq\.com/.test(url)) {
    return '微信原文';
  }
  if (/dedao\.cn/.test(url)) {
    return '得到课程页';
  }
  if (/xiaoyuzhoufm\.com/.test(url)) {
    return '小宇宙';
  }
  if (/ximalaya\.com/.test(url)) {
    return '喜马拉雅';
  }
  if (/music\.163\.com/.test(url)) {
    return '网易云音乐';
  }

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').replace(/^m\./, '');
    return hostname || '查看链接';
  } catch (error) {
    return '查看链接';
  }
}

function linkify(text) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0];
    let prefix = text.slice(lastIndex, match.index);
    let label = '';
    const labelMatch = prefix.match(/([^\s：:\n]{1,20})[：:]\s*$/);
    if (labelMatch) {
      label = labelMatch[1];
    }
    result += `${prefix}<a class="article-link" href="${url}" target="_blank" rel="noreferrer">${getFriendlyLinkLabel(url, label)}</a>`;
    lastIndex = match.index + url.length;
  }

  result += text.slice(lastIndex);
  return result;
}

function getBlocks(targetEntry) {
  if (Array.isArray(targetEntry.blocks) && targetEntry.blocks.length) {
    return targetEntry.blocks;
  }

  const fallbackBlocks = [];
  if (Array.isArray(targetEntry.paragraphs)) {
    targetEntry.paragraphs.forEach((paragraph) => {
      fallbackBlocks.push({ type: 'paragraph', text: paragraph });
    });
  }
  if (Array.isArray(targetEntry.images)) {
    targetEntry.images.forEach((image) => {
      fallbackBlocks.push({ type: 'image', images: [image], caption: '' });
    });
  }
  return fallbackBlocks;
}

function trimText(text, maxLength = 110) {
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
  return entries.filter((candidate) => {
    if (!candidate || seen.has(candidate.slug)) {
      return false;
    }
    seen.add(candidate.slug);
    return true;
  });
}

function getVisibleEntryParagraphs(targetEntry) {
  const sourceParagraphs = Array.isArray(targetEntry.paragraphs) ? targetEntry.paragraphs : [];
  return sourceParagraphs.filter((paragraph) => (
    paragraph
    && !/^附链接：?$/.test(paragraph)
    && !/^https?:\/\//.test(paragraph)
    && !/^(小宇宙|喜马拉雅|网易云音乐)：https?:\/\//.test(paragraph)
  ));
}

function getEntryTypeLabel(targetEntry, blocks) {
  const imageCount = (targetEntry.images || []).length;
  const paragraphCount = blocks.filter((block) => block.type === 'paragraph').length;
  if (slug === 'preface') {
    return '卷首';
  }
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



function getArticleLeadNote(targetEntry, blocks) {
  const paragraphCount = blocks.filter((block) => block.type === 'paragraph').length;
  const imageCount = (targetEntry.images || []).length;
  return `${targetEntry.year} 年卷 · ${paragraphCount} 段正文${imageCount ? ` · ${imageCount} 张配图` : ''}`;
}

function getRelatedEntries(targetEntry) {
  const sameYear = orderedEntries.filter((candidate) => candidate.slug !== targetEntry.slug && candidate.year === targetEntry.year);
  const nearby = orderedEntries
    .filter((candidate) => candidate.slug !== targetEntry.slug)
    .sort((left, right) => Math.abs(orderedEntries.findIndex((item) => item.slug === left.slug) - currentIndex) - Math.abs(orderedEntries.findIndex((item) => item.slug === right.slug) - currentIndex));

  return uniqueEntries([...sameYear, ...nearby]).slice(0, 3);
}

function renderArticleAfterglow(targetEntry, blocks) {
  const relatedEntries = getRelatedEntries(targetEntry);
  return `
    <section class="article-afterglow">
      <div class="article-related-panel article-related-panel--full">
        <div class="article-related-head">
          <strong>顺手再看三篇</strong>
          <span>别让阅读在这一页突然停住。</span>
        </div>
        <div class="article-related-grid">
          ${relatedEntries.map((candidate) => `
            <a class="article-related-card" href="${pagePath(candidate.slug)}">
              <span>${candidate.shortDate || candidate.date}</span>
              <strong>${candidate.title}</strong>
              <p>${trimText(getVisibleEntryParagraphs(candidate).slice(0, 1).join(' ') || candidate.summary || '', 56)}</p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
function classifyEntry(targetEntry, blocks) {
  const imageCount = (targetEntry.images || []).length;
  const paragraphCount = blocks.filter((block) => block.type === 'paragraph').length;
  if (slug === 'preface') {
    return {
      frameClass: 'article-frame article-frame--preface article-frame--preface-tone',
      kicker: '卷首'
    };
  }
  if (imageCount >= 3) {
    return {
      frameClass: 'article-frame article-frame--atlas',
      kicker: '图文特辑'
    };
  }
  if (paragraphCount <= 3) {
    return {
      frameClass: 'article-frame article-frame--brief',
      kicker: '卷中札记'
    };
  }
  return {
    frameClass: 'article-frame article-frame--chronicle',
    kicker: '群本纪内页'
  };
}

function renderFigure(block, index) {
  const images = Array.isArray(block.images) ? block.images.filter(Boolean) : [];
  if (!images.length) {
    return '';
  }

  const figureClass = images.length > 1 ? 'article-figure article-figure--multi' : 'article-figure';
  const mediaMarkup = images.map((image, imageIndex) => `
    <div class="article-figure-media-item">
      <img src="${assetPath(image)}" alt="${entry.title} 配图 ${index + imageIndex + 1}" />
    </div>
  `).join('');

  return `
    <figure class="${figureClass}">
      <div class="article-figure-media">
        ${mediaMarkup}
      </div>
      ${block.caption ? `<figcaption class="article-figcaption">${linkify(block.caption)}</figcaption>` : ''}
    </figure>
  `;
}

function ensureMusicDock() {
  if (document.getElementById('musicDock')) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="music-dock" id="musicDock">
      <button class="music-toggle" id="musicToggle" type="button" aria-label="打开音乐面板" aria-expanded="false" aria-controls="musicPanel">
        <span class="music-notes" aria-hidden="true">
          <span class="music-note music-note--one">♪</span>
          <span class="music-note music-note--two">♫</span>
          <span class="music-note music-note--three">♪</span>
        </span>
        <span class="music-record">
          <span class="music-record-core"></span>
        </span>
      </button>
      <section class="music-panel" id="musicPanel" hidden>
        <div class="music-panel-head">
          <div>
            <p class="music-kicker">Music</p>
            <strong>边听边看</strong>
          </div>
          <button class="music-close" id="musicClose" type="button" aria-label="收起音乐面板">收起</button>
        </div>
        <div class="music-track-list">
          <button class="music-track is-active" type="button" data-track-index="0">私语</button>
          <button class="music-track" type="button" data-track-index="1">观卷</button>
        </div>
        <div class="music-controls">
          <div class="music-actions">
            <button class="music-play-toggle" id="musicPlayToggle" type="button" aria-label="播放">
              <span class="music-control-icon" aria-hidden="true"></span>
            </button>
            <button class="music-mode-toggle" id="musicModeToggle" type="button" aria-label="顺序播放">
              <span class="music-control-icon" aria-hidden="true"></span>
            </button>
          </div>
          <div class="music-volume">
            <span class="music-volume-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 14H8.5L13 18V6L8.5 10H5V14Z" fill="currentColor"/><path d="M16 9.5C17.2 10.3 18 11.6 18 13C18 14.4 17.2 15.7 16 16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
            <input class="music-volume-slider" id="musicVolume" type="range" min="0" max="100" step="1" value="68" aria-label="音乐音量">
            <span class="music-volume-value" id="musicVolumeValue">68%</span>
          </div>
          <p class="music-now" id="musicNow">当前未播放，点一首就能开始。</p>
        </div>
        <audio id="musicAudio" preload="metadata"></audio>
      </section>
    </div>
  `);
}

function initMusicPlayer() {
  ensureMusicDock();

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

  if (!musicAudioEl) {
    return;
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

  function getMusicModeMeta() {
    return musicModes.find((mode) => mode.key === activeMusicMode) || musicModes[0];
  }

  function setMusicPanelOpen(open) {
    musicPanelEl.hidden = !open;
    musicToggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function getActiveTrack() {
    return musicTracks[activeTrackIndex] || musicTracks[0];
  }

  function renderMusicPlayToggle() {
    const isPaused = musicAudioEl.paused || musicAudioEl.ended;
    musicPlayToggleEl.innerHTML = `<span class="music-control-icon" aria-hidden="true">${getMusicControlIcon(isPaused ? 'play' : 'pause')}</span>`;
    musicPlayToggleEl.setAttribute('aria-label', isPaused ? '播放' : '暂停');
  }

  function applyMusicMode() {
    musicAudioEl.loop = activeMusicMode === 'single';
    const modeMeta = getMusicModeMeta();
    musicModeToggleEl.innerHTML = `<span class="music-control-icon" aria-hidden="true">${getMusicControlIcon(modeMeta.key)}</span>`;
    musicModeToggleEl.setAttribute('aria-label', `${modeMeta.label}播放`);
  }

  function applyMusicVolume() {
    const volumePercent = Math.round(activeMusicVolume * 100);
    musicAudioEl.volume = activeMusicVolume;
    musicVolumeEl.value = String(volumePercent);
    musicVolumeValueEl.textContent = `${volumePercent}%`;
  }

  function setMusicNow(text) {
    musicNowEl.textContent = text;
  }

  function syncMusicButtons() {
    musicTrackButtons.forEach((button) => {
      const index = Number(button.dataset.trackIndex);
      button.classList.toggle('is-active', index === activeTrackIndex);
    });
    renderMusicPlayToggle();
    applyMusicMode();
    musicDockEl.classList.toggle('is-playing', !musicAudioEl.paused && !musicAudioEl.ended);
  }

  function restoreMusicTime(timeValue = getStoredMusicTime()) {
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

  function cycleMusicMode() {
    const currentModeIndex = musicModes.findIndex((mode) => mode.key === activeMusicMode);
    const nextMode = musicModes[(currentModeIndex + 1) % musicModes.length] || musicModes[0];
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

  function loadTrack(index, options = {}) {
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
    musicAudioEl.pause();
    storeMusicPlaying(false);
    storeMusicTime(musicAudioEl.currentTime || 0);
    syncMusicButtons();
    setMusicNow(`已经暂停 ${getActiveTrack().title}。`);
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

  musicToggleEl.addEventListener('click', () => {
    setMusicPanelOpen(musicPanelEl.hidden);
  });

  musicCloseEl.addEventListener('click', () => {
    setMusicPanelOpen(false);
  });

  musicTrackButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextIndex = Number(button.dataset.trackIndex || 0);
      loadTrack(nextIndex);
      playCurrentTrack();
      setMusicPanelOpen(true);
    });
  });

  musicPlayToggleEl.addEventListener('click', () => {
    if (musicAudioEl.paused) {
      playCurrentTrack();
    } else {
      pauseCurrentTrack();
    }
  });

  musicModeToggleEl.addEventListener('click', () => {
    cycleMusicMode();
  });

  musicVolumeEl.addEventListener('input', (event) => {
    updateMusicVolume(Number(event.target.value) / 100);
  });

  musicVolumeEl.addEventListener('change', (event) => {
    updateMusicVolume(Number(event.target.value) / 100, { announce: true });
  });

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

if (!entry) {
  root.innerHTML = `
    <section class="not-found">
      <h1>这篇文章暂时没有找到</h1>
      <p>可以先回到 <a href="../index.html#archive-view">群史目录</a> 或 <a href="../index.html#scroll-view">长卷页面</a> 继续翻阅。</p>
    </section>
  `;
} else {
  document.title = `${entry.title} | 群本纪`;
  const prev = currentIndex > 0 ? orderedEntries[currentIndex - 1] : null;
  const next = currentIndex < orderedEntries.length - 1 ? orderedEntries[currentIndex + 1] : null;
  const blocks = getBlocks(entry);
  const variant = classifyEntry(entry, blocks);
  const articleType = getEntryTypeLabel(entry, blocks);
  const articleLeadNote = getArticleLeadNote(entry, blocks);
  const renderedBlocks = blocks.map((block, index) => {
    if (block.type === 'image') {
      return renderFigure(block, index);
    }
    return `<p class="article-paragraph">${linkify(block.text || '')}</p>`;
  }).join('');

  root.innerHTML = `
    <section class="article-page">
      <article class="${variant.frameClass}">
        <header class="article-header">
          <span class="article-kicker">${variant.kicker}</span>
          <h1 class="article-title">${entry.title}</h1>
          <div class="article-meta">
            <span>${entry.date}</span>
            <span>${articleType}</span>
          </div>          <p class="article-lead-note">${articleLeadNote}</p>
        </header>

        <div class="article-flow">
          ${renderedBlocks}
        </div>

        ${renderArticleAfterglow(entry, blocks)}

        <footer class="article-footer-nav">
          ${prev ? `<a href="${pagePath(prev.slug)}">上一篇：${prev.title}</a>` : ''}
          <a href="../index.html#archive-view">群史目录</a>
          <a href="../index.html#scroll-view">蜿蜒长卷</a>
          <a href="../index.html#home-view" data-return-home="true">入口页</a>
          ${next ? `<a href="${pagePath(next.slug)}">下一篇：${next.title}</a>` : ''}
        </footer>
      </article>
    </section>
  `;
}

function bindSmartHomeLink() {
  const homeLink = document.querySelector('[data-return-home="true"]');
  if (!homeLink) {
    return;
  }

  homeLink.addEventListener('click', (event) => {
    const fromIndex = /\/index\.html(?:#.*)?$/i.test(document.referrer) || /magazine-prototype\/index\.html(?:#.*)?$/i.test(document.referrer);
    if (!fromIndex || window.history.length <= 1) {
      return;
    }

    event.preventDefault();
    window.history.back();
  });
}
initMusicPlayer();
bindSmartHomeLink();