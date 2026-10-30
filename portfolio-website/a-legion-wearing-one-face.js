const viewer = document.getElementById('artworkViewer');
const viewerImage = document.getElementById('viewerImage');
const viewerTitle = document.getElementById('viewerTitle');
const viewerCaption = document.getElementById('viewerCaption');
const viewerStage = document.getElementById('viewerStage');
const viewerZoomLabel = document.getElementById('viewerZoomLabel');
const guideDataUrl = 'data/a-legion-wearing-one-face.json?v=asset-opt-1';

let artworkData = null;
let scale = 1;
let fittedWidth = 0;
let dragStart = null;
let pinchStart = null;
const pointers = new Map();

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function centerViewer() {
  viewerStage.scrollLeft = Math.max(0, (viewerStage.scrollWidth - viewerStage.clientWidth) / 2);
  viewerStage.scrollTop = Math.max(0, (viewerStage.scrollHeight - viewerStage.clientHeight) / 2);
}

function fitViewerImage() {
  if (!viewer.open || !viewerImage.naturalWidth) return;
  const availableWidth = Math.max(1, viewerStage.clientWidth - 36);
  const availableHeight = Math.max(1, viewerStage.clientHeight - 36);
  const imageRatio = viewerImage.naturalWidth / viewerImage.naturalHeight;
  fittedWidth = Math.min(availableWidth, availableHeight * imageRatio);
  viewerImage.style.width = `${fittedWidth * scale}px`;
  viewerZoomLabel.textContent = `${Math.round(scale * 100)}%`;
  requestAnimationFrame(centerViewer);
}

function resetViewer() {
  scale = 1;
  if (fittedWidth) viewerImage.style.width = `${fittedWidth}px`;
  viewerZoomLabel.textContent = '100%';
  requestAnimationFrame(centerViewer);
}

function setViewerZoom(nextScale) {
  if (!fittedWidth) return;
  const centerXRatio = (viewerStage.scrollLeft + viewerStage.clientWidth / 2) / Math.max(1, viewerStage.scrollWidth);
  const centerYRatio = (viewerStage.scrollTop + viewerStage.clientHeight / 2) / Math.max(1, viewerStage.scrollHeight);
  scale = Math.min(6, Math.max(1, +nextScale.toFixed(2)));
  viewerImage.style.width = `${fittedWidth * scale}px`;
  viewerZoomLabel.textContent = `${Math.round(scale * 100)}%`;
  requestAnimationFrame(() => {
    viewerStage.scrollLeft = centerXRatio * viewerStage.scrollWidth - viewerStage.clientWidth / 2;
    viewerStage.scrollTop = centerYRatio * viewerStage.scrollHeight - viewerStage.clientHeight / 2;
    if (scale === 1) centerViewer();
  });
}

function zoomViewer(delta) {
  setViewerZoom(scale + delta);
}

function artworkMeta(workId) {
  return artworkData?.works?.find(work => work.id === workId) || null;
}

function openArtwork(workId) {
  const meta = artworkMeta(workId);
  const trigger = document.querySelector(`.artwork-trigger[data-artwork="${workId}"]`);
  const image = trigger?.querySelector('img');
  if (!trigger || !image) return;
  viewerTitle.textContent = meta?.title || trigger.closest('figure')?.querySelector('figcaption')?.textContent.trim() || 'Artwork';
  viewerCaption.textContent = meta?.caption || '';
  viewerImage.style.width = '';
  viewerImage.src = image.currentSrc || image.src;
  viewerImage.alt = meta?.alt || image.alt;
  viewer.showModal();
  document.body.classList.add('viewer-open');
  scale = 1;
  fittedWidth = 0;
  viewerZoomLabel.textContent = '100%';
  if (viewerImage.complete) requestAnimationFrame(fitViewerImage);
  else viewerImage.addEventListener('load', () => requestAnimationFrame(fitViewerImage), { once: true });
  viewerStage.focus({ preventScroll: true });
}

function closeViewer() {
  document.body.classList.remove('viewer-open');
}

function renderCharacterEntry(character) {
  const dialogue = character.dialogue?.length
    ? `<p><strong>Says:</strong> ${character.dialogue.map(line => `“${escapeHtml(line)}”`).join(' ')}</p>`
    : '';
  return `<article class="character-entry">
    <span class="entry-meta">${escapeHtml(character.entityType?.replaceAll('_', ' ') || 'archetype')}${character.speakerConfidence === 'inferred' ? ' · interpretation inferred' : ''}</span>
    <h5>${escapeHtml(character.displayName)}${character.archetypeRoles?.length ? ` · ${escapeHtml(character.archetypeRoles.join(' / '))}` : ''}</h5>
    <p>${escapeHtml(character.depictedAction)}</p>
    ${dialogue}
    <p><strong>In this work:</strong> ${escapeHtml(character.symbolicMeaning)}</p>
  </article>`;
}

function renderMessageEntry(message) {
  return `<article class="message-entry">
    <span class="entry-meta">${escapeHtml(message.type || 'message')}</span>
    <h5>“${escapeHtml(message.text)}”</h5>
    <p>${escapeHtml(message.meaning)}</p>
  </article>`;
}

function renderGuides() {
  if (!artworkData) return;
  document.querySelectorAll('[data-guide]').forEach(guide => {
    const workId = guide.dataset.guide;
    const work = artworkMeta(workId);
    if (!work) return;
    const characters = artworkData.characters.filter(character => character.works?.includes(workId));
    const messages = artworkData.messages.filter(message => message.works?.includes(workId));
    const content = guide.querySelector('.guide-content');
    content.innerHTML = `<p>${escapeHtml(work.description)}</p>
      ${characters.length ? `<section class="guide-group"><h4>Characters and archetypes</h4><div class="character-list">${characters.map(renderCharacterEntry).join('')}</div></section>` : ''}
      ${messages.length ? `<section class="guide-group"><h4>Messages in this artwork</h4><div class="message-list">${messages.map(renderMessageEntry).join('')}</div></section>` : ''}`;
  });

  const sequence = document.getElementById('messageSequence');
  if (sequence && artworkData.messageSequence?.length) {
    sequence.innerHTML = artworkData.messageSequence.map((message, index) =>
      `<article><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(message)}</p></article>`
    ).join('');
  }

  const fullGuide = document.getElementById('fullGuideContent');
  if (fullGuide) {
    const groups = new Map();
    artworkData.characters.forEach(character => {
      const ids = character.works?.length ? character.works : ['all'];
      ids.forEach(id => {
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(character);
      });
    });
    fullGuide.innerHTML = artworkData.works.map(work => {
      const characters = groups.get(work.id) || [];
      const messages = artworkData.messages.filter(message => message.works?.includes(work.id));
      return `<section class="guide-group"><h4>${escapeHtml(work.title)}</h4>
        <p>${escapeHtml(work.description)}</p>
        ${characters.length ? `<div class="character-list">${characters.map(renderCharacterEntry).join('')}</div>` : ''}
        ${messages.length ? `<h4>Messages</h4><div class="message-list">${messages.map(renderMessageEntry).join('')}</div>` : ''}
      </section>`;
    }).join('');
  }
}

fetch(guideDataUrl)
  .then(response => {
    if (!response.ok) throw new Error(`Guide request failed: ${response.status}`);
    return response.json();
  })
  .then(data => {
    artworkData = data;
    renderGuides();
  })
  .catch(error => {
    console.error(error);
    const fullGuide = document.getElementById('fullGuideContent');
    if (fullGuide) fullGuide.innerHTML = '<p>The structured guide could not be loaded. The visible summaries remain available.</p>';
  });

document.querySelectorAll('.artwork-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => openArtwork(trigger.dataset.artwork));
});

document.querySelector('[data-viewer-zoom-in]').addEventListener('click', () => zoomViewer(.25));
document.querySelector('[data-viewer-zoom-out]').addEventListener('click', () => zoomViewer(-.25));
document.querySelector('[data-viewer-reset]').addEventListener('click', resetViewer);
viewer.addEventListener('close', closeViewer);
viewer.addEventListener('click', event => {
  if (event.target === viewer) viewer.close();
});

viewerStage.addEventListener('wheel', event => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  zoomViewer(event.deltaY < 0 ? .2 : -.2);
}, { passive: false });
viewerStage.addEventListener('dblclick', resetViewer);

viewerStage.addEventListener('pointerdown', event => {
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  viewerStage.setPointerCapture(event.pointerId);
  if (pointers.size === 1) {
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewerStage.scrollLeft,
      scrollTop: viewerStage.scrollTop
    };
  }
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
  }
});

viewerStage.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 1 && dragStart && scale > 1) {
    viewerStage.classList.add('is-dragging');
    viewerStage.scrollLeft = dragStart.scrollLeft - event.clientX + dragStart.x;
    viewerStage.scrollTop = dragStart.scrollTop - event.clientY + dragStart.y;
  } else if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    setViewerZoom(pinchStart.scale * distance / pinchStart.distance);
  }
});

function endPointer(event) {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (pointers.size === 1) {
    const pointer = [...pointers.values()][0];
    dragStart = {
      x: pointer.x,
      y: pointer.y,
      scrollLeft: viewerStage.scrollLeft,
      scrollTop: viewerStage.scrollTop
    };
  } else if (!pointers.size) {
    dragStart = null;
    viewerStage.classList.remove('is-dragging');
  }
}
viewerStage.addEventListener('pointerup', endPointer);
viewerStage.addEventListener('pointercancel', endPointer);

document.addEventListener('keydown', event => {
  if (!viewer.open) return;
  if (event.key === '+' || event.key === '=') zoomViewer(.25);
  else if (event.key === '-') zoomViewer(-.25);
  else if (event.key === '0') resetViewer();
  else if (event.key === 'ArrowLeft') viewerStage.scrollLeft -= 45;
  else if (event.key === 'ArrowRight') viewerStage.scrollLeft += 45;
  else if (event.key === 'ArrowUp') viewerStage.scrollTop -= 45;
  else if (event.key === 'ArrowDown') viewerStage.scrollTop += 45;
});

new ResizeObserver(() => {
  if (!viewer.open || !viewerImage.naturalWidth) return;
  const previousScale = scale;
  fittedWidth = 0;
  fitViewerImage();
  if (previousScale !== 1) setViewerZoom(previousScale);
}).observe(viewerStage);
