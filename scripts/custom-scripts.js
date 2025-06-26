
(function() {
  function init() {

  // === BEFORE/AFTER BILDEKOMPONENTER ===
  const imageComparisons = document.querySelectorAll('.image-comparison');

  imageComparisons.forEach((container) => {
    const figure = container.querySelector('figure');
    const handle = container.querySelector('.handle');
    if (!figure) return;

    const labelStart = container.querySelector('.label-start');
    const labelResult = container.querySelector('.label-result');

    function setComparisonPosition(clientX) {
      const rect = figure.getBoundingClientRect();
      let percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      container.style.setProperty('--position', `${percent}%`);
      if (handle) handle.style.left = `${percent}%`;

      if (labelStart) {
        labelStart.style.opacity = percent < 10 ? '0' : '1';
        labelStart.style.transition = 'opacity 0.2s ease';
      }
      if (labelResult) {
        labelResult.style.opacity = percent > 90 ? '0' : '1';
        labelResult.style.transition = 'opacity 0.2s ease';
      }
    }

    let isComparisonDragging = false;

    const onComparisonMove = (e) => {
      if (!isComparisonDragging) return;
      setComparisonPosition(e.clientX);
    };

    const endComparisonDrag = () => {
      isComparisonDragging = false;
      window.removeEventListener('pointermove', onComparisonMove);
      window.removeEventListener('pointerup', endComparisonDrag);
    };

    container.addEventListener('pointerdown', (e) => {
      isComparisonDragging = true;
      setComparisonPosition(e.clientX);
      window.addEventListener('pointermove', onComparisonMove);
      window.addEventListener('pointerup', endComparisonDrag);
    });

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        setComparisonPosition(e.touches[0].clientX);
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        setComparisonPosition(e.touches[0].clientX);
      }
    }, { passive: true });
  });

  // === TESTIMONIAL SLIDER ===
  const slider = document.querySelector(".testimonial-scroll");
  const leftBtn = document.querySelector(".testimonial-slider-arrow.left");
  const rightBtn = document.querySelector(".testimonial-slider-arrow.right");

  if (slider && leftBtn && rightBtn) {
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
      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

      leftBtn.style.display = slider.scrollLeft <= 1 ? "none" : "block";
      rightBtn.style.display = slider.scrollLeft >= maxScrollLeft - 1 ? "none" : "block";
    };

    // Piler
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

    // Dra med mus
    let isSliderDragging = false;
    let startX;
    let scrollStart;

    const disableSnap = () => {
      slider.style.scrollSnapType = "none";
    };

    const enableSnap = () => {
      slider.style.scrollSnapType = "x mandatory";
    };

    slider.addEventListener("mousedown", (e) => {
      isSliderDragging = true;
      slider.classList.add("dragging");
      disableSnap();
      startX = e.pageX - slider.offsetLeft;
      scrollStart = slider.scrollLeft;
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isSliderDragging) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.2;
      slider.scrollLeft = scrollStart - walk;
    });

    const endSliderDrag = () => {
      if (!isSliderDragging) return;
      isSliderDragging = false;
      slider.classList.remove("dragging");
      enableSnap();
      const { currentIndex } = getSnapInfo();
      scrollToIndex(currentIndex);
    };

    slider.addEventListener("mouseup", endSliderDrag);
    slider.addEventListener("mouseleave", endSliderDrag);

    // Init
    updateArrowVisibility();
  }

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init(); // DOM er allerede lastet
  }
})();
