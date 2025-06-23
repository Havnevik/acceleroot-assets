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