(function () {
  const dragThreshold = 5;
  let isDragging = false;

  // ——— 1. BEFORE/AFTER-bildekomponent ———
  function enableImageComparisons() {
    document.querySelectorAll('.image-comparison').forEach(container => {
      const figure = container.querySelector('figure');
      const handle = container.querySelector('.handle');
      const labelStart = container.querySelector('.label-start');
      const labelResult = container.querySelector('.label-result');
      if (!figure) return;

      function setPosition(clientX) {
        const rect = figure.getBoundingClientRect();
        let percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        container.style.setProperty('--position', percent + '%');
        if (handle) handle.style.left = percent + '%';
        if (labelStart) labelStart.style.opacity = percent < 10 ? '0' : '1';
        if (labelResult) labelResult.style.opacity = percent > 90 ? '0' : '1';
      }

      let active = false;
      const onMove = e => active && setPosition(e.clientX);
      const end = () => {
        active = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', end);
      };

      container.addEventListener('pointerdown', e => {
        active = true;
        setPosition(e.clientX);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', end);
      });

      container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) setPosition(e.touches[0].clientX);
      }, { passive: true });

      container.addEventListener('touchmove', e => {
        if (e.touches.length === 1) setPosition(e.touches[0].clientX);
      }, { passive: true });
    });
  }

  // ——— 2. Horisontal slider-funksjon (felles for testimonial og modal-kort) ———
 function setupSlider(container, scrollSelector, leftSelector, rightSelector) {
  if (!container) return;

  const scrollContainer = container.querySelector(scrollSelector);
  const leftBtn = container.querySelector(leftSelector);
  const rightBtn = container.querySelector(rightSelector);
  if (!scrollContainer || !leftBtn || !rightBtn) return;

  const updateArrows = () => {
    const cards = scrollContainer.querySelectorAll('article');
    let totalWidth = 0;
    for (let i = 0; i < cards.length; i++) {
      totalWidth += cards[i].offsetWidth;
    }
    totalWidth += (cards.length - 1) * 24;

    const visibleWidth = scrollContainer.clientWidth;
    const scrollLeft = scrollContainer.scrollLeft;
    const maxScrollLeft = scrollContainer.scrollWidth - visibleWidth;
    const show = totalWidth > visibleWidth;

    leftBtn.style.display = (show && scrollLeft > 1) ? 'flex' : 'none';
    rightBtn.style.display = (show && scrollLeft < maxScrollLeft - 1) ? 'flex' : 'none';
  };

  const scrollByCard = direction => {
    const card = scrollContainer.querySelector('article');
    const cardWidth = card ? card.offsetWidth + 24 : 320;
    scrollContainer.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftBtn.addEventListener('click', () => scrollByCard(-1));
  rightBtn.addEventListener('click', () => scrollByCard(1));
  scrollContainer.addEventListener('scroll', () => requestAnimationFrame(updateArrows));

  let startX = 0, scrollStart = 0;
  scrollContainer.addEventListener('mousedown', e => {
    isDragging = true;
    scrollContainer.classList.add('dragging');
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollStart = scrollContainer.scrollLeft;
  });

  scrollContainer.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const x = e.pageX - scrollContainer.offsetLeft;
    scrollContainer.scrollLeft = scrollStart - (x - startX);
  });

  ['mouseup', 'mouseleave'].forEach(eventName => {
    scrollContainer.addEventListener(eventName, () => {
      isDragging = false;
      scrollContainer.classList.remove('dragging');
    });
  });

  updateArrows();
}

  // ——— 3. Modal-funksjon for alle section--modal-cards ———
  function enableModalCards() {
    const scrollContainers = document.querySelectorAll('.modal-cards-scroll');
    const originalContainer = document.querySelector('.acceleroot-modal');
    if (!scrollContainers.length || !originalContainer) return;

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('tabindex', '-1');
    document.body.appendChild(overlay);

    let lastFocused = null;

    const trapFocus = el => {
      const focusable = el.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      el.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      });
    };

    const openModal = blockId => {
      const section = originalContainer.querySelector(`section[data-block-id="${blockId}"]`);
      if (!section) return;

      lastFocused = document.activeElement;

      const modalInner = document.createElement('div');
      modalInner.className = 'modal-inner';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close-btn';
      closeBtn.setAttribute('aria-label', 'Lukk');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', closeModal);

      modalInner.appendChild(closeBtn);
      modalInner.appendChild(section);

      overlay.innerHTML = '';
      overlay.appendChild(modalInner);
      overlay.classList.add('active');

      section.style.display = 'block';
      section.setAttribute('tabindex', '-1');
      section.focus();
      trapFocus(modalInner);
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      const section = overlay.querySelector('section[data-block-id]');
      if (section) {
        originalContainer.appendChild(section);
        section.style.display = 'none';
      }
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    };

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    scrollContainers.forEach(scrollContainer => {
      const articles = scrollContainer.querySelectorAll('article.has-modal');
      articles.forEach(article => {
        let clickStart = { x: 0, y: 0 };

        article.addEventListener('mousedown', e => {
          clickStart = { x: e.clientX, y: e.clientY };
        });

        article.addEventListener('click', e => {
          if (isDragging) return;
          const dist = Math.hypot(e.clientX - clickStart.x, e.clientY - clickStart.y);
          if (dist > dragThreshold) return;
          openModal(article.id);
        });
      });
    });
  }

  // ——— 4. Init ———
function initAll() {
  enableImageComparisons();

  // Init testimonial-slider (bare én)
  setupSlider(
    document.querySelector('.testimonial-slider'),
    '.testimonial-scroll',
    '.testimonial-slider-arrow.left',
    '.testimonial-slider-arrow.right'
  );

  // Init alle modal-cards-slidere (flere)
  document.querySelectorAll('.modal-cards-slider').forEach(slider => {
    setupSlider(slider, '.modal-cards-scroll', '.modal-cards-slider-arrow.left', '.modal-cards-slider-arrow.right');
  });

  enableModalCards();
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();