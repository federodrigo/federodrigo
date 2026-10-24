export {};
const es = document.documentElement.lang === 'es';
// Select a new illustrated story on each homepage load; keep its link and alt text in sync.
const storyLink = document.querySelector<HTMLAnchorElement>('[data-home-story]');
const storyOptionsElement = document.querySelector('#home-story-options');
if (storyLink && storyOptionsElement) {
  const options = JSON.parse(storyOptionsElement.textContent || '[]') as Array<{ id: string; src: string; href: string; alt: string; label: string; width: number; height: number }>;
  let previous = storyLink.dataset.storyId;
  try { previous = localStorage.getItem('federodrigo-last-home-story') || previous; } catch { /* Random selection also works without storage. */ }
  const candidates = options.filter(option => option.id !== previous);
  const selected = candidates[Math.floor(Math.random() * candidates.length)] || options[0];
  const artwork = storyLink.querySelector('img');
  if (selected && artwork) {
    storyLink.href = selected.href;
    storyLink.dataset.storyId = selected.id;
    storyLink.setAttribute('aria-label', selected.label);
    artwork.setAttribute('alt', selected.alt);
    artwork.setAttribute('width', String(selected.width));
    artwork.setAttribute('height', String(selected.height));
    artwork.setAttribute('src', selected.src);
    try { localStorage.setItem('federodrigo-last-home-story', selected.id); } catch { /* No persistence required to show the artwork. */ }
  }
}
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Preserve the Speaking typewriter and its different conclusions for leadership and security.
const speakingTopic = document.querySelector<HTMLElement>('[data-speaking-closing-rotating]');
if (speakingTopic) {
  const title = speakingTopic.closest('h2');
  const emphasis = title?.querySelector<HTMLElement>('[data-speaking-closing-emphasis]');
  const article = title?.querySelector<HTMLElement>('[data-speaking-closing-article]');
  const verb = title?.querySelector<HTMLElement>('[data-speaking-closing-verb]');
  const part = title?.querySelector<HTMLElement>('[data-speaking-closing-part]');
  const partTail = title?.querySelector<HTMLElement>('[data-speaking-closing-part-tail]');
  const determiner = title?.querySelector<HTMLElement>('[data-speaking-closing-determiner]');
  // Keep each existing topic's color and give cybersecurity its own muted pastel blue.
  const topicColors = ['#8b8897', '#9b7ab7', '#729984', '#b7798c', '#aa8a50', '#76a6b8', '#b27e64'];
  speakingTopic.style.color = topicColors[0];
  const topics = es ? [
    { label: 'tecnología', article: 'La', verb: 'es', mode: 'never' },
    { label: 'IA', article: 'La', verb: 'es', mode: 'never' },
    { label: 'datos', article: 'Los', verb: 'son', mode: 'never' },
    { label: 'nube', article: 'La', verb: 'es', mode: 'never' },
    { label: 'ERP', article: 'El', verb: 'es', mode: 'never' },
    { label: 'ciberseguridad', article: 'La', verb: 'es', mode: 'part' },
    { label: 'liderazgo', article: 'El', verb: 'es', mode: 'affirmative' }
  ] : ['Technology', 'AI', 'Data', 'Cloud', 'ERP', 'Cybersecurity', 'Leadership'].map(label => ({
    label, article: '', verb: 'is', mode: label === 'Cybersecurity' ? 'part' : label === 'Leadership' ? 'affirmative' : 'never'
  }));
  title?.setAttribute('aria-label', es
    ? 'La tecnología, la IA, los datos, la nube y el ERP nunca son el punto de partida; la ciberseguridad es parte del punto de partida; el liderazgo es el punto de partida'
    : 'Technology, AI, data, cloud and ERP are never the starting point; cybersecurity is part of the starting point; leadership is the starting point');
  if (!reduceMotion.matches) {
    let index = 0;
    let characters = topics[0].label.length;
    let deleting = true;
    let timer: number;
    const schedule = (delay: number) => { timer = window.setTimeout(step, delay); };
    const step = () => {
      if (document.hidden) { schedule(500); return; }
      const topic = topics[index];
      if (deleting) {
        characters = Math.max(0, characters - 1);
        speakingTopic.textContent = topic.label.slice(0, characters);
        if (characters === 0) {
          index = (index + 1) % topics.length;
          const next = topics[index];
          if (article) article.textContent = next.article;
          speakingTopic.style.color = topicColors[index];
          if (verb) {
            verb.textContent = next.verb;
            verb.classList.toggle('speaking-closing-emphasis', next.mode === 'affirmative' || next.mode === 'part');
          }
          if (emphasis) {
            emphasis.textContent = es ? 'nunca' : 'never';
            emphasis.hidden = next.mode !== 'never';
          }
          if (part) part.hidden = next.mode !== 'part';
          if (partTail) partTail.hidden = next.mode !== 'part';
          if (determiner) determiner.hidden = next.mode === 'part';
          deleting = false;
          schedule(300);
        } else schedule(65);
      } else {
        characters = Math.min(topic.label.length, characters + 1);
        speakingTopic.textContent = topic.label.slice(0, characters);
        if (characters === topic.label.length) { deleting = true; schedule(2000); }
        else schedule(125);
      }
    };
    schedule(2000);
    window.addEventListener('pagehide', () => window.clearTimeout(timer), { once: true });
  }
}

const header = document.querySelector<HTMLElement>('.site-header');
const menu = document.querySelector<HTMLElement>('#primary-navigation');
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const backdrop = document.querySelector<HTMLButtonElement>('.menu-backdrop');

function closeMenu(restoreFocus = false) {
  document.body.classList.remove('menu-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', es ? 'Abrir menú' : 'Open menu');
  if (backdrop) backdrop.hidden = true;
  if (restoreFocus) toggle?.focus();
}

toggle?.addEventListener('click', () => {
  if (document.body.classList.contains('menu-open')) { closeMenu(true); return; }
  document.body.classList.add('menu-open');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', es ? 'Cerrar menú' : 'Close menu');
  if (backdrop) backdrop.hidden = false;
  menu?.querySelector<HTMLAnchorElement>('a')?.focus();
});
backdrop?.addEventListener('click', () => closeMenu(true));
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (!document.body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') closeMenu(true);
  if (event.key === 'Tab') {
    const controls = [...(header?.querySelectorAll<HTMLElement>('a,button') || [])].filter(el => el.getClientRects().length);
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
  }
});
window.matchMedia('(min-width: 1101px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelectorAll<HTMLAnchorElement>('.language-switch a').forEach(link => link.addEventListener('click', () => {
  try { localStorage.setItem('federodrigo-language', link.lang); } catch { /* Navigation remains available. */ }
}));

const revealTargets = [...document.querySelectorAll<HTMLElement>('.reveal-item,.reveal-section > h2,.story-copy,.story-visual,.story-preview,.home-book-card,.leadership-card,.media-item,.home-event')];
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
  revealTargets.forEach((target, index) => {
    if (target.parentElement?.closest('.motion-ready')) return;
    target.classList.add('motion-ready');
    target.style.setProperty('--motion-delay', `${Math.min(index % 3, 2) * 65}ms`);
    observer.observe(target);
  });
  reduceMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); revealTargets.forEach(el => el.classList.add('motion-visible')); }
  });
}

let scrollPending = false;
const updateHeader = () => { scrollPending = false; header?.classList.toggle('is-scrolled', scrollY > 16); };
window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateHeader); } }, { passive: true });
updateHeader();

document.querySelectorAll<HTMLElement>('[data-speaking-slider]').forEach(slider => {
  const slides = [...slider.querySelectorAll<HTMLElement>('[data-speaking-slide]')];
  const dots = [...slider.querySelectorAll<HTMLButtonElement>('[data-speaking-dot]')];
  function show(index: number) {
    slides.forEach((slide, i) => { slide.classList.toggle('is-active', i === index); slide.setAttribute('aria-hidden', String(i !== index)); });
    dots.forEach((dot, i) => { dot.classList.toggle('is-active', i === index); dot.setAttribute('aria-current', String(i === index)); });
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
});

const form = document.querySelector<HTMLFormElement>('#contact-form');
const submit = document.querySelector<HTMLButtonElement>('#contact-submit');
const submitText = document.querySelector<HTMLElement>('.contact-page-submit-text');
const status = document.querySelector<HTMLElement>('#contact-status');
if (form && submit && submitText && status) {
  const preview = form.dataset.preview === 'true';
  const idleLabel = preview ? (es ? 'Continuar por correo' : 'Continue by email') : (es ? 'Enviar mensaje' : 'Send message');
  submitText.textContent = idleLabel;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    if (preview) {
      const subject = form.querySelector('select option:checked')?.textContent || '';
      const body = `${fields.get('message')}\n\n${fields.get('firstName')} ${fields.get('lastName')}\n${fields.get('email')}`;
      window.location.href = `mailto:contact@federodrigo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.hidden = false;
      status.textContent = es ? 'Se abrirá tu aplicación de correo con el mensaje preparado para revisar y enviar' : 'Your email app will open with the message ready to review and send';
      return;
    }
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submitText.textContent = es ? 'Enviando…' : 'Sending…';
    status.hidden = true;
    try {
      const response = await fetch(form.action, { method: 'POST', body: fields, headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message || (es ? 'No se pudo enviar el mensaje' : 'The message could not be sent'));
      form.reset();
      status.textContent = es ? 'Gracias, tu mensaje fue enviado' : 'Thank you, your message has been sent';
      status.className = 'contact-page-status-success';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : (es ? 'Intentá nuevamente o escribime por correo' : 'Please try again or contact me by email');
      status.className = 'contact-page-status-error';
    } finally {
      status.hidden = false;
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submitText.textContent = idleLabel;
    }
  });
}
