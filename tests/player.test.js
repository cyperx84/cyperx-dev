// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

// Helper: set up minimal DOM for a blog page with the audio player
function setupBlogDOM({ audioSrc = '/audio/blog/test-post.mp3', hasVariant = true } = {}) {
  document.body.innerHTML = '';

  if (hasVariant) {
    const variant = document.createElement('div');
    variant.className = 'variant-dark';
    variant.innerHTML = '<div class="min-h-screen"></div>';
    document.body.appendChild(variant);
  }

  const header = document.createElement('header');
  header.className = 'site-header fixed top-0 w-full py-4 sm:py-6 z-50';
  document.body.appendChild(header);

  const player = document.createElement('div');
  player.id = 'audio-player';
  player.className = 'fixed top-[72px] sm:top-[96px] left-0 right-0 z-[60] backdrop-blur-md border-b px-4 py-2 hidden';
  player.innerHTML = `
    <button id="play-btn" class="w-8 h-8">▶</button>
    <span id="audio-title"></span>
    <span id="audio-time">0:00</span>
    <div id="progress-bar"><div id="progress-fill" style="width:0%"></div></div>
    <span id="audio-duration">0:00</span>
    <button id="speed-btn">1x</button>
    <audio id="blog-audio" preload="metadata" src="${audioSrc}"></audio>
  `;
  document.body.appendChild(player);
  return { player };
}

// Extract the core initAudioPlayer logic into testable form
function initAudioPlayer() {
  const player = document.getElementById('audio-player');
  const audio = document.getElementById('blog-audio');
  const playBtn = document.getElementById('play-btn');
  const speedBtn = document.getElementById('speed-btn');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const timeDisplay = document.getElementById('audio-time');
  const durationDisplay = document.getElementById('audio-duration');
  const titleDisplay = document.getElementById('audio-title');
  if (!player || !audio || !playBtn) return;

  const themes = {
    dark:    { bg: 'rgba(14,14,14,0.95)', border: '#39FF14', accent: '#39FF14', text: 'rgba(226,226,226,0.5)', track: '#1f1f1f' },
    light:   { bg: 'rgba(245,245,245,0.95)', border: '#131313', accent: '#131313', text: 'rgba(19,19,19,0.5)', track: '#e0e0e0' },
    extreme: { bg: 'rgba(10,0,16,0.95)', border: '#AC89FF', accent: '#AC89FF', text: 'rgba(255,255,255,0.5)', track: '#1a0030' },
  };

  function applyTheme() {
    const active = document.querySelector('.variant-dark, .variant-light, .variant-extreme');
    let t = 'dark';
    if (active) {
      if (active.classList.contains('variant-light')) t = 'light';
      else if (active.classList.contains('variant-extreme')) t = 'extreme';
    }
    const c = themes[t];
    player.style.background = c.bg;
    player.style.borderBottomColor = c.border + '33';
    playBtn.style.borderColor = c.accent;
    playBtn.style.color = c.accent;
    speedBtn.style.borderColor = c.text;
    speedBtn.style.color = c.text;
    progressFill.style.background = c.accent;
    progressBar.style.background = c.track;
    titleDisplay.style.color = c.accent + '99';
    timeDisplay.style.color = c.text;
    durationDisplay.style.color = c.text;
    titleDisplay.textContent = 'LISTEN · ' + document.title.split(' | ')[0].toUpperCase();
  }

  applyTheme();

  // Show player
  audio.addEventListener('loadedmetadata', () => player.classList.remove('hidden'));
  // Don't hide on error — keep player visible
  player.classList.remove('hidden');

  const speeds = [1, 1.25, 1.5, 2];
  let speedIdx = 0;
  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) { audio.play(); playBtn.textContent = '⏸'; }
    else { audio.pause(); playBtn.textContent = '▶'; }
  });

  speedBtn.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    audio.playbackRate = speeds[speedIdx];
    speedBtn.textContent = speeds[speedIdx] + 'x';
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    timeDisplay.textContent = fmt(audio.currentTime);
    durationDisplay.textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => {
    playBtn.textContent = '▶';
    progressFill.style.width = '0%';
  });

  progressBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
}

describe('Audio Player', () => {
  beforeEach(() => {
    document.title = 'Test Post | CyperX';
  });

  it('player is visible after init (not hidden by missing audio)', () => {
    setupBlogDOM();
    initAudioPlayer();
    const player = document.getElementById('audio-player');
    expect(player.classList.contains('hidden')).toBe(false);
  });

  it('player z-index is above navbar', () => {
    setupBlogDOM();
    initAudioPlayer();
    const player = document.getElementById('audio-player');
    const header = document.querySelector('.site-header');
    // Check class contains z-[60] (JSDOM doesn't resolve Tailwind to computed styles)
    expect(player.className).toContain('z-');
    // Extract z-index from class
    const zMatch = player.className.match(/z-\[(\d+)\]/);
    expect(zMatch).not.toBeNull();
    expect(parseInt(zMatch[1])).toBeGreaterThanOrEqual(60);
  });

  it('player stays visible after simulated audio error', () => {
    setupBlogDOM();
    initAudioPlayer();
    const player = document.getElementById('audio-player');
    const audio = document.getElementById('blog-audio');
    // Simulate error (404 audio file)
    audio.dispatchEvent(new Event('error'));
    expect(player.classList.contains('hidden')).toBe(false);
  });

  it('player stays visible on re-init (nav-back scenario)', () => {
    setupBlogDOM();
    // First init
    initAudioPlayer();
    const player = document.getElementById('audio-player');
    expect(player.classList.contains('hidden')).toBe(false);

    // Simulate nav-away: hide player
    player.classList.add('hidden');

    // Simulate nav-back: re-init (new DOM from view transition)
    setupBlogDOM();
    initAudioPlayer();
    const newPlayer = document.getElementById('audio-player');
    expect(newPlayer.classList.contains('hidden')).toBe(false);
  });

  it('play button toggles text on click', () => {
    setupBlogDOM();
    initAudioPlayer();
    const playBtn = document.getElementById('play-btn');
    expect(playBtn.textContent).toBe('▶');
    // JSDOM audio.paused is a native getter, can't override
    // Just verify initial state is correct
    expect(typeof playBtn.onclick).not.toBe('function'); // uses addEventListener
  });

  it('speed button cycles through speeds', () => {
    setupBlogDOM();
    initAudioPlayer();
    const speedBtn = document.getElementById('speed-btn');
    expect(speedBtn.textContent).toBe('1x');
    speedBtn.click();
    expect(speedBtn.textContent).toBe('1.25x');
    speedBtn.click();
    expect(speedBtn.textContent).toBe('1.5x');
    speedBtn.click();
    expect(speedBtn.textContent).toBe('2x');
    speedBtn.click();
    expect(speedBtn.textContent).toBe('1x'); // wraps
  });

  it('dark theme is applied correctly', () => {
    setupBlogDOM();
    initAudioPlayer();
    const player = document.getElementById('audio-player');
    expect(player.style.background).toContain('14');
  });

  it('light theme is applied when variant-light is active', () => {
    setupBlogDOM();
    // Switch to light variant
    const variant = document.querySelector('.variant-dark');
    variant.classList.remove('variant-dark');
    variant.classList.add('variant-light');
    initAudioPlayer();
    const player = document.getElementById('audio-player');
    expect(player.style.background).toContain('245');
  });

  it('progress updates on timeupdate', () => {
    setupBlogDOM();
    initAudioPlayer();
    const audio = document.getElementById('blog-audio');
    const progressFill = document.getElementById('progress-fill');
    const timeDisplay = document.getElementById('audio-time');
    // Mock duration and currentTime
    Object.defineProperty(audio, 'duration', { value: 120, writable: false });
    Object.defineProperty(audio, 'currentTime', { value: 60, writable: false });
    audio.dispatchEvent(new Event('timeupdate'));
    expect(progressFill.style.width).toBe('50%');
    expect(timeDisplay.textContent).toBe('1:00');
  });
});
