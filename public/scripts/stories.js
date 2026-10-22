(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('stories-data').textContent);
  const stories = data.stories;
  const storyById = Object.fromEntries(stories.map(story => [story.id, story]));
  const chapterById = Object.fromEntries(data.chapters.map(chapter => [chapter.id, chapter]));
  const language = document.documentElement.lang === 'es' ? 'es' : 'en';
  let openIndex = 0;
  let lastFocus = null;
  let isZoomed = false;
  const dialog = document.getElementById('image-viewer');
  const image = document.getElementById('viewer-image');
  const imageBody = document.getElementById('viewer-body');
  const zoomButton = document.getElementById('viewer-zoom');
  const previousButton = document.getElementById('viewer-prev');
  const nextButton = document.getElementById('viewer-next');
  const closeButton = document.getElementById('viewer-close');

  function translated(key) {
    return data.ui[key][language];
  }

  function resetZoom() {
    isZoomed = false;
    imageBody.classList.remove('is-zoomed');
    zoomButton.setAttribute('aria-label', translated('zoom'));
    imageBody.scrollTo(0, 0);
  }

  function updateViewer() {
    const story = stories[openIndex];
    image.src = `/images/stories/${story.id}.webp`;
    image.alt = story.alt[language];
    document.getElementById('viewer-title').textContent = story.title[language];
    document.getElementById('viewer-count').textContent = `${String(openIndex + 1).padStart(2, '0')} / ${stories.length}`;
    document.getElementById('viewer-full').href = `/images/stories/${story.id}.webp`;
    previousButton.disabled = openIndex === 0;
    nextButton.disabled = openIndex === stories.length - 1;
    resetZoom();
  }

  function openViewer(id, trigger) {
    openIndex = stories.findIndex(story => story.id === id);
    if (openIndex < 0) return;
    lastFocus = trigger;
    updateViewer();
    dialog.showModal();
    document.body.classList.add('viewer-open');
    closeButton.focus({ preventScroll: true });
  }

  function moveViewer(direction) {
    const next = openIndex + direction;
    if (next < 0 || next >= stories.length) return;
    openIndex = next;
    updateViewer();
    // A disabled previous/next button must not swallow the focus at an endpoint.
    if (document.activeElement.disabled) closeButton.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-image]').forEach(button => {
    button.addEventListener('click', () => openViewer(button.dataset.openImage, button));
  });
  previousButton.addEventListener('click', () => moveViewer(-1));
  nextButton.addEventListener('click', () => moveViewer(1));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    resetZoom();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveViewer(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveViewer(1); }
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button:not(:disabled),a[href]')].filter(el => el.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  zoomButton.addEventListener('click', () => {
    isZoomed = !isZoomed;
    imageBody.classList.toggle('is-zoomed', isZoomed);
    zoomButton.setAttribute('aria-label', translated(isZoomed ? 'zoomOut' : 'zoom'));
    if (!isZoomed) imageBody.scrollTo(0, 0);
  });

  const rows = [...document.querySelectorAll('[data-story-number]')];
  const sections = [...document.querySelectorAll('[data-chapter]')];
  const progress = document.getElementById('reading-progress');
  const current = document.getElementById('reading-current');
  const tabs = [...document.querySelectorAll('[data-chapter-link]')];
  let pendingFrame = false;

  function updateReading() {
    pendingFrame = false;
    const css = getComputedStyle(document.documentElement);
    const offset = parseInt(css.getPropertyValue('--header'), 10) + parseInt(css.getPropertyValue('--nav'), 10) + 60;
    let activeChapter = sections[0].dataset.chapter;
    let activeStory = 1;
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= offset) activeChapter = section.dataset.chapter;
    });
    rows.forEach(row => {
      if (row.getBoundingClientRect().top <= window.innerHeight * 0.55) activeStory = Number(row.dataset.storyNumber);
    });
    tabs.forEach(tab => {
      const active = tab.dataset.chapterLink === activeChapter;
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'location');
      else tab.removeAttribute('aria-current');
    });
    current.textContent = String(activeStory).padStart(2, '0');
    const start = rows[0].offsetTop;
    const end = rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight - window.innerHeight;
    const ratio = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, end - start)));
    progress.style.width = `${ratio * 100}%`;
  }

  function scheduleReading() {
    if (!pendingFrame) { pendingFrame = true; requestAnimationFrame(updateReading); }
  }
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading, { passive: true });
  window.addEventListener('load', scheduleReading);
  updateReading();
})();
