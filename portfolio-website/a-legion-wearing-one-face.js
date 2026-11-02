const viewer = document.getElementById('artworkViewer');
const viewerImage = document.getElementById('viewerImage');
const viewerTitle = document.getElementById('viewerTitle');
const viewerCaption = document.getElementById('viewerCaption');
const viewerStage = document.getElementById('viewerStage');
const viewerZoomLabel = document.getElementById('viewerZoomLabel');
const viewerPlayLink = document.getElementById('viewerPlayLink');
const guideDataUrl = 'data/a-legion-wearing-one-face.json?v=legion-plays-2';

let artworkData = null;
let scale = 1;
let fittedWidth = 0;
let dragStart = null;
let pinchStart = null;
const pointers = new Map();

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
  const artworkTitle = meta?.title || trigger.dataset.playTitle || trigger.closest('figure')?.querySelector('figcaption')?.textContent.trim() || 'Artwork';
  const artworkSubtitle = meta?.subtitle || trigger.dataset.playSubtitle || '';
  viewerTitle.textContent = artworkSubtitle ? `${artworkTitle} · ${artworkSubtitle}` : artworkTitle;
  viewerCaption.textContent = meta?.caption || '';
  const playUrl = meta?.playUrl || trigger.dataset.playUrl || '';
  if (playUrl) {
    viewerPlayLink.href = playUrl;
    viewerPlayLink.hidden = false;
  } else {
    viewerPlayLink.removeAttribute('href');
    viewerPlayLink.hidden = true;
  }
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
  const article = document.createElement('article');
  article.className = 'character-entry';
  const meta = document.createElement('span');
  meta.className = 'entry-meta';
  meta.textContent = `${character.entityType?.replaceAll('_', ' ') || 'archetype'}${character.speakerConfidence === 'inferred' ? ' · interpretation inferred' : ''}`;
  const heading = document.createElement('h5');
  heading.textContent = `${character.displayName}${character.archetypeRoles?.length ? ` · ${character.archetypeRoles.join(' / ')}` : ''}`;
  const action = document.createElement('p');
  action.textContent = character.depictedAction;
  article.append(meta, heading, action);

  if (character.dialogue?.length) {
    const dialogue = document.createElement('p');
    const lead = document.createElement('strong');
    lead.textContent = 'Says:';
    dialogue.append(lead, ` ${character.dialogue.map(line => `“${line}”`).join(' ')}`);
    article.append(dialogue);
  }

  const meaning = document.createElement('p');
  const meaningLead = document.createElement('strong');
  meaningLead.textContent = 'In this work:';
  meaning.append(meaningLead, ` ${character.symbolicMeaning}`);
  article.append(meaning);
  return article;
}

function renderMessageEntry(message) {
  const article = document.createElement('article');
  article.className = 'message-entry';
  const meta = document.createElement('span');
  meta.className = 'entry-meta';
  meta.textContent = message.type || 'message';
  const heading = document.createElement('h5');
  heading.textContent = `“${message.text}”`;
  const meaning = document.createElement('p');
  meaning.textContent = message.meaning;
  article.append(meta, heading, meaning);
  return article;
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
    content.replaceChildren();
    const description = document.createElement('p');
    description.textContent = work.description;
    content.append(description);
    if (characters.length) content.append(createGuideGroup('Characters and archetypes', characters, 'character-list'));
    if (messages.length) content.append(createGuideGroup('Messages in this artwork', messages, 'message-list'));
  });

  const sequence = document.getElementById('messageSequence');
  if (sequence && artworkData.messageSequence?.length) {
    sequence.replaceChildren();
    artworkData.messageSequence.forEach((message, index) => {
      const item = document.createElement('article');
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      const copy = document.createElement('p');
      copy.textContent = message;
      item.append(number, copy);
      sequence.append(item);
    });
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
    fullGuide.replaceChildren();
    artworkData.works.forEach(work => {
      const characters = groups.get(work.id) || [];
      const messages = artworkData.messages.filter(message => message.works?.includes(work.id));
      const section = document.createElement('section');
      section.className = 'guide-group';
      const title = document.createElement('h4');
      title.textContent = work.title;
      const description = document.createElement('p');
      description.textContent = work.description;
      section.append(title, description);
      if (characters.length) section.append(createEntryList(characters, 'character-list', renderCharacterEntry));
      if (messages.length) {
        const messageTitle = document.createElement('h4');
        messageTitle.textContent = 'Messages';
        section.append(messageTitle, createEntryList(messages, 'message-list', renderMessageEntry));
      }
      fullGuide.append(section);
    });
  }
}

function createEntryList(items, className, renderer) {
  const list = document.createElement('div');
  list.className = className;
  items.forEach(item => list.append(renderer(item)));
  return list;
}

function createGuideGroup(titleText, items, listClass) {
  const section = document.createElement('section');
  section.className = 'guide-group';
  const title = document.createElement('h4');
  title.textContent = titleText;
  const list = createEntryList(
    items,
    listClass,
    listClass === 'character-list' ? renderCharacterEntry : renderMessageEntry,
  );
  section.append(title, list);
  return section;
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
    if (fullGuide) {
      const message = document.createElement('p');
      message.textContent = 'The structured guide could not be loaded. The visible summaries remain available.';
      fullGuide.replaceChildren(message);
    }
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
