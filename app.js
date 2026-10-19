/*
 * Favela • Interactive Showcase
 * Apresentação sem dependências externas, pronta para Netlify e iPad.
 * Os hotspots de cada tela podem ser editados no arquivo slides.js.
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

  // Configurações: 180 segundos sem interação levam de volta à abertura.
  // Ajuste para 0 se não quiser retorno automático.
  const AUTO_RESET_SECONDS = 180;
  const ENABLE_SWIPE = true;
  const ENABLE_KEYBOARD = true;
  let currentIndex = 0;
  let idleTimer = null;
  let imageSwitch = 0;
  let swipeStart = null;

  const clamp = (value) => Math.min(slides.length - 1, Math.max(0, value));
  const getHashIndex = () => {
    const match = location.hash.match(/^#tela-(\d+)$/);
    if (!match) return 0;
    const candidate = Number.parseInt(match[1], 10) - 1;
    return candidate >= 0 && candidate < slides.length ? candidate : 0;
  };
  const pathFor = (index) => slides[index]?.image;

  function loadNearby(index) {
    const nextIndices = [index - 1, index + 1, 1];
    nextIndices.forEach((candidate) => {
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
      control.addEventListener('click', () => navigateTo(action.go));
      fragment.appendChild(control);
    });
    hotspots.replaceChildren(fragment);
  }

  function navigateTo(requestedIndex, options = {}) {
    const index = clamp(requestedIndex);
    const page = slides[index];
    if (!page) return;
    currentIndex = index;
    imageSwitch += 1;
    const thisSwitch = imageSwitch;

    const nextSrc = pathFor(index);
    const alt = `${page.title}. Tela ${page.id} de ${slides.length}.`;
    image.alt = alt;
    document.title = `${page.title} | Favela Showcase`;
    document.body.dataset.section = page.section;
    transcript.textContent = `${alt} ${page.transcript || ''}`;
    setHotspots(page);

    // Usa #tela-01 para permitir compartilhar ou recuperar a tela atual.
    const newHash = `#tela-${String(index + 1).padStart(2, '0')}`;
    if (location.hash !== newHash) {
      if (options.pushHistory) history.pushState({}, '', newHash);
      else history.replaceState({}, '', newHash);
    }

    if (image.getAttribute('src') !== nextSrc) {
      image.classList.add('is-changing');
      const loader = new Image();
      loader.onload = () => {
        if (thisSwitch !== imageSwitch) return;
        image.src = nextSrc;
        requestAnimationFrame(() => image.classList.remove('is-changing'));
      };
      loader.onerror = () => {
        if (thisSwitch !== imageSwitch) return;
        image.src = nextSrc;
        image.classList.remove('is-changing');
        connectionStatus.textContent = 'Não foi possível carregar esta tela. Verifique os arquivos da publicação.';
      };
      loader.src = nextSrc;
    }
    loadNearby(index);
    resetInactivityTimer();
  }

  if (ENABLE_KEYBOARD) {
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      if (key === 'ArrowRight' || key === 'PageDown') {
        if (currentIndex !== 1) navigateTo(currentIndex + 1);
        event.preventDefault();
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        if (currentIndex > 0 && currentIndex !== 1) navigateTo(currentIndex - 1);
        event.preventDefault();
      } else if (key === 'Escape' || key === 'Home') {
        navigateTo(1);
        event.preventDefault();
      } else if ((key === 'Enter' || key === ' ') && currentIndex === 0 && document.activeElement === document.body) {
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
      if (currentIndex === 1) return; // menu: navegue pelos cards
      event.preventDefault();
      navigateTo(currentIndex + (dx < 0 ? 1 : -1));
    }, { passive: false });
    stage.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
  }

  // Volta à tela inicial ao acessar um novo link de fragmento / usar botões do navegador.
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
