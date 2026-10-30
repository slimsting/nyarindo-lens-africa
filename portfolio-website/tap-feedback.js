(() => {
  const touchSurface = matchMedia(
    '(hover: none), (pointer: coarse), (any-pointer: coarse)'
  );
  if (!touchSurface.matches) return;

  const interactiveSelector =
    'a, button, summary, [role="button"], input[type="button"], input[type="submit"]';
  let activeTarget = null;
  let clearTimer = 0;

  function interactiveTarget(event) {
    return event.target instanceof Element
      ? event.target.closest(interactiveSelector)
      : null;
  }

  function clearActiveTarget() {
    if (!activeTarget) return;
    activeTarget.classList.remove('tap-feedback-active');
    activeTarget = null;
  }

  document.addEventListener('pointerdown', event => {
    const target = interactiveTarget(event);
    if (!target) return;
    clearTimeout(clearTimer);
    clearActiveTarget();
    activeTarget = target;
    target.classList.add('tap-feedback-active');
  }, { passive: true });

  document.addEventListener('pointerup', () => {
    clearTimer = window.setTimeout(clearActiveTarget, 120);
  }, { passive: true });

  document.addEventListener('pointercancel', clearActiveTarget, { passive: true });

  document.addEventListener('click', event => {
    const target = interactiveTarget(event);
    if (!target) return;
    target.classList.remove('tap-feedback-clicked');
    void target.offsetWidth;
    target.classList.add('tap-feedback-clicked');
    window.setTimeout(() => target.classList.remove('tap-feedback-clicked'), 280);
  });
})();
