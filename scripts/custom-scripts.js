/* Before / After comparesion */

(function() {
  const container = document.querySelector('.image-comparison');
  if (!container) return;

  const figure = container.querySelector('figure');
  const handle = container.querySelector('.handle');

  function setPosition(clientX) {
    const rect = figure.getBoundingClientRect();
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent)); // clamp 0–100%
    container.style.setProperty('--position', `${percent}%`);
    if (handle) handle.style.left = `${percent}%`;

    const labelStart = container.querySelector('.label-start');
    const labelResult = container.querySelector('.label-result');
    if (labelStart && labelResult) {
      labelStart.style.opacity = (percent < 10) ? '0' : '1';
      labelStart.style.transition = 'opacity 0.2s ease';
      labelResult.style.opacity = (percent > 90) ? '0' : '1';
      labelResult.style.transition = 'opacity 0.2s ease';
    }
  }

  let isDragging = false;

  function onPointerMove(e) {
    if (!isDragging) return;
    setPosition(e.clientX);
  }

  function onPointerUp() {
    isDragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  function onPointerDown(e) {
    isDragging = true;
    setPosition(e.clientX);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  container.addEventListener('pointerdown', onPointerDown);

  // iOS touch fallback (for eldre enheter)
  container.addEventListener('touchstart', e => {
    if (e.touches.length === 1) setPosition(e.touches[0].clientX);
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (e.touches.length === 1) setPosition(e.touches[0].clientX);
  }, { passive: true });
})();

/* Testimonial slider */

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".testimonial-scroll");
  const leftBtn = document.querySelector(".testimonial-slider-arrow.left");
  const rightBtn = document.querySelector(".testimonial-slider-arrow.right");

  if (!slider || !leftBtn || !rightBtn) return;

  // === SNAP & POSISJONS-LOGIKK ===
  const getSnapInfo = () => {
    const children = Array.from(slider.children);
    const scrollLeft = slider.scrollLeft;
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const distance = Math.abs(child.offsetLeft - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return {
      children,
      currentIndex: closestIndex,
      maxIndex: children.length - 1
    };
  };

  const scrollToIndex = (index) => {
    const { children } = getSnapInfo();
    const target = children[index];
    if (target) {
      slider.scrollTo({
        left: target.offsetLeft,
        behavior: "smooth"
      });
    }
  };

  const updateArrowVisibility = () => {
    const { currentIndex, maxIndex } = getSnapInfo();
    leftBtn.style.display = currentIndex === 0 ? "none" : "block";
    rightBtn.style.display = currentIndex === maxIndex ? "none" : "block";
  };

  // === PIL-KLIKK ===
  leftBtn.addEventListener("click", () => {
    const { currentIndex } = getSnapInfo();
    if (currentIndex > 0) scrollToIndex(currentIndex - 1);
  });

  rightBtn.addEventListener("click", () => {
    const { currentIndex, maxIndex } = getSnapInfo();
    if (currentIndex < maxIndex) scrollToIndex(currentIndex + 1);
  });

  slider.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateArrowVisibility);
  });

  // === MUS-DRA-LOGIKK ===
  let isDragging = false;
  let startX;
  let scrollStart;

  const disableSnap = () => {
    slider.style.scrollSnapType = "none";
  };

  const enableSnap = () => {
    slider.style.scrollSnapType = "x mandatory";
  };

  slider.addEventListener("mousedown", (e) => {
    isDragging = true;
    slider.classList.add("dragging");
    disableSnap();
    startX = e.pageX - slider.offsetLeft;
    scrollStart = slider.scrollLeft;
  });

  slider.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.2; // Juster hastighet her
    slider.scrollLeft = scrollStart - walk;
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove("dragging");
    enableSnap();
    const { currentIndex } = getSnapInfo();
    scrollToIndex(currentIndex);
  };

  slider.addEventListener("mouseup", endDrag);
  slider.addEventListener("mouseleave", endDrag);

  // === INIT ===
  updateArrowVisibility();
});