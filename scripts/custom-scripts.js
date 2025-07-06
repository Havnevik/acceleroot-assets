(function () {
  const dragThreshold = 5;
  let isDragging = false;

  // 1. BEFORE/AFTER-bildekomponent
  function enableImageComparisons() {
    var containers = document.querySelectorAll('.image-comparison');
    Array.prototype.forEach.call(containers, function (container) {
      var figure = container.querySelector('figure');
      var handle = container.querySelector('.handle');
      var labelStart = container.querySelector('.label-start');
      var labelResult = container.querySelector('.label-result');
      if (!figure) return;

      function setPosition(clientX) {
        var rect = figure.getBoundingClientRect();
        var percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        container.style.setProperty('--position', percent + '%');
        if (handle) handle.style.left = percent + '%';
        if (labelStart) labelStart.style.opacity = percent < 10 ? '0' : '1';
        if (labelResult) labelResult.style.opacity = percent > 90 ? '0' : '1';
      }

      var active = false;
      var onMove = function (e) {
        if (active) setPosition(e.clientX);
      };
      var end = function () {
        active = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', end);
      };

      container.addEventListener('pointerdown', function (e) {
        active = true;
        setPosition(e.clientX);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', end);
      });

      container.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) setPosition(e.touches[0].clientX);
      }, { passive: true });

      container.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1) setPosition(e.touches[0].clientX);
      }, { passive: true });
    });
  }

  // 2. Slider
  function setupSlider(container, scrollSelector, leftSelector, rightSelector) {
    if (!container) return;

    var scrollContainer = container.querySelector(scrollSelector);
    var leftBtn = container.querySelector(leftSelector);
    var rightBtn = container.querySelector(rightSelector);
    if (!scrollContainer || !leftBtn || !rightBtn) return;

    function updateArrows() {
      var cards = scrollContainer.querySelectorAll('article');
      var totalWidth = 0;
      Array.prototype.forEach.call(cards, function (card) {
        totalWidth += card.offsetWidth + 24;
      });
      var visibleWidth = scrollContainer.clientWidth;
      var scrollLeft = scrollContainer.scrollLeft;
      var maxScrollLeft = scrollContainer.scrollWidth - visibleWidth;
      var show = totalWidth > visibleWidth;

      leftBtn.style.display = (show && scrollLeft > 1) ? 'flex' : 'none';
      rightBtn.style.display = (show && scrollLeft < maxScrollLeft - 1) ? 'flex' : 'none';
    }

    function scrollByCard(direction) {
      var card = scrollContainer.querySelector('article');
      var cardWidth = card ? card.offsetWidth + 24 : 320;
      scrollContainer.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    }

    leftBtn.addEventListener('click', function () { scrollByCard(-1); });
    rightBtn.addEventListener('click', function () { scrollByCard(1); });
    scrollContainer.addEventListener('scroll', function () { requestAnimationFrame(updateArrows); });

    var startX = 0, scrollStart = 0;
    scrollContainer.addEventListener('mousedown', function (e) {
      isDragging = true;
      scrollContainer.classList.add('dragging');
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollStart = scrollContainer.scrollLeft;
    });

    scrollContainer.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var x = e.pageX - scrollContainer.offsetLeft;
      scrollContainer.scrollLeft = scrollStart - (x - startX);
    });

    ['mouseup', 'mouseleave'].forEach(function (eventName) {
      scrollContainer.addEventListener(eventName, function () {
        isDragging = false;
        scrollContainer.classList.remove('dragging');
      });
    });

    updateArrows();
  }

  // 3. Modal Cards
  function enableModalCards() {
    var scrollContainers = document.querySelectorAll('.modal-cards-scroll');
    if (!scrollContainers.length) return;

    var overlay = document.getElementById('modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('tabindex', '-1');
      document.body.appendChild(overlay);
    }

    var lastFocused = null;

    function trapFocus(el) {
      var focusable = el.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      });
    }

    function openModal(blockId, sectionId) {
      var originalContainer = document.querySelector('.acceleroot-modal[data-section-id="' + sectionId + '"]');
      var section = originalContainer ? originalContainer.querySelector('section[data-block-id="' + blockId + '"]') : null;
      if (!section) return;

      section.setAttribute('data-original-section-id', sectionId);
      lastFocused = document.activeElement;

      var modalInner = document.createElement('div');
      modalInner.className = 'modal-inner';

      var closeBtn = document.createElement('button');
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
    }

    function closeModal() {
      var section = overlay.querySelector('section[data-block-id]');
      if (section) {
        var sectionId = section.getAttribute('data-original-section-id');
        var originalContainer = document.querySelector('.acceleroot-modal[data-section-id="' + sectionId + '"]');
        if (originalContainer) {
          originalContainer.appendChild(section);
          section.style.display = 'none';
        }
      }
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    Array.prototype.forEach.call(scrollContainers, function (scrollContainer) {
      var parentSection = scrollContainer.closest('.section--modal-cards');
      var sectionId = parentSection ? parentSection.id : null;
      if (!sectionId) return;

      var articles = scrollContainer.querySelectorAll('article.has-modal');
      Array.prototype.forEach.call(articles, function (article) {
        var clickStart = { x: 0, y: 0 };

        article.addEventListener('mousedown', function (e) {
          clickStart = { x: e.clientX, y: e.clientY };
        });

        article.addEventListener('click', function (e) {
          if (isDragging) return;
          var dist = Math.hypot(e.clientX - clickStart.x, e.clientY - clickStart.y);
          if (dist > dragThreshold) return;
          openModal(article.id, sectionId);
        });
      });
    });
  }

  // 4. Toggle-bokser
  function initToggleBoxes(selector) {
    selector = selector || '.ar-toggle-box';
    var boxes = document.querySelectorAll(selector);

    Array.prototype.forEach.call(boxes, function (box) {
      var button = box.querySelector('.ar-toggle-button');
      var content = box.querySelector('.ar-toggle-content');
      if (!button || !content) return;
      if (button.dataset.listenerAttached === 'true') return;

      button.addEventListener('click', function () {
        var isOpen = button.getAttribute('aria-expanded') === 'true';
        var newState = !isOpen;
        var previewMode = box.classList.contains('preview-mode');

        button.setAttribute('aria-expanded', String(newState));
        box.setAttribute('aria-expanded', String(newState));
        box.classList.toggle('is-open', newState);
        content.hidden = !newState && !previewMode;
      });

      button.dataset.listenerAttached = 'true';

      var isOpenInitially = box.classList.contains('is-open');
      var previewMode = box.classList.contains('preview-mode');
      if (!isOpenInitially && !previewMode) content.hidden = true;
    });
  }

  // 5. Init
  function initAll() {
    enableImageComparisons();
    enableModalCards();
    initToggleBoxes();

    setupSlider(
      document.querySelector('.testimonial-slider'),
      '.testimonial-scroll',
      '.testimonial-slider-arrow.left',
      '.testimonial-slider-arrow.right'
    );

    var sliders = document.querySelectorAll('.modal-cards-slider');
    Array.prototype.forEach.call(sliders, function (slider) {
      setupSlider(slider, '.modal-cards-scroll', '.modal-cards-slider-arrow.left', '.modal-cards-slider-arrow.right');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // 6. Shopify Editor Events
  document.addEventListener('shopify:section:load', initAll);
  document.addEventListener('shopify:section:select', initAll);
})();