const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeSwatches = [...document.querySelectorAll('[data-palette]')];

const paletteColors = {
  forest: { dark: '#10110f', light: '#eeeae0' },
  ocean: { dark: '#07151c', light: '#e8f0f1' },
  amethyst: { dark: '#130f1b', light: '#f0eaf4' },
  ember: { dark: '#180e0b', light: '#f5ebe3' },
  rose: { dark: '#190f14', light: '#f7eaf0' },
  slate: { dark: '#0e1418', light: '#e9eef0' }
};

function updateThemeColor() {
  const palette = paletteColors[root.dataset.palette] || paletteColors.forest;
  document.querySelector('meta[name="theme-color"]').content =
    root.dataset.theme === 'light' ? palette.light : palette.dark;
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  root.dataset.theme = isLight ? 'light' : 'dark';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  themeToggle.querySelector('.theme-icon').textContent = isLight ? '☾' : '☼';
  themeToggle.querySelector('.theme-label').textContent = isLight ? 'DAY' : 'NIGHT';
  updateThemeColor();
  try { localStorage.setItem('nyarindo-theme', isLight ? 'light' : 'dark'); } catch {}
}

function applyPalette(palette, persist = true) {
  if (!paletteColors[palette]) palette = 'forest';
  root.dataset.palette = palette;
  themeSwatches.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.palette === palette));
  });
  updateThemeColor();
  if (persist) {
    try { localStorage.setItem('nyarindo-palette', palette); } catch {}
  }
}

themeToggle.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
});
themeSwatches.forEach(button => {
  button.addEventListener('click', () => applyPalette(button.dataset.palette));
});
applyPalette(root.dataset.palette || 'forest', false);
applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');

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

const revealSelectors = [
  '.section-heading > *',
  '.project-index',
  '.project-main',
  '.project-visual',
  '.approach-art',
  '.approach-copy > *',
  '.closing > .eyebrow',
  '.closing h2',
  '.closing-copy',
  '.contact-actions',
  '.playem-copy > *',
  '.playem-portrait',
  '.books-heading > *',
  '.books-attention',
  '.book-spiral',
  '.book-collection-cover',
  '.book-actions',
  '.hat-card',
  '.both-hats-lede',
  '.both-hats-meeting',
  '.both-hats-cta',
  '.coherence-theory .eyebrow',
  '.coherence-theory h2',
  '.coherence-lede',
  '.coherence-arc article',
  '.working-definitions',
  '.coherence-theory-cta',
  '.social-footer-head',
  '.social-links'
];

if (!reducedMotion && 'IntersectionObserver' in window) {
  root.classList.add('motion-enabled');
  const revealTargets = [...new Set(
    revealSelectors.flatMap(selector => [...document.querySelectorAll(selector)])
  )];
  revealTargets.forEach((element, index) => {
    element.dataset.motionReveal = '';
    const staggerParent = element.parentElement?.matches(
      '.section-heading, .books-heading, .approach-copy, .playem-copy, .contact-actions, .hat-pair, .coherence-arc, .theory-offerings'
    );
    if (staggerParent) {
      const siblings = [...element.parentElement.children]
        .filter(child => child.hasAttribute('data-motion-reveal'));
      const siblingIndex = Math.max(0, siblings.indexOf(element));
      element.style.setProperty(
        '--motion-delay',
        `${Math.min(siblingIndex, 5) * 85}ms`
      );
    }
  });

  const motionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.motionInview = '';
      motionObserver.unobserve(entry.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -10%' });
  revealTargets.forEach(element => motionObserver.observe(element));
}

const signoffDetails = document.querySelector('.ucp-details');
signoffDetails?.addEventListener('toggle', () => {
  if (!signoffDetails.open) return;
  requestAnimationFrame(() => {
    document.querySelector('.ucp-copy')?.scrollIntoView({
      block: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  });
});

function makeField(canvas, closing = false) {
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const pointer = { x: -1000, y: -1000 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastPaintTime = 0;
  let visible = false;
  let links = [];
  const count = closing ? 38 : 52;
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * .45;
    return {
      x: .5 + Math.cos(angle) * radius,
      y: .5 + Math.sin(angle) * radius,
      phase: Math.random() * Math.PI * 2,
      speed: .00018 + Math.random() * .00025,
      firePhase: Math.random() * Math.PI * 2,
      fireSpeed: .0011 + Math.random() * .0013,
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
    buildLinks();
    if (reducedMotion) paint(0);
    else schedule();
  }

  function buildLinks() {
    links = [];
    const linkRange = closing ? 82 : 92;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = (nodes[i].x - nodes[j].x) * width;
        const dy = (nodes[i].y - nodes[j].y) * height;
        const distance = Math.hypot(dx, dy);
        if (distance < linkRange) links.push({ i, j, distance, linkRange });
      }
    }
  }

  function schedule() {
    if (reducedMotion || !visible || document.hidden || frame) return;
    frame = requestAnimationFrame(paint);
  }

  function paint(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (!reducedMotion && time > 0 && time - lastPaintTime < 32) {
      schedule();
      return;
    }
    lastPaintTime = time;
    ctx.clearRect(0, 0, width, height);
    const lightTheme = document.documentElement.dataset.theme === 'light';
    const points = nodes.map(node => {
      const drift = reducedMotion ? 0 : Math.sin(time * node.speed + node.phase) * 5;
      const activation = closing || reducedMotion
        ? 0
        : Math.pow(Math.max(0, Math.sin(time * node.fireSpeed + node.firePhase)), 16);
      return {
        x: width * node.x + drift,
        y: height * node.y + Math.cos(time * node.speed + node.phase) * 5,
        size: node.size,
        activation
      };
    });

    links.forEach(({ i, j, distance, linkRange }) => {
      const alpha = (1 - distance / linkRange) * (closing ? .16 : .24);
      ctx.strokeStyle = closing
        ? `rgba(${lightTheme ? '74, 98, 73' : '164, 183, 153'}, ${alpha})`
        : `rgba(${lightTheme ? '14, 92, 57' : '73, 214, 139'}, ${Math.min(.46, alpha * 1.8)})`;
      ctx.lineWidth = closing ? .65 : .72;
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[j].x, points[j].y);
      ctx.stroke();

      if (!closing && !reducedMotion && (i * 31 + j * 13) % 29 === 0) {
        const progress = (time * .00024 + ((i * 17 + j * 29) % 100) / 100) % 1;
        const x = points[i].x + (points[j].x - points[i].x) * progress;
        const y = points[i].y + (points[j].y - points[i].y) * progress;
        ctx.beginPath();
        ctx.arc(x, y, 4.8, 0, Math.PI * 2);
        ctx.fillStyle = lightTheme ? 'rgba(8,118,66,.12)' : 'rgba(121,255,181,.15)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = lightTheme ? 'rgba(8,118,66,.95)' : 'rgba(121,255,181,.98)';
        ctx.fill();
      }
    });

    points.forEach((point, i) => {
      const dx = pointer.x - point.x;
      const dy = pointer.y - point.y;
      const near = Math.hypot(dx, dy) < 115;
      ctx.beginPath();
      ctx.arc(point.x, point.y, near || i % 8 === 0 ? point.size + .7 : point.size, 0, Math.PI * 2);
      ctx.fillStyle = closing
        ? (i % 9 === 0
          ? (lightTheme ? 'rgba(153,100,49,.84)' : 'rgba(210,163,109,.84)')
          : (lightTheme ? 'rgba(74,98,73,.68)' : 'rgba(183,197,170,.61)'))
        : (lightTheme ? 'rgba(9,83,51,.8)' : 'rgba(75,225,146,.8)');
      ctx.fill();
      if (point.activation > .02) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 + point.activation * 5, 0, Math.PI * 2);
        ctx.fillStyle = lightTheme
          ? `rgba(12,126,71,${.24 * point.activation})`
          : `rgba(94,255,166,${.3 * point.activation})`;
        ctx.fill();
      }
      if (near) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = lightTheme ? 'rgba(13,107,64,.13)' : 'rgba(87,235,153,.12)';
        ctx.fill();
      }
    });

    schedule();
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
  const fieldObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting || false;
    if (visible) {
      if (reducedMotion) paint(0);
      else schedule();
    }
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { rootMargin: '120px' });
  fieldObserver.observe(canvas);
  const handleVisibility = () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden) {
      schedule();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  resize();
  return () => {
    cancelAnimationFrame(frame);
    fieldObserver.disconnect();
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

const cleanups = [
  makeField(document.getElementById('field')),
  makeField(document.getElementById('closingCanvas'), true)
];
window.addEventListener('pagehide', () => cleanups.forEach(stop => stop()), { once: true });

const bookCoverFigures = [...document.querySelectorAll('.book-covers figure[id^="book-"]')];
const bookReadingStage = document.getElementById('bookReadingStage');
const bookReadingAvif = bookReadingStage?.querySelector('source[type="image/avif"]');
const bookReadingCover = document.getElementById('bookReadingCover');
const bookReadingNumber = document.getElementById('bookReadingNumber');
const bookReadingTitle = document.getElementById('bookReadingTitle');
const bookReadingDescription = document.getElementById('bookReadingDescription');

function featureBookCover(cover) {
  if (!cover || !bookReadingStage) return;
  const number = cover.id.replace('book-', '');
  const coverImage = cover.querySelector('img');
  const caption = cover.querySelector('figcaption')?.textContent.trim().replace(/\s+/g, ' ') || `Book ${number}`;
  const summary = document.querySelectorAll('.book-spiral li')[Number(number) - 1];
  const title = summary?.querySelector('h3')?.textContent.trim() || caption;
  const description = summary?.querySelector('p')?.textContent.trim() || '';

  bookReadingCover.src = coverImage.dataset.fullSrc || coverImage.currentSrc || coverImage.src;
  if (bookReadingAvif) {
    bookReadingAvif.srcset = coverImage.dataset.fullAvif || '';
  }
  bookReadingCover.alt = coverImage.alt;
  bookReadingNumber.textContent = `FEATURED COVER · BOOK ${number}`;
  bookReadingTitle.textContent = title;
  bookReadingDescription.textContent = description;
  bookCoverFigures.forEach(item => item.classList.toggle('is-featured', item === cover));
}

bookCoverFigures.forEach(cover => {
  const caption = cover.querySelector('figcaption')?.textContent.trim().replace(/\s+/g, ' ') || cover.id;
  cover.tabIndex = 0;
  cover.setAttribute('role', 'button');
  cover.setAttribute('aria-label', `Open ${caption}`);
  cover.addEventListener('mouseenter', () => featureBookCover(cover));
  cover.addEventListener('focus', () => featureBookCover(cover));
  cover.addEventListener('click', () => {
    if (location.hash === `#${cover.id}`) openBookSourceFromHash();
    else location.hash = cover.id;
  });
  cover.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (location.hash === `#${cover.id}`) openBookSourceFromHash();
    else location.hash = cover.id;
  });
});
featureBookCover(bookCoverFigures[0]);

const bookSourcePreview = document.getElementById('bookSourcePreview');
const bookPreviewAvif = bookSourcePreview?.querySelector('source[type="image/avif"]');
const bookPreviewCover = document.getElementById('bookPreviewCover');
const bookPreviewNumber = document.getElementById('bookPreviewNumber');
const bookSourceTitle = document.getElementById('bookSourceTitle');
const bookPreviewDescription = document.getElementById('bookPreviewDescription');

function openBookSourceFromHash() {
  const match = /^#book-(0[1-7])$/.exec(location.hash);
  if (!match) return;
  const number = Number(match[1]);
  const cover = document.getElementById(`book-${match[1]}`);
  if (!cover) return;
  const coverImage = cover.querySelector('img');
  const caption = cover.querySelector('figcaption')?.textContent.trim().replace(/\s+/g, ' ');
  const summary = document.querySelectorAll('.book-spiral li')[number - 1];
  const description = summary?.querySelector('p')?.textContent.trim();

  bookPreviewCover.src = coverImage.dataset.fullSrc || coverImage.currentSrc || coverImage.src;
  if (bookPreviewAvif) {
    bookPreviewAvif.srcset = coverImage.dataset.fullAvif || '';
  }
  bookPreviewCover.alt = coverImage.alt;
  bookPreviewNumber.textContent = `BOOK ${match[1]}`;
  bookSourceTitle.textContent = caption || `Book ${number}`;
  bookPreviewDescription.textContent = description || '';

  if (!bookSourcePreview.open) bookSourcePreview.showModal();
}

bookSourcePreview.addEventListener('click', event => {
  if (event.target === bookSourcePreview) bookSourcePreview.close();
});
window.addEventListener('hashchange', openBookSourceFromHash);
requestAnimationFrame(openBookSourceFromHash);
