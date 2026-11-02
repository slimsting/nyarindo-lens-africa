(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const marks = [...document.querySelectorAll(".brand-mark")];
  if (!marks.length) return;

  const sourcePaths = [
    "/portfolio-website/assets/avatar-smile.webp?v=avatar-motion-3",
    "/portfolio-website/assets/avatar-laugh.webp?v=avatar-motion-3",
    "/portfolio-website/assets/avatar-wave.webp?v=avatar-motion-3",
    "/portfolio-website/assets/avatar-peek.webp?v=avatar-motion-3",
    "/portfolio-website/assets/avatar-lookaway.webp?v=avatar-motion-3",
  ];

  const frames = [
    { image: 0, focusX: 0.5, focusY: 0.5, zoom: 1.02, dx: 0, dy: 0, rotate: -1.2 },
    { image: 1, focusX: 0.5, focusY: 0.5, zoom: 1.03, dx: 0.02, dy: 0, rotate: 1.5 },
    { image: 4, focusX: 0.5, focusY: 0.5, zoom: 1.08, dx: 0.08, dy: -0.02, rotate: -2.5 },
    { image: 3, focusX: 0.5, focusY: 0.5, zoom: 1.12, dx: -0.16, dy: 0.01, rotate: -5 },
    { image: 2, focusX: 0.5, focusY: 0.5, zoom: 1.08, dx: 0.04, dy: 0.02, rotate: 2, wave: true },
    { image: 0, focusX: 0.42, focusY: 0.5, zoom: 1.16, dx: -0.06, dy: 0, rotate: 1 },
  ];

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = path;
    });
  }

  function drawFrame(context, size, images, frame, alpha = 1) {
    if (!frame || !Number.isFinite(size) || !images[frame.image]) return;
    const image = images[frame.image];
    if (!image) return;
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const scale = baseScale * frame.zoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const x = size / 2 - frame.focusX * drawWidth + frame.dx * size;
    const y = size / 2 - frame.focusY * drawHeight + frame.dy * size;

    context.save();
    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
    context.translate(size / 2, size / 2);
    context.rotate(frame.rotate * Math.PI / 180);
    context.translate(-size / 2, -size / 2);
    context.drawImage(image, x, y, drawWidth, drawHeight);
    context.restore();

    if (frame.wave) {
      context.save();
      context.globalAlpha = alpha;
      context.font = `${Math.max(15, size * 0.42)}px "Segoe UI Emoji", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.translate(size * 0.24, size * 0.73);
      context.rotate((17 - Math.sin(performance.now() / 180) * 12) * Math.PI / 180);
      context.fillText("👋", 0, 0);
      context.restore();
    }
  }

  Promise.all(sourcePaths.map(loadImage)).then(images => {
    for (const mark of marks) {
      const canvas = document.createElement("canvas");
      canvas.className = "brand-avatar-canvas";
      canvas.setAttribute("aria-hidden", "true");
      mark.append(canvas);
      const context = canvas.getContext("2d");
      if (!context) continue;

      let size = 0;
      let lastPaint = 0;
      const resize = () => {
        const rect = mark.getBoundingClientRect();
        size = Math.max(1, Math.round(Math.min(rect.width, rect.height)));
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(size * ratio);
        canvas.height = Math.round(size * ratio);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      };
      new ResizeObserver(resize).observe(mark);
      resize();
      mark.classList.add("brand-avatar-live");

      const frameDuration = 3000;
      const transitionDuration = 520;
      const start = performance.now();

      const animate = now => {
        if (document.hidden) {
          requestAnimationFrame(animate);
          return;
        }
        if (now - lastPaint < 42) {
          requestAnimationFrame(animate);
          return;
        }
        lastPaint = now;
        const elapsed = now - start;
        const rawIndex = Number.isFinite(elapsed) ? Math.floor(elapsed / frameDuration) : 0;
        const index = ((rawIndex % frames.length) + frames.length) % frames.length;
        const next = (index + 1) % frames.length;
        const local = elapsed % frameDuration;
        const blend = local > frameDuration - transitionDuration
          ? (local - (frameDuration - transitionDuration)) / transitionDuration
          : 0;
        const bob = Math.sin(elapsed / 800) * 0.35;
        context.clearRect(0, 0, size, size);
        context.save();
        context.translate(0, bob);
        drawFrame(context, size, images, frames[index], 1);
        if (blend > 0) {
          drawFrame(context, size, images, frames[next], blend);
        }
        context.restore();
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }).catch(() => {
    document.documentElement.classList.add("avatar-motion-fallback");
  });
})();
