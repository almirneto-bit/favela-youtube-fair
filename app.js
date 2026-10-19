/*
 * Favela • Interactive Showcase v2
 * Telas fiéis ao PPTX e microinterações leves, 100% locais.
 * As áreas clicáveis ficam em slides.js.
 */
(() => {
  'use strict';

  const slides = window.SHOWCASE_SLIDES || [];
  const image = document.getElementById('slideImage');
  const stage = document.getElementById('stage');
  const hotspots = document.getElementById('hotspots');
  const transcript = document.getElementById('accessibilityTranscript');
  const connectionStatus = document.getElementById('connectionStatus');
  if (!slides.length || !image || !stage || !hotspots) return;

  const AUTO_RESET_SECONDS = 180;
  const ENABLE_SWIPE = true;
  const ENABLE_KEYBOARD = true;
  const MOTION_DURATION_MS = 280;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let currentIndex = 0;
  let idleTimer = null;
  let imageSwitch = 0;
  let swipeStart = null;
  let ghost = null;

  const clamp = (value) => Math.min(slides.length - 1, Math.max(0, value));
  const getHashIndex = () => {
    const match = location.hash.match(/^#tela-(\d+)$/);
    if (!match) return 0;
    const candidate = Number.parseInt(match[1], 10) - 1;
    return candidate >= 0 && candidate < slides.length ? candidate : 0;
  };
  const pathFor = (index) => slides[index]?.image;

  function loadNearby(index) {
    [index - 1, index + 1, 1].forEach((candidate) => {
      if (candidate < 0 || candidate >= slides.length) return;
      const preview = new Image();
      preview.src = pathFor(candidate);
    });
  }

  function resetInactivityTimer() {
    if (!AUTO_RESET_SECONDS) return;
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (currentIndex !== 0) navigateTo(0);
      else resetInactivityTimer();
    }, AUTO_RESET_SECONDS * 1000);
  }

  function touchFeedback(event, kind) {
    if (reducedMotion.matches || kind === 'feature') return;
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    stage.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  function setHotspots(page) {
    const fragment = document.createDocumentFragment();
    page.actions.forEach((action) => {
      const control = document.createElement('button');
      control.type = 'button';
      control.className = `hotspot hotspot--${action.kind}`;
      control.setAttribute('aria-label', action.label);
      control.title = action.label;
      control.style.left = `${action.x}%`;
      control.style.top = `${action.y}%`;
      control.style.width = `${action.w}%`;
      control.style.height = `${action.h}%`;
      control.addEventListener('pointerdown', (event) => touchFeedback(event, action.kind), { passive: true });
      control.addEventListener('click', () => navigateTo(action.go));
      fragment.appendChild(control);
    });
    hotspots.replaceChildren(fragment);
  }

  function removeGhost() {
    if (ghost) ghost.remove();
    ghost = null;
    image.classList.remove('motion-enter');
    stage.classList.remove('is-transitioning');
  }

  function animateSlide(nextSrc, direction, switchToken, onComplete) {
    const incoming = new Image();
    let completed = false;
    incoming.onload = () => {
      if (switchToken !== imageSwitch || completed) return;
      completed = true;
      removeGhost();
      const animate = !reducedMotion.matches && image.getAttribute('src') !== nextSrc;
      if (animate) {
        ghost = document.createElement('img');
        ghost.src = image.getAttribute('src');
        ghost.alt = '';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.className = 'slide-image slide-image--ghost';
        stage.insertBefore(ghost, image);
        stage.dataset.direction = direction;
        stage.classList.add('is-transitioning');
      }
      image.src = nextSrc;
      onComplete();
      if (animate) {
        // Reinicia a animação de entrada mesmo após navegações rápidas.
        void image.offsetWidth;
        image.classList.add('motion-enter');
        ghost.classList.add('motion-exit');
        window.setTimeout(() => {
          if (switchToken === imageSwitch) removeGhost();
        }, MOTION_DURATION_MS + 70);
      }
    };
    incoming.onerror = () => {
      if (switchToken !== imageSwitch) return;
      connectionStatus.textContent = 'Não foi possível carregar esta tela. Verifique os arquivos da publicação.';
    };
    incoming.src = nextSrc;
    if (incoming.complete && incoming.naturalWidth) incoming.onload();
  }

  function navigateTo(requestedIndex, options = {}) {
    const index = clamp(requestedIndex);
    const page = slides[index];
    if (!page) return;
    const previousIndex = currentIndex;
    currentIndex = index;
    const switchToken = ++imageSwitch;
    const nextSrc = pathFor(index);
    const alt = `${page.title}. Tela ${page.id} de ${slides.length}.`;

    document.title = `${page.title} | Favela Showcase`;
    document.body.dataset.section = page.section;
    transcript.textContent = `${alt} ${page.transcript || ''}`;

    const newHash = `#tela-${String(index + 1).padStart(2, '0')}`;
    if (location.hash !== newHash) {
      if (options.pushHistory) history.pushState({}, '', newHash);
      else history.replaceState({}, '', newHash);
    }

    if (image.getAttribute('src') !== nextSrc) {
      const isSectionChange = index === 0 || index === 1 || [2, 7, 13].includes(index);
      const direction = isSectionChange ? 'section' : (index >= previousIndex ? 'next' : 'previous');
      animateSlide(nextSrc, direction, switchToken, () => {
        image.alt = alt;
        setHotspots(page);
      });
    } else {
      image.alt = alt;
      setHotspots(page);
    }
    loadNearby(index);
    resetInactivityTimer();
  }

  if (ENABLE_KEYBOARD) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        if (currentIndex !== 1) navigateTo(currentIndex + 1);
        event.preventDefault();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        if (currentIndex > 0 && currentIndex !== 1) navigateTo(currentIndex - 1);
        event.preventDefault();
      } else if (event.key === 'Escape' || event.key === 'Home') {
        navigateTo(1);
        event.preventDefault();
      } else if ((event.key === 'Enter' || event.key === ' ') && currentIndex === 0 && document.activeElement === document.body) {
        navigateTo(1);
        event.preventDefault();
      }
      resetInactivityTimer();
    });
  }

  if (ENABLE_SWIPE) {
    stage.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) return;
      swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    stage.addEventListener('touchend', (event) => {
      if (!swipeStart || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - swipeStart.x;
      const dy = event.changedTouches[0].clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      if (currentIndex === 1) return; // Menu principal: usar os três cards
      event.preventDefault();
      navigateTo(currentIndex + (dx < 0 ? 1 : -1));
    }, { passive: false });
    stage.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
  }

  window.addEventListener('hashchange', () => navigateTo(getHashIndex()));
  window.addEventListener('popstate', () => navigateTo(getHashIndex()));
  ['pointerdown', 'touchstart'].forEach((eventType) => {
    document.addEventListener(eventType, resetInactivityTimer, { passive: true });
  });
  window.addEventListener('offline', () => {
    connectionStatus.textContent = 'Sem internet. O conteúdo salvo pode continuar sendo utilizado.';
  });
  window.addEventListener('online', () => {
    connectionStatus.textContent = 'Conexão com a internet restabelecida.';
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((error) => {
        console.warn('Offline não foi habilitado:', error);
      });
    });
  }
  navigateTo(getHashIndex());
})();
