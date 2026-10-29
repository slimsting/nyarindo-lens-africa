const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
let themeTimer;

function applyTheme(theme, animate = true) {
  const isLight = theme === 'light';
  if (animate && !reducedMotion) {
    root.classList.add('theme-transition');
    clearTimeout(themeTimer);
    themeTimer = setTimeout(() => root.classList.remove('theme-transition'), 1200);
  }
  root.dataset.theme = isLight ? 'light' : 'dark';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  themeToggle.querySelector('.theme-icon').textContent = isLight ? '☾' : '☼';
  themeToggle.querySelector('.theme-label').textContent = isLight ? 'DAY' : 'NIGHT';
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#eeeae0' : '#10110f';
  try { localStorage.setItem('nyarindo-theme', isLight ? 'light' : 'dark'); } catch {}
}

themeToggle.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
});
applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark', false);

let previousScrollY = window.scrollY;
let scrollLightTimer;
window.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  if (currentY < previousScrollY - 1) {
    document.body.classList.add('is-scrolling-up');
    clearTimeout(scrollLightTimer);
    scrollLightTimer = setTimeout(() => document.body.classList.remove('is-scrolling-up'), 650);
  } else if (currentY > previousScrollY + 1) {
    document.body.classList.remove('is-scrolling-up');
  }
  previousScrollY = currentY;
}, { passive: true });

function makeField(canvas, closing = false) {
  const ctx = canvas.getContext('2d');
  const pointer = { x: -1000, y: -1000 };
  let width = 0;
  let height = 0;
  let frame = 0;
  const count = closing ? 58 : 84;
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * .45;
    return {
      x: .5 + Math.cos(angle) * radius,
      y: .5 + Math.sin(angle) * radius,
      phase: Math.random() * Math.PI * 2,
      speed: .00018 + Math.random() * .00025,
      size: i % 8 === 0 ? 1.8 : 1.05
    };
  });

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint(0);
  }

  function paint(time) {
    ctx.clearRect(0, 0, width, height);
    const lightTheme = document.documentElement.dataset.theme === 'light';
    const scale = Math.min(width, height) * (closing ? .96 : .92);
    const points = nodes.map(node => {
      const drift = reducedMotion ? 0 : Math.sin(time * node.speed + node.phase) * 5;
      return {
        x: width * node.x + drift,
        y: height * node.y + Math.cos(time * node.speed + node.phase) * 5,
        size: node.size
      };
    });
    const linkRange = closing ? 82 : 92;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance < linkRange) {
          const alpha = (1 - distance / linkRange) * (closing ? .16 : .24);
          ctx.strokeStyle = `rgba(${lightTheme ? '74, 98, 73' : '164, 183, 153'}, ${alpha})`;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    points.forEach((point, i) => {
      const dx = pointer.x - point.x;
      const dy = pointer.y - point.y;
      const near = Math.hypot(dx, dy) < 115;
      ctx.beginPath();
      ctx.arc(point.x, point.y, near || i % 8 === 0 ? point.size + .7 : point.size, 0, Math.PI * 2);
      ctx.fillStyle = i % 9 === 0
        ? (lightTheme ? 'rgba(153,100,49,.84)' : 'rgba(210,163,109,.84)')
        : (lightTheme ? 'rgba(74,98,73,.68)' : 'rgba(183,197,170,.61)');
      ctx.fill();
      if (near) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = lightTheme ? 'rgba(153,100,49,.1)' : 'rgba(210,163,109,.09)';
        ctx.fill();
      }
    });

    if (!reducedMotion) frame = requestAnimationFrame(paint);
  }

  canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    if (reducedMotion) paint(0);
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.x = -1000;
    pointer.y = -1000;
    if (reducedMotion) paint(0);
  });

  new ResizeObserver(resize).observe(canvas);
  if (!reducedMotion) frame = requestAnimationFrame(paint);
  else resize();
  return () => cancelAnimationFrame(frame);
}

const cleanups = [
  makeField(document.getElementById('field')),
  makeField(document.getElementById('closingCanvas'), true)
];
window.addEventListener('pagehide', () => cleanups.forEach(stop => stop()), { once: true });
