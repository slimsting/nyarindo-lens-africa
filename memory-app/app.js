const STORAGE_KEY = 'return-memories-v1';
const form = document.getElementById('memoryForm');
const memoryList = document.getElementById('memoryList');
const emptyNote = document.getElementById('emptyNote');
const clearButton = document.getElementById('clearMemories');
const compareAllButton = document.getElementById('compareAllReports');
const globalComparison = document.getElementById('globalComparison');
const toast = document.getElementById('toast');
const returnAnchor = document.getElementById('returnAnchor');
const stateField = document.querySelector('.state-field');
const journalMode = document.getElementById('journalMode');
const selectedStoryNote = document.getElementById('selectedStory');
const stateInput = document.getElementById('stateCustom');
const statePresets = [...document.querySelectorAll('.state-preset')];
const openWitnessPractice = document.getElementById('openWitnessPractice');
const witnessDialog = document.getElementById('witnessDialog');
const witnessText = document.getElementById('witnessText');
const clearWitness = document.getElementById('clearWitness');
const storageNote = document.getElementById('storageNote');
const storageSecurity = document.getElementById('storageSecurity');
const unlockEntriesButton = document.getElementById('unlockEntries');
const pinDialog = document.getElementById('pinDialog');
const pinForm = document.getElementById('pinForm');
const pinTitle = document.getElementById('pinTitle');
const pinIntro = document.getElementById('pinIntro');
const pinLabel = document.getElementById('pinLabel');
const pinValue = document.getElementById('pinValue');
const pinConfirmField = document.getElementById('pinConfirmField');
const pinConfirm = document.getElementById('pinConfirm');
const pinHelp = document.getElementById('pinHelp');
const pinError = document.getElementById('pinError');
const pinSubmit = document.getElementById('pinSubmit');
const pinCancel = document.getElementById('pinCancel');
const pinCancelIcon = document.getElementById('pinCancelIcon');
const attentionMessage = document.getElementById('attentionMessage');
const attentionCopy = document.getElementById('attentionCopy');
const attentionProgress = document.getElementById('attentionProgress');
const examinationGate = document.getElementById('examinationGate');
const examinationEyebrow = document.getElementById('examinationEyebrow');
const examinationTitle = document.getElementById('examinationTitle');
const examinationProgress = document.getElementById('examinationProgress');
const examinationOrbitNodes = [...document.querySelectorAll('.examination-orbit span')];
const spiralStages = [...document.querySelectorAll('.spiral-stage')];
const attentionStepItems = [...document.querySelectorAll('[data-attention-step]')];
const observationStage = document.querySelector('[data-stage="signal"]');
const observationInput = form.elements.namedItem('observation');
const observationError = document.getElementById('observationError');
const previousStageButton = document.getElementById('previousStage');
const nextStageButton = document.getElementById('nextStage');
const stageProgress = document.getElementById('stageProgress');
const saveButton = document.getElementById('saveButton');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
let formMode = 'beginning';
let activeEntryId = null;
let activeStageIndex = 0;
let selectedStoryId = null;
let entriesCache = [];
let storageEnvelope = null;
let storageKey = null;
let storageLocked = false;
let pinDialogMode = 'create';

function syncStatePresets() {
  const values = stateInput.value
    .split(',')
    .map(value => value.trim().toLocaleLowerCase())
    .filter(Boolean);
  statePresets.forEach(button => {
    button.setAttribute('aria-pressed', String(values.includes(button.dataset.state.toLocaleLowerCase())));
  });
}

statePresets.forEach(button => {
  button.addEventListener('click', () => {
    const values = stateInput.value
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    const alreadyAdded = values.some(value => value.toLocaleLowerCase() === button.dataset.state.toLocaleLowerCase());
    if (!alreadyAdded) values.push(button.dataset.state);
    stateInput.value = `${values.join(', ')}, `;
    syncStatePresets();
    stateInput.focus();
    stateInput.setSelectionRange(stateInput.value.length, stateInput.value.length);
  });
});

stateInput.addEventListener('input', syncStatePresets);

openWitnessPractice.addEventListener('click', () => {
  witnessText.value = '';
  witnessDialog.showModal();
  requestAnimationFrame(() => witnessText.focus());
});
witnessDialog.addEventListener('close', () => {
  witnessText.value = '';
});
witnessDialog.addEventListener('click', event => {
  if (event.target === witnessDialog) witnessDialog.close();
});
clearWitness.addEventListener('click', () => {
  witnessText.value = '';
  witnessText.focus();
});

function getVisibleSpiralStages() {
  return spiralStages.filter(stage => formMode === 'return' || !stage.hasAttribute('data-return-only'));
}

function showSpiralStage(index, focus = false) {
  const stages = getVisibleSpiralStages();
  if (!stages.length) return;
  activeStageIndex = Math.max(0, Math.min(index, stages.length - 1));
  const activeStage = stages[activeStageIndex];
  spiralStages.forEach(stage => {
    const isActive = stage === activeStage;
    stage.hidden = !isActive;
    stage.classList.toggle('is-active', isActive);
  });

  previousStageButton.disabled = activeStageIndex === 0;
  nextStageButton.hidden = activeStageIndex === stages.length - 1;
  saveButton.hidden = activeStageIndex !== stages.length - 1;
  stageProgress.textContent = `Step ${activeStageIndex + 1} of ${stages.length} · ${activeStage.dataset.stageTitle}`;
  if (activeStageIndex < stages.length - 1) {
    nextStageButton.textContent = `Next: ${stages[activeStageIndex + 1].dataset.stageTitle} →`;
  }

  const attentionStepKeys = ['attention', 'signal', 'first-story', 'pause', 'choose', 'action'];
  const attentionStepIndex = attentionStepKeys.indexOf(activeStage.dataset.stage);
  attentionStepItems.forEach((item, itemIndex) => {
    item.classList.toggle('is-active', itemIndex === attentionStepIndex);
    item.classList.toggle('is-complete', attentionStepIndex > itemIndex);
  });

  if (focus) {
    activeStage.focus({ preventScroll: true });
    activeStage.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

previousStageButton.addEventListener('click', () => showSpiralStage(activeStageIndex - 1, true));
nextStageButton.addEventListener('click', () => showSpiralStage(activeStageIndex + 1, true));
spiralStages.forEach(stage => stage.setAttribute('tabindex', '-1'));

const storyTitles = {
  student: 'The student who stopped asking questions',
  artist: 'The artist who stopped creating',
  partner: 'The partner who stopped speaking',
  employee: 'The employee who stopped innovating',
  believer: 'The believer who stopped questioning',
  'wave-classroom': 'The wave mind in the linear classroom'
};

const storySources = {
  student: { book: 6, page: 10 },
  artist: { book: 6, page: 10 },
  partner: { book: 6, page: 10 },
  employee: { book: 6, page: 11 },
  believer: { book: 6, page: 11 },
  'wave-classroom': { book: 6, page: 11 }
};

const bookTitles = {
  1: 'The Nyarindo Lens',
  2: 'The Pulse Reports',
  3: 'The Stories We Tell About the Pulse',
  4: 'The Method in the Waves',
  5: 'Attention',
  6: 'Teaching the Wave Mind',
  7: 'The Vacuum Experiment'
};

function normalizeEntries(value) {
  return Array.isArray(value) ? value.filter(entry => entry && typeof entry.id === 'string') : [];
}

function readEntries() {
  return entriesCache;
}

async function writeEntries(entries) {
  entriesCache = normalizeEntries(entries);
  if (storageEnvelope && storageKey) {
    const salt = base64ToBytes(storageEnvelope.salt);
    const envelope = await encryptEntriesWithKey(
      entriesCache,
      storageKey,
      salt,
      storageEnvelope.iterations
    );
    storageEnvelope = envelope;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesCache));
}

const storageEncoder = new TextEncoder();
const STORAGE_AAD = storageEncoder.encode('nyarindo-return-journal-v1');
const PBKDF2_ITERATIONS = 600000;

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveStorageKey(passphrase, salt, iterations) {
  const material = await crypto.subtle.importKey(
    'raw',
    storageEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptEntriesWithKey(entries, key, salt, iterations) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = storageEncoder.encode(JSON.stringify(entries));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: STORAGE_AAD },
    key,
    plaintext
  );
  return {
    version: 1,
    encrypted: true,
    cipher: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted))
  };
}

async function createStorageEnvelope(entries, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveStorageKey(passphrase, salt, PBKDF2_ITERATIONS);
  const envelope = await encryptEntriesWithKey(entries, key, salt, PBKDF2_ITERATIONS);
  return { envelope, key };
}

async function decryptStorageEnvelope(envelope, passphrase) {
  const iterations = Number(envelope.iterations);
  if (!Number.isFinite(iterations) || iterations < 100000) {
    throw new Error('Unsupported encrypted storage parameters.');
  }
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const key = await deriveStorageKey(passphrase, salt, iterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: STORAGE_AAD },
    key,
    base64ToBytes(envelope.data)
  );
  return {
    entries: normalizeEntries(JSON.parse(new TextDecoder().decode(plaintext))),
    key
  };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `return-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function getBookHref(bookNumber) {
  return `/#book-${String(bookNumber).padStart(2, '0')}`;
}

function createBookCitation(bookNumber, pageLabel = null) {
  const link = document.createElement('a');
  link.className = 'book-citation';
  link.href = getBookHref(bookNumber);
  link.textContent = `(book ${bookNumber}${pageLabel ? `, ${pageLabel}` : ''})`;
  link.setAttribute('aria-label', `Open ${bookTitles[bookNumber]}, Book ${bookNumber}${pageLabel ? `, ${pageLabel}` : ''}`);
  return link;
}

document.addEventListener('click', (event) => {
  const link = event.target.closest?.('a[href*="/portfolio-website/#book-"]');
  if (!link) return;
  const pageMatch = link.textContent.match(/\bpages?\s+(\d+)/i);
  if (!pageMatch) return;
  const url = new URL(link.href);
  url.searchParams.set('page', pageMatch[1]);
  link.href = url.href;
}, true);

function appendBookCitations(parent, references = []) {
  references.forEach(reference => {
    const bookNumber = typeof reference === 'number' ? reference : reference.book;
    const pageLabel = typeof reference === 'number' ? null : reference.page;
    parent.append(' ', createBookCitation(bookNumber, pageLabel));
  });
}

function appendLinkedBookText(parent, text) {
  const pattern = /O\((?:0|1|n)\)/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) parent.append(document.createTextNode(text.slice(cursor, match.index)));
    const link = document.createElement('a');
    link.className = 'book-reference';
    link.href = getBookHref(6);
    link.title = 'Open Teaching the Wave Mind, Book Six';
    link.textContent = match[0];
    parent.append(link, ' ', createBookCitation(6, 'pages 15, 20'));
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
}

function addText(parent, label, value, bookNumbers = []) {
  if (!value) return;
  const title = document.createElement('div');
  title.className = 'memory-label';
  appendLinkedBookText(title, label);
  appendBookCitations(title, bookNumbers);
  const content = document.createElement('p');
  content.textContent = value;
  parent.append(title, content);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}

function getStoryLink(storyId) {
  if (!storyId || !storyTitles[storyId]) return null;
  const source = storySources[storyId];
  const links = document.createElement('div');
  links.className = 'story-references';
  const storyLink = document.createElement('a');
  storyLink.className = 'story-reference';
  storyLink.href = '#storiesTitle';
  storyLink.textContent = `Open this story in the vignettes ↗`;
  storyLink.addEventListener('click', event => {
    event.preventDefault();
    const story = [...document.querySelectorAll('.story-card')].find(item => item.querySelector('summary')?.textContent === storyTitles[storyId]);
    if (story) {
      story.open = true;
      story.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  const bookLink = document.createElement('a');
  bookLink.className = 'story-reference book-reference';
  bookLink.href = getBookHref(source.book);
  bookLink.textContent = `Teaching the Wave Mind · Book Six (book ${source.book}, page ${source.page}) ↗`;
  links.append(storyLink, bookLink);
  return links;
}

const commonWords = new Set(('a about after again an and are around as at be been before but by can did do during feel feels felt for from had has have he her here his i if in into is it its just me my of on or our out over she so that the their them then there they this to under was we were what when where which while who why will with you your').split(' '));

const portableJournalPrompts = [
  'What did I choose to attend to before the signal became a story?',
  'What exactly did I notice before I began explaining it?',
  'What did my mind say the signal meant, and could it have meant something else?',
  'What story was credible, supportive, and still open to evidence?',
  'What small action followed, and what did I observe on return?'
];

function normalizeRawReport(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function getRepeatedReportGroups(entry) {
  const reports = [];
  const beginningReport = normalizeRawReport(entry.observation);

  if (beginningReport) {
    reports.push({
      source: 'Beginning',
      createdAt: entry.createdAt,
      report: beginningReport,
      story: String(entry.meaning || '').trim()
    });
  }

  (entry.returns || []).forEach((item, index) => {
    const report = normalizeRawReport(item.observation);
    if (!report) return;
    reports.push({
      source: `Return ${String(index + 1).padStart(2, '0')}`,
      createdAt: item.createdAt,
      report,
      story: String(item.meaning || '').trim()
    });
  });

  const groups = new Map();
  reports.forEach(report => {
    if (!groups.has(report.report)) groups.set(report.report, []);
    groups.get(report.report).push(report);
  });

  return [...groups.values()].filter(group => group.length > 1);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = value;
    temporary.setAttribute('readonly', '');
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.append(temporary);
    temporary.select();
    const copied = document.execCommand('copy');
    temporary.remove();
    return copied;
  }
}

function createComparison(entry) {
  const wrapper = document.createElement('section');
  wrapper.className = 'comparison-block';

  const panelId = `comparison-${entry.id}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'compare-reports';
  button.textContent = 'Compare repeated signal reports';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panelId);

  const panel = document.createElement('section');
  panel.className = 'comparison-panel';
  panel.id = panelId;
  panel.hidden = true;

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'OPTIONAL REFLECTION';
  const title = document.createElement('h3');
  title.textContent = 'The same wording, beside the interpretations it gathered.';
  const explanation = document.createElement('p');
  explanation.className = 'comparison-explanation';
  explanation.textContent = 'The body reports a signal; the saved words are a human-language description of it. Reports are grouped only when their wording matches exactly after extra spaces are trimmed. Interpretations never decide which reports belong together. Repeated wording is not proof that the underlying sensation, cause, or meaning was identical.';
  panel.append(eyebrow, title, explanation);

  const repeatedGroups = getRepeatedReportGroups(entry);
  if (repeatedGroups.length) {
    const moments = repeatedGroups.reduce((total, group) => total + group.length, 0);
    const summary = document.createElement('p');
    summary.className = 'comparison-summary';
    summary.textContent = `${repeatedGroups.length} repeated report${repeatedGroups.length === 1 ? '' : 's'} across ${moments} saved moments.`;
    panel.append(summary);

    const list = document.createElement('div');
    list.className = 'repeated-report-list';
    repeatedGroups.forEach(group => {
      const reportArticle = document.createElement('article');
      reportArticle.className = 'repeated-report';
      const count = document.createElement('p');
      count.className = 'repeated-report-count';
      const storyCount = group.filter(item => item.story).length;
      count.textContent = `${storyCount} interpretation${storyCount === 1 ? '' : 's'} attached to this exact signal description`;
      const quote = document.createElement('blockquote');
      quote.textContent = group[0].report;
      const stories = document.createElement('div');
      stories.className = 'report-story-list';

      group.forEach(item => {
        const story = document.createElement('div');
        story.className = 'report-story';
        const source = document.createElement('span');
        source.className = 'story-source';
        source.textContent = `${item.source} · ${formatDate(item.createdAt)}`;
        const storyText = document.createElement('p');
        storyText.textContent = item.story ? 'Attached interpretation: ' + item.story : 'No interpretation was written with this signal report.';
        if (!item.story) storyText.classList.add('missing-story');
        story.append(source, storyText);
        stories.append(story);
      });

      reportArticle.append(count, quote, stories);
      list.append(reportArticle);
    });
    panel.append(list);
  } else {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No exact signal description has repeated in this thread yet. The comparison can notice identical wording, but it cannot decide that differently worded reports describe the same sensation.';
    panel.append(empty);
  }

  const example = document.createElement('details');
  example.className = 'comparison-example';
  const exampleSummary = document.createElement('summary');
  exampleSummary.textContent = 'See a constructed example';
  exampleSummary.append(' ', createBookCitation(6, 'page 20'));
  const exampleCopy = document.createElement('div');
  const exampleLabel = document.createElement('span');
  exampleLabel.className = 'example-label';
  exampleLabel.textContent = 'NOT FROM YOUR ENTRIES';
  const exampleQuote = document.createElement('blockquote');
  exampleQuote.textContent = 'My jaw tightened when the phone rang.';
  const exampleStories = document.createElement('div');
  exampleStories.className = 'report-story-list';
  [
    ['Beginning', 'I thought someone needed something from me.'],
    ['Return 01', 'I told myself I should answer immediately.'],
    ['Return 02', 'I noticed the tightness before the story arrived.']
  ].forEach(([sourceLabel, storyLabel]) => {
    const story = document.createElement('div');
    story.className = 'report-story';
    const source = document.createElement('span');
    source.className = 'story-source';
    source.textContent = sourceLabel;
    const storyText = document.createElement('p');
    storyText.textContent = storyLabel;
    story.append(source, storyText);
    exampleStories.append(story);
  });
  const exampleNote = document.createElement('p');
  exampleNote.className = 'example-note';
  exampleNote.textContent = 'The signal description stayed the same in this example; the interpretations around it changed. The comparison does not decide which interpretation is true.';
  exampleCopy.append(exampleLabel, exampleQuote, exampleStories, exampleNote);
  example.append(exampleSummary, exampleCopy);

  const carry = document.createElement('section');
  carry.className = 'carry-prompts';
  const carryTitle = document.createElement('h4');
  carryTitle.textContent = 'Carry the questions into any journal';
  carryTitle.append(' ', createBookCitation(6, 'pages 20–22'));
  const promptList = document.createElement('ol');
  portableJournalPrompts.forEach(prompt => {
    const item = document.createElement('li');
    item.textContent = prompt;
    promptList.append(item);
  });
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'copy-prompts';
  copyButton.textContent = 'Copy these prompts';
  copyButton.addEventListener('click', async () => {
    const copied = await copyText(portableJournalPrompts.map(prompt => `- ${prompt}`).join('\n'));
    showToast(copied ? 'Journaling prompts copied.' : 'The prompts could not be copied from this browser.');
  });
  carry.append(carryTitle, promptList, copyButton);

  panel.append(example, carry);
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    button.textContent = panel.hidden ? 'Compare repeated signal reports' : 'Close comparison';
  });
  wrapper.append(button, panel);
  return wrapper;
}

function getReportMoments(entries) {
  const moments = [];
  entries.forEach(entry => {
    const beginningReport = normalizeRawReport(entry.observation);
    if (beginningReport) {
      moments.push({
        entryId: entry.id,
        source: 'Beginning',
        createdAt: entry.createdAt,
        attention: String(entry.attention || '').trim(),
        report: beginningReport,
        story: String(entry.meaning || '').trim(),
        alternativeStory: String(entry.alternativeStory || '').trim(),
        chosenStory: String(entry.chosenStory || '').trim(),
        evidence: String(entry.evidence || '').trim(),
        action: String(entry.practice || '').trim(),
        returnObservation: ''
      });
    }

    (entry.returns || []).forEach((item, index) => {
      const report = normalizeRawReport(item.observation);
      if (!report) return;
      moments.push({
        entryId: entry.id,
        source: `Return ${String(index + 1).padStart(2, '0')}`,
        createdAt: item.createdAt,
        attention: String(item.attention || '').trim(),
        report,
        story: String(item.meaning || '').trim(),
        alternativeStory: String(item.alternativeStory || '').trim(),
        chosenStory: String(item.chosenStory || '').trim(),
        evidence: String(item.evidence || '').trim(),
        action: String(item.practice || '').trim(),
        returnObservation: String(item.returnObservation || '').trim()
      });
    });
  });
  return moments.sort((a, b) => b.createdAt - a.createdAt);
}

function getReportTokens(value) {
  return [...new Set(
    (normalizeRawReport(value).toLocaleLowerCase().match(/[\p{L}\p{N}']+/gu) || [])
      .filter(word => word.length > 2 && !commonWords.has(word))
  )];
}

function compareReportWording(first, second) {
  const firstReport = normalizeRawReport(first);
  const secondReport = normalizeRawReport(second);
  const firstTokens = getReportTokens(firstReport);
  const secondTokens = getReportTokens(secondReport);
  const sharedWords = firstTokens.filter(word => secondTokens.includes(word));
  const union = new Set([...firstTokens, ...secondTokens]);
  const score = union.size ? sharedWords.length / union.size : 0;

  return {
    similar: firstReport === secondReport || (sharedWords.length >= 2 && score >= 0.6),
    score,
    sharedWords
  };
}

function getSimilarReportGroups(moments) {
  const groups = [];

  moments.forEach(moment => {
    let bestGroup = null;
    let bestScore = 0;

    groups.forEach(group => {
      const comparisons = group.moments.map(compareMoment =>
        compareReportWording(moment.report, compareMoment.report)
      );
      if (comparisons.every(comparison => comparison.similar)) {
        const groupScore = Math.min(...comparisons.map(comparison => comparison.score));
        if (groupScore > bestScore) {
          bestGroup = group;
          bestScore = groupScore;
        }
      }
    });

    if (bestGroup) {
      bestGroup.moments.push(moment);
    } else {
      groups.push({ moments: [moment] });
    }
  });

  return groups
    .map(group => {
      const wordingCounts = new Map();
      group.moments.forEach(moment => {
        const wording = normalizeRawReport(moment.report);
        wordingCounts.set(wording, (wordingCounts.get(wording) || 0) + 1);
      });
      const normalizedReports = new Set(wordingCounts.keys());
      const sharedWords = group.moments
        .map(moment => getReportTokens(moment.report))
        .reduce((shared, tokens) => shared.filter(token => tokens.includes(token)))
        .sort((a, b) => a.localeCompare(b));
      return {
        ...group,
        exact: normalizedReports.size === 1,
        mostFrequentWordingCount: Math.max(...wordingCounts.values()),
        sharedWords,
        latestAt: Math.max(...group.moments.map(moment => moment.createdAt))
      };
    })
    .sort((a, b) => b.moments.length - a.moments.length || b.latestAt - a.latestAt);
}

function getFrequentFeelings(entries) {
  const counts = new Map();
  entries.forEach(entry => {
    const labelsInEntry = new Set();
    String(entry.state || '').split(',').map(value => value.trim()).filter(Boolean).forEach(value => {
      const key = value.toLocaleLowerCase();
      if (labelsInEntry.has(key)) return;
      labelsInEntry.add(key);
      const current = counts.get(key) || { label: value, count: 0 };
      current.count += 1;
      counts.set(key, current);
    });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function getFrequentReportWords(moments) {
  const counts = new Map();
  moments.forEach(moment => {
    getReportTokens(moment.report).forEach(word => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);
}

function createFrequencyList(items, limit = 6) {
  const list = document.createElement('ol');
  list.className = 'frequency-list';
  items.slice(0, limit).forEach(item => {
    const row = document.createElement('li');
    row.className = 'frequency-item';
    const label = document.createElement('span');
    label.textContent = item.label || item.word;
    const count = document.createElement('b');
    count.textContent = String(item.count);
    row.append(label, count);
    list.append(row);
  });
  return list;
}

function createAnalysisGuide() {
  const guide = document.createElement('details');
  guide.className = 'analysis-guide';
  guide.open = true;

  const summary = document.createElement('summary');
  summary.textContent = 'How to read these results';
  summary.append(' ', createBookCitation(6, 'pages 20–22'));
  const body = document.createElement('div');
  body.className = 'analysis-guide-body';

  const label = document.createElement('span');
  label.className = 'example-label';
  label.textContent = 'CONSTRUCTED EXAMPLE · NOT FROM YOUR ENTRIES';
  const title = document.createElement('h4');
  title.textContent = 'One sensed signal, three different interpretations.';
  title.append(' ', createBookCitation(6, 'page 20'));
  const count = document.createElement('p');
  count.className = 'analysis-result-count';
  count.textContent = 'Example result · 4 related signal reports · 3 exact repeats · 3 interpretations attached';
  const quote = document.createElement('blockquote');
  quote.textContent = 'Signal description: My shoulders rose when the meeting began.';

  const stories = document.createElement('div');
  stories.className = 'report-story-list analysis-example-stories';
  [
    ['Beginning', 'They will notice that I do not know enough.'],
    ['Return 01', 'I must prove that I am prepared.'],
    ['Return 02', 'I noticed my shoulders before the story arrived.']
  ].forEach(([sourceLabel, storyLabel]) => {
    const story = document.createElement('div');
    story.className = 'report-story';
    const source = document.createElement('span');
    source.className = 'story-source';
    source.textContent = sourceLabel;
    source.append(' ', createBookCitation(6, 'page 20'));
    const storyText = document.createElement('p');
    storyText.textContent = `Attached interpretation: “${storyLabel}”`;
    story.append(source, storyText);
    stories.append(story);
  });

  const supportsTitle = document.createElement('h5');
  supportsTitle.textContent = 'What this example supports';
  const supports = document.createElement('ul');
  supports.className = 'analysis-points';
  [
    'The words used to describe the signal stayed similar enough to compare.',
    'The interpretations attached to those words changed across the saved moments.',
    'The next useful question is what changed when the interpretation changed.'
  ].forEach(point => {
    const item = document.createElement('li');
    item.textContent = point;
    supports.append(item);
  });

  const limit = document.createElement('p');
  limit.className = 'analysis-example-limit';
  limit.textContent = 'The body reports a signal; the words are an interpretation attached afterward. This example cannot show what caused the shoulders to rise, what the cells communicated, whether the sensation meant the same thing each time, or which interpretation is true. It shows only what can be compared without going beyond the saved descriptions.';

  const userTitle = document.createElement('h5');
  userTitle.textContent = 'What this means for you using the journal';
  const userGuide = document.createElement('ul');
  userGuide.className = 'analysis-points';
  [
    'The signal belongs to the body. It is not a sentence, diagnosis, or verdict.',
    'You describe that signal in human words because the journal cannot record the cellular signal itself.',
    'Your mind may then attach an interpretation or story. That language is part of the experience, but it is not the original signal.',
    'The analysis can show repeated wording, dates, and interpretation changes. Only you can decide what those observations mean for you.'
  ].forEach(point => {
    const item = document.createElement('li');
    item.textContent = point;
    userGuide.append(item);
  });

  const prompt = document.createElement('p');
  prompt.className = 'analysis-carry-question';
  prompt.textContent = 'Question to carry: When the signal description stayed similar, what changed in the interpretation—and what changed in what you did next?';

  body.append(label, title, count, quote, stories, supportsTitle, supports, limit, userTitle, userGuide, prompt);
  guide.append(summary, body);
  return guide;
}

function getAttentionTrailCycles(entries) {
  const cycles = [];

  entries.forEach(entry => {
    const returns = [...(entry.returns || [])];
    const turns = [
      {
        source: 'Beginning',
        createdAt: entry.createdAt,
        attention: String(entry.attention || '').trim(),
        signal: String(entry.observation || '').trim(),
        firstStory: String(entry.meaning || '').trim(),
        alternativeStory: String(entry.alternativeStory || '').trim(),
        chosenStory: String(entry.chosenStory || '').trim(),
        evidence: String(entry.evidence || '').trim(),
        action: String(entry.practice || '').trim()
      },
      ...returns.map((item, index) => ({
        source: `Return ${String(index + 1).padStart(2, '0')}`,
        createdAt: item.createdAt,
        attention: String(item.attention || '').trim(),
        signal: String(item.observation || '').trim(),
        firstStory: String(item.meaning || '').trim(),
        alternativeStory: String(item.alternativeStory || '').trim(),
        chosenStory: String(item.chosenStory || '').trim(),
        evidence: String(item.evidence || '').trim(),
        action: String(item.practice || '').trim()
      }))
    ];

    turns.forEach((turn, index) => {
      turn.laterObservation = String(returns[index]?.returnObservation || '').trim();
      cycles.push(turn);
    });
  });

  return cycles.sort((a, b) => a.createdAt - b.createdAt);
}

function addTrailField(parent, label, value, emptyText = 'Not recorded in this turn.') {
  const safeValue = String(value || '').trim();
  addText(parent, label, safeValue || emptyText);
}

function createAttentionTrail(entries) {
  const section = document.createElement('section');
  section.className = 'attention-trail';
  const title = document.createElement('h4');
  title.className = 'global-section-title';
  title.textContent = 'The path attention took';
  title.append(' ', createBookCitation(5, 'page 12'), ' ', createBookCitation(6, 'pages 20–22'));
  const explanation = document.createElement('p');
  explanation.className = 'comparison-explanation';
  explanation.textContent = 'These are your saved turns shown in order. Read the raw feeling first, then the story attached to it, what you chose to carry, what you did, and how the carried story felt when you returned. The page does not score the sequence or supply the meaning.';
  section.append(title, explanation);

  const cycles = getAttentionTrailCycles(entries);
  if (!cycles.length) {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'The trail will appear after the first returning-journal turn is saved.';
    section.append(empty);
    return section;
  }

  const list = document.createElement('div');
  list.className = 'attention-trail-list';
  cycles.forEach((cycle, index) => {
    const details = document.createElement('details');
    details.className = 'attention-trail-turn';
    details.open = index === cycles.length - 1;
    const summary = document.createElement('summary');
    summary.textContent = `${cycle.source} · ${formatDate(cycle.createdAt)}`;
    const body = document.createElement('div');
    body.className = 'attention-trail-copy';
    addTrailField(body, 'CHOSEN ATTENTION', cycle.attention, 'No point of attention was recorded.');
    addTrailField(body, 'SIGNAL BEFORE STORY · O(0)', cycle.signal, 'No signal report was recorded.');
    addTrailField(body, 'FIRST STORY THAT ARRIVED · O(1)', cycle.firstStory, 'No first interpretation was recorded.');
    addTrailField(body, 'ALTERNATIVE OR LEFT OPEN', cycle.alternativeStory, 'No alternative was written; the meaning remained open.');
    addTrailField(body, 'STORY CHOSEN TO CARRY', cycle.chosenStory, 'No story was chosen in this turn.');
    addTrailField(body, 'TEST OR OBSERVATION', cycle.evidence, 'No test or observation was recorded.');
    addTrailField(body, 'SMALL ACTION', cycle.action, 'No action was recorded.');
    addTrailField(body, 'HOW THE CHOSEN STORY FELT AFTERWARD · NEXT RETURN', cycle.laterObservation, index === cycles.length - 1 ? 'This turn has not been returned to yet.' : 'No feeling or later observation was recorded after this turn.');
    details.append(summary, body);
    list.append(details);
  });
  section.append(list);

  const completed = cycles.filter(cycle => cycle.laterObservation).length;
  const question = document.createElement('p');
  question.className = 'analysis-carry-question';
  question.textContent = completed
    ? `You have recorded ${completed} return${completed === 1 ? '' : 's'} after a carried story. Read the trail from beginning to end: what felt different afterward, what stayed the same, and which possible explanation fits the record without ignoring alternatives?`
    : 'No turn has been returned to yet. The spiral has not reached the point where it can show what came afterward. Make a small next turn, then return and begin with how that story felt.';
  section.append(question);
  return section;
}

function createInfluenceGuide() {
  const section = document.createElement('section');
  section.className = 'influence-guide';
  const title = document.createElement('h4');
  title.className = 'global-section-title';
  title.textContent = 'Notice how a story may influence what comes next';
  title.append(' ', createBookCitation(3, 'page 10'), ' ', createBookCitation(5, 'page 12'));
  const introduction = document.createElement('p');
  introduction.className = 'comparison-explanation';
  introduction.textContent = 'A story can change what you notice, how a feeling is understood, which action feels possible, and how you meet the next moment. The same bodily signal may also receive the same story with no clear change, or a different story with no clear change. Your notes can suggest possibilities; they cannot prove that a story caused an event, a feeling, or the world around you.';
  const list = document.createElement('ul');
  list.className = 'analysis-points influence-points';
  [
    'Read the raw sensation before the interpretation. Notice whether the description of the feeling changed when the story changed.',
    'Read the next return before today’s new story. Notice how carrying the previous story felt afterward, what you did, and what happened independently of your explanation.',
    'Look for both coherence and exceptions. A recurring story may be meaningful without being true of every situation.',
    'Keep alternative explanations visible: bodily health, sleep, environment, other people, chance, ordinary events, and needs that deserve real support.',
    'Leave the conclusion open enough to be corrected by the next observation. The record may show where attention and story seem to shape experience—or where they do not—without becoming a verdict about reality.'
  ].forEach(point => {
    const item = document.createElement('li');
    item.textContent = point;
    list.append(item);
  });
  const prompt = document.createElement('p');
  prompt.className = 'analysis-carry-question';
  prompt.textContent = 'Carry one question, not a prescription: What changed in how I felt or acted when I held a different story, and what alternative explanation does this record still allow?';
  section.append(title, introduction, list, prompt);
  return section;
}

function renderGlobalComparison() {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
  const moments = getReportMoments(entries);
  const groups = getSimilarReportGroups(moments);
  const storyCount = moments.filter(moment => moment.story).length;
  const attentionCount = moments.filter(moment => moment.attention).length;
  const returnObservationCount = entries.reduce((total, entry) => total + (entry.returns || [])
    .filter(item => String(item.returnObservation || '').trim())
    .length, 0);
  const feelings = getFrequentFeelings(entries);
  const reportWords = getFrequentReportWords(moments).map(([word, count]) => ({ word, count }));

  globalComparison.replaceChildren();

  const headingRow = document.createElement('div');
  headingRow.className = 'global-comparison-head';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'ACROSS THE WHOLE SPIRAL';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'global-comparison-close';
  closeButton.textContent = 'Close examination ↑';
  closeButton.setAttribute('aria-label', 'Close the attention trail examination');
  closeButton.addEventListener('click', () => setGlobalComparisonOpen(false));
  headingRow.append(eyebrow, closeButton);
  const title = document.createElement('h3');
  title.textContent = 'What returns when the notes gather.';
  const summary = document.createElement('p');
  summary.className = 'comparison-summary';
  summary.textContent = `${entries.length} saved journal${entries.length === 1 ? '' : 's'} · ${attentionCount} chosen point${attentionCount === 1 ? '' : 's'} of attention · ${moments.length} raw-feeling report${moments.length === 1 ? '' : 's'} · ${storyCount} first interpretation${storyCount === 1 ? '' : 's'} · ${returnObservationCount} felt aftermath${returnObservationCount === 1 ? '' : 's'}.`;
  const explanation = document.createElement('p');
  explanation.className = 'comparison-explanation';
  explanation.textContent = 'You opened this reflection deliberately. Read it slowly. The body sends a signal before it becomes human language; every saved “signal report” is already your description of that experience. The interpretation is the story attached afterward. The analysis can notice repetition, difference, feeling, action, and sequence. It cannot tell you what the cells communicated, what caused the signal, which story is ultimately true, or how you should live.';
  explanation.append(' ', createBookCitation(6, 'pages 15, 20'));
  globalComparison.append(headingRow, title, summary, explanation);
  globalComparison.append(createAttentionTrail(entries));
  globalComparison.append(createInfluenceGuide());

  const relatedHeading = document.createElement('h4');
  relatedHeading.className = 'global-section-title';
  relatedHeading.textContent = 'Signal reports and the interpretations gathered around them';
  relatedHeading.append(' ', createBookCitation(6, 'page 20'));
  globalComparison.append(relatedHeading);

  if (!moments.length) {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No signal reports have been saved yet. Recurring feeling labels and wording will appear here as the notes accumulate.';
    globalComparison.append(empty);
  } else {
    const groupList = document.createElement('div');
    groupList.className = 'repeated-report-list';
    groups.forEach(group => {
      const article = document.createElement('article');
      article.className = 'repeated-report global-report-group';
      article.classList.toggle('is-singleton', group.moments.length === 1);
      const heading = document.createElement('p');
      heading.className = 'repeated-report-count';
      const attachedStories = group.moments.filter(moment => moment.story).length;
      const reportLabel = group.moments.length === 1
        ? '1 signal report · no close wording match yet'
        : group.exact
          ? `${group.moments.length} exact signal reports`
          : `${group.moments.length} closely worded signal reports${group.mostFrequentWordingCount > 1 ? `, including ${group.mostFrequentWordingCount} exact repeats` : ''}`;
      heading.textContent = `${reportLabel} · ${attachedStories} interpretation${attachedStories === 1 ? '' : 's'} attached`;
      heading.append(' ', createBookCitation(6, 'page 20'));
      const quote = document.createElement('blockquote');
      quote.textContent = group.moments[0].report;
      article.append(heading, quote);

      if (!group.exact && group.sharedWords.length) {
        const shared = document.createElement('p');
        shared.className = 'shared-report-words';
        shared.textContent = `Significant words common to every report in this group: ${group.sharedWords.join(', ')}.`;
        article.append(shared);
      }

      const reports = document.createElement('div');
      reports.className = 'report-story-list';
      group.moments.forEach(moment => {
        const item = document.createElement('div');
        item.className = 'report-story global-report-moment';
        const source = document.createElement('span');
        source.className = 'story-source';
        source.textContent = `${moment.source} · ${formatDate(moment.createdAt)}`;
        const report = document.createElement('p');
        report.className = 'global-moment-report';
        report.textContent = `Signal description: “${moment.report}”`;
        const story = document.createElement('p');
        story.textContent = moment.story ? `Attached interpretation: “${moment.story}”` : 'No interpretation was written with this signal report.';
        if (!moment.story) story.classList.add('missing-story');
        item.append(source, report, story);
        reports.append(item);
      });
      article.append(reports);
      groupList.append(article);
    });
    globalComparison.append(groupList);
  }

  const insights = document.createElement('div');
  insights.className = 'global-insights';

  const feelingSection = document.createElement('section');
  feelingSection.className = 'global-insight';
  const feelingTitle = document.createElement('h4');
  feelingTitle.textContent = 'Feeling labels named most often';
  feelingTitle.append(' ', createBookCitation(5, 'page 8'));
  feelingSection.append(feelingTitle);
  if (feelings.length) {
    const feelingNote = document.createElement('p');
    feelingNote.className = 'comparison-empty';
    feelingNote.textContent = 'Counted once per saved journal, even when a label appears twice in one entry.';
    feelingSection.append(feelingNote);
    feelingSection.append(createFrequencyList(feelings));
  } else {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No feeling descriptions have been saved yet.';
    feelingSection.append(empty);
  }

  const wordSection = document.createElement('section');
  wordSection.className = 'global-insight';
  const wordTitle = document.createElement('h4');
  wordTitle.textContent = 'Words recurring across signal descriptions';
  wordTitle.append(' ', createBookCitation(6, 'page 20'));
  wordSection.append(wordTitle);
  if (reportWords.length) {
    const wordList = createFrequencyList(reportWords, 10);
    wordList.classList.add('word-frequency-list');
    wordSection.append(wordList);
  } else {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No significant words repeat across signal descriptions yet.';
    wordSection.append(empty);
  }

  insights.append(feelingSection, wordSection);
  globalComparison.append(insights);
  globalComparison.append(createAnalysisGuide());

  const limit = document.createElement('p');
  limit.className = 'global-comparison-limit';
  limit.textContent = 'These are transparent counts of the words used in your human-language descriptions. They do not reveal what the body or cells “said,” diagnose, assign causes, or decide what the repetition means.';
  const closeButtonAtEnd = closeButton.cloneNode(true);
  closeButtonAtEnd.textContent = 'Close examination ↑';
  closeButtonAtEnd.addEventListener('click', () => setGlobalComparisonOpen(false));
  globalComparison.append(limit, closeButtonAtEnd);
}

function makeReturnButton(entry) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'spiral-return';
  button.setAttribute('aria-label', `Return to journal entry from ${formatDate(entry.createdAt)}`);
  const image = document.createElement('img');
  image.src = 'assets/return-spiral-mark.svg';
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = 'Return';
  button.append(image, label);
  button.addEventListener('click', () => startReturn(entry.id));
  return button;
}

function renderReturnDetail(entry, item, index, openReturnId) {
  const listItem = document.createElement('li');
  listItem.className = 'return-history-list-item';
  const details = document.createElement('details');
  details.className = 'return-history-item';
  details.dataset.returnId = item.id;
  details.open = item.id === openReturnId;
  const summary = document.createElement('summary');
  const number = document.createElement('span');
  number.className = 'return-history-number';
  number.textContent = `Return ${index + 1} of ${entry.returns.length}`;
  const timestamp = document.createElement('time');
  timestamp.className = 'return-history-time';
  timestamp.dateTime = new Date(item.createdAt).toISOString();
  timestamp.textContent = formatDate(item.createdAt);
  summary.append(number, timestamp);
  details.append(summary);
  const content = document.createElement('div');
  content.className = 'return-history-copy';
  addText(content, 'HOW THE LAST STORY FELT AFTERWARD · WHAT FOLLOWED', item.returnObservation, [{ book: 5, page: 'page 12' }]);
  addText(content, 'CHOSEN ATTENTION', item.attention);
  addText(content, 'SIGNAL REPORT NOW · O(0)', item.observation);
  addText(content, 'INTERPRETATION / STORY NOW · O(1)', item.meaning);
  addText(content, 'ALTERNATIVE OR REMAINED OPEN', item.alternativeStory);
  addText(content, 'STORY CHOSEN TO CARRY', item.chosenStory);
  addText(content, 'TEST OR OBSERVATION', item.evidence);
  addText(content, 'WIDER MEMORY · O(n)', item.context);
  addText(content, 'SMALL ACTION', item.practice, [{ book: 6, page: 'page 22' }]);
  details.append(content);
  listItem.append(details);
  return listItem;
}

function renderEntries(openReturnId = null) {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
  memoryList.replaceChildren();
  emptyNote.hidden = entries.length > 0;
  clearButton.hidden = entries.length === 0;
  compareAllButton.textContent = 'I have written enough — examine what I may have learned';
  compareAllButton.setAttribute('aria-expanded', 'false');
  globalComparison.hidden = true;
  globalComparison.replaceChildren();
  attentionMessage.hidden = true;

  entries.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.dataset.entryId = entry.id;

    const header = document.createElement('header');
    const date = document.createElement('time');
    date.dateTime = new Date(entry.createdAt).toISOString();
    date.textContent = `Entry · ${formatDate(entry.createdAt)}`;
    header.append(date);
    if (entry.state) {
      const state = document.createElement('span');
      state.className = 'memory-state';
      state.textContent = entry.state;
      header.append(state);
    }
    header.append(makeReturnButton(entry));
    card.append(header);

    const beginning = document.createElement('details');
    beginning.className = 'beginning-note';
    beginning.open = false;
    const beginningSummary = document.createElement('summary');
    beginningSummary.textContent = 'Open the original entry';
    beginning.append(beginningSummary);
    const beginningContent = document.createElement('div');
    beginningContent.className = 'beginning-note-copy';
    addText(beginningContent, 'LEGACY PRIVATE NOTE · BOOK ONE', entry.beginningNote, [{ book: 1, page: 'pages 12–13' }]);
    addText(beginningContent, 'CHOSEN ATTENTION', entry.attention);
    addText(beginningContent, 'SIGNAL REPORT · O(0)', entry.observation);
    addText(beginningContent, 'FIRST INTERPRETATION / STORY · O(1)', entry.meaning);
    addText(beginningContent, 'ALTERNATIVE OR REMAINED OPEN', entry.alternativeStory);
    addText(beginningContent, 'STORY CHOSEN TO CARRY', entry.chosenStory);
    addText(beginningContent, 'TEST OR OBSERVATION', entry.evidence);
    addText(beginningContent, 'WIDER MEMORY · O(n)', entry.context);
    addText(beginningContent, 'SMALL ACTION', entry.practice, [{ book: 6, page: 'page 22' }]);
    const storyLink = getStoryLink(entry.storyId);
    if (storyLink) beginningContent.append(storyLink);
    beginning.append(beginningContent);
    card.append(beginning);

    if ((entry.returns || []).length) {
      const returnList = document.createElement('ol');
      returnList.className = 'return-history-list';
      returnList.setAttribute('aria-label', 'Numbered returns with dates and times');
      entry.returns.forEach((item, index) => returnList.append(renderReturnDetail(entry, item, index, openReturnId)));
      card.append(returnList);
    }

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-entry';
    remove.textContent = 'Remove this entry';
    remove.addEventListener('click', async () => {
      try {
        await writeEntries(readEntries().filter(item => item.id !== entry.id));
        renderEntries();
        showToast('Entry removed from this device.');
      } catch {
        showToast('This browser could not remove the saved entry.');
      }
    });
    card.append(remove);
    memoryList.append(card);
  });
  updateStorageUi(entries.length);
  updateExaminationGate();
}

function updateExaminationGate() {
  const requiredReturns = 7;
  const completed = getAttentionTrailCycles(readEntries())
    .filter(cycle => cycle.laterObservation)
    .length;
  const ready = completed >= requiredReturns;
  examinationGate.hidden = false;
  examinationGate.classList.toggle('is-ready', ready);
  compareAllButton.hidden = false;
  compareAllButton.disabled = !ready;
  examinationOrbitNodes.forEach((node, index) => {
    node.classList.toggle('is-complete', index < Math.min(completed, requiredReturns));
  });

  if (!ready) {
    examinationEyebrow.textContent = 'YOUR ATTENTION TRAIL · IN FORMATION';
    examinationTitle.textContent = 'Seven completed returns reveal the pattern of your attention.';
    compareAllButton.textContent = completed
      ? `Examination unlocks at return seven · ${completed} recorded`
      : 'Examination unlocks at return seven';
    examinationProgress.textContent = `${completed} of ${requiredReturns} completed returns recorded. The examination unlocks after return seven.`;
    attentionProgress.textContent = '';
    return;
  }

  examinationEyebrow.textContent = 'SEVEN RETURNS · READY TO EXAMINE';
  examinationTitle.textContent = 'Your attention trail is ready to be examined.';
  compareAllButton.textContent = globalComparison.hidden
    ? 'Examine your attention trail · seven returns ready'
    : 'Close what I found';
  examinationProgress.textContent = completed === requiredReturns
    ? 'Seven completed returns are ready. Nothing opens until you press the button above. You can keep returning if you want more of the spiral in the record.'
    : `${completed} completed returns are ready. Nothing opens until you press the button above. You can keep returning if you want more of the spiral in the record.`;
  attentionProgress.textContent = `You have returned ${completed} times and written what followed the stories you carried. Read the sequence before accepting any explanation—including this one.`;
  attentionCopy.textContent = 'Notice the raw feeling before its story. Then notice how carrying a particular interpretation seemed to affect what you felt, chose, and did next. The record can reveal possible influence, repetition, and exceptions without proving a cause or deciding what reality must mean.';
}

const defaultStorageNote = 'Saved entries stay in this browser on this device. Add a PIN to encrypt them at rest. The private clearing page above is never saved here.';
const encryptedStorageNote = 'Saved entries are encrypted at rest with your PIN. They stay in this browser, do not sync, and must be unlocked again after this session.';

function setMemoryFormEnabled(enabled) {
  [...form.elements].forEach(control => {
    control.disabled = !enabled;
  });
}

function updateStorageUi(entryCount) {
  const cryptoReady = Boolean(globalThis.crypto?.subtle);
  unlockEntriesButton.hidden = !storageLocked;
  storageSecurity.hidden = storageLocked || !cryptoReady;
  unlockEntriesButton.textContent = 'Unlock with PIN';
  storageSecurity.textContent = storageEnvelope ? 'Lock now' : 'Protect with PIN';
  storageSecurity.setAttribute('aria-label', storageEnvelope
    ? 'Lock the encrypted journal'
    : entryCount
      ? 'Protect saved entries with a PIN'
      : 'Set PIN protection before saving');
  storageNote.textContent = storageEnvelope ? encryptedStorageNote : defaultStorageNote;
}

function renderLockedState() {
  setMemoryFormEnabled(false);
  form.hidden = true;
  emptyNote.hidden = true;
  memoryList.replaceChildren();
  const note = document.createElement('p');
  note.className = 'storage-locked-note';
  note.textContent = 'Saved entries are encrypted and hidden. Unlock them with your PIN to read, add, or remove entries.';
  memoryList.append(note);
  clearButton.hidden = true;
  examinationGate.hidden = true;
  compareAllButton.hidden = true;
  globalComparison.hidden = true;
  attentionMessage.hidden = true;
  storageSecurity.hidden = true;
  unlockEntriesButton.hidden = false;
  storageNote.textContent = 'Your saved entries are encrypted and locked for this session.';
}

function showPinError(message) {
  pinError.textContent = message;
  pinError.hidden = !message;
}

function openPinDialog(mode) {
  pinDialogMode = mode;
  pinForm.reset();
  showPinError('');
  const creating = mode === 'create';
  pinTitle.textContent = creating ? 'Protect your spiral.' : 'Open your spiral.';
  pinIntro.textContent = creating
    ? 'A PIN keeps saved entries from opening casually in this browser. It cannot protect a compromised device or recover a forgotten PIN.'
    : 'Enter your PIN to decrypt this browser\'s saved entries for this session. If you protected them before this PIN update, use your existing passphrase.';
  pinLabel.textContent = creating ? 'CREATE A PIN' : 'ENTER PIN OR EXISTING PASSPHRASE';
  pinHelp.textContent = creating
    ? 'Use 6 to 32 digits. A longer PIN is harder to guess.'
    : 'For entries created with the PIN update, enter the numeric PIN only.';
  pinConfirmField.hidden = !creating;
  pinConfirm.required = creating;
  pinValue.autocomplete = creating ? 'new-password' : 'current-password';
  pinValue.inputMode = creating ? 'numeric' : 'text';
  pinValue.maxLength = creating ? 32 : 128;
  pinValue.minLength = creating ? 6 : 1;
  pinValue.toggleAttribute('pattern', creating);
  if (creating) pinValue.setAttribute('pattern', '[0-9]{6,32}');
  pinValue.required = true;
  pinSubmit.textContent = creating ? 'Protect and lock' : 'Unlock entries';
  if (!pinDialog.open) pinDialog.showModal();
  requestAnimationFrame(() => pinValue.focus());
}

function closePinDialog() {
  pinForm.reset();
  showPinError('');
  if (pinDialog.open) pinDialog.close();
}

async function protectExistingEntries(pin) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('This browser cannot provide application-level encryption on this page.');
  }
  const protectedEntryCount = entriesCache.length;
  try {
    const result = await createStorageEnvelope(entriesCache, pin);
    storageEnvelope = result.envelope;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageEnvelope));
    storageKey = null;
    entriesCache = [];
    storageLocked = true;
    renderLockedState();
    return protectedEntryCount;
  } catch {
    throw new Error('The entries could not be encrypted. Nothing was changed.');
  }
}

async function unlockSavedEntries(pin) {
  if (!storageEnvelope) throw new Error('There are no encrypted entries to unlock.');
  try {
    const result = await decryptStorageEnvelope(storageEnvelope, pin);
    entriesCache = result.entries;
    const oldIterations = Number(storageEnvelope.iterations);
    if (!Number.isFinite(oldIterations) || oldIterations < PBKDF2_ITERATIONS) {
      const upgraded = await createStorageEnvelope(entriesCache, pin);
      storageEnvelope = upgraded.envelope;
      storageKey = upgraded.key;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageEnvelope));
    } else {
      storageKey = result.key;
    }
    storageLocked = false;
    form.hidden = false;
    setMemoryFormEnabled(true);
    startBeginning();
    renderEntries();
    showToast('Saved entries unlocked for this session.');
  } catch {
    throw new Error('That PIN did not unlock the saved entries. If they predate PIN protection, try the original passphrase.');
  }
}

pinForm.addEventListener('submit', async event => {
  event.preventDefault();
  showPinError('');
  const enteredPin = pinValue.value;
  if (pinDialogMode === 'create') {
    if (!/^[0-9]{6,32}$/.test(enteredPin)) {
      showPinError('Use 6 to 32 digits for the PIN.');
      pinValue.focus();
      return;
    }
    if (enteredPin !== pinConfirm.value) {
      showPinError('The PINs do not match.');
      pinConfirm.focus();
      pinConfirm.select();
      return;
    }
  } else if (!enteredPin) {
    showPinError('Enter your PIN or existing passphrase.');
    pinValue.focus();
    return;
  }

  pinSubmit.disabled = true;
  pinSubmit.textContent = pinDialogMode === 'create' ? 'Protecting...' : 'Unlocking...';
  try {
    if (pinDialogMode === 'create') {
      const protectedEntryCount = await protectExistingEntries(enteredPin);
      closePinDialog();
      showToast(protectedEntryCount
        ? 'Saved entries encrypted and locked. Use your PIN to reopen them.'
        : 'PIN protection is ready. Unlock first, then add your first private entry.');
    } else {
      await unlockSavedEntries(enteredPin);
      closePinDialog();
    }
  } catch (error) {
    showPinError(error.message || 'The saved entries could not be opened.');
    pinValue.focus();
    pinValue.select();
  } finally {
    pinSubmit.disabled = false;
    pinSubmit.textContent = pinDialogMode === 'create' ? 'Protect and lock' : 'Unlock entries';
  }
});

pinCancel.addEventListener('click', closePinDialog);
pinCancelIcon.addEventListener('click', closePinDialog);
pinDialog.addEventListener('close', () => pinForm.reset());

storageSecurity.addEventListener('click', async () => {
  if (storageEnvelope && storageKey) {
    if (!window.confirm('Lock the encrypted journal now?')) return;
    storageKey = null;
    entriesCache = [];
    storageLocked = true;
    renderLockedState();
    showToast('Encrypted entries locked.');
    return;
  }
  openPinDialog('create');
});

unlockEntriesButton.addEventListener('click', () => openPinDialog('unlock'));

function setGlobalComparisonOpen(open) {
  if (!open) {
    globalComparison.hidden = true;
    attentionMessage.hidden = true;
    compareAllButton.textContent = 'Examine your attention trail · seven returns ready';
    compareAllButton.setAttribute('aria-expanded', 'false');
    examinationGate.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    compareAllButton.focus({ preventScroll: true });
    return;
  }

  renderGlobalComparison();
  globalComparison.hidden = false;
  attentionMessage.hidden = false;
  compareAllButton.textContent = 'Close what I found';
  compareAllButton.setAttribute('aria-expanded', 'true');
  globalComparison.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

compareAllButton.addEventListener('click', () => {
  if (compareAllButton.disabled) return;
  setGlobalComparisonOpen(globalComparison.hidden);
});

function renderAnchor(entry) {
  returnAnchor.replaceChildren();
  const heading = document.createElement('p');
  heading.className = 'eyebrow';
  heading.textContent = 'RETURNING TO THE ORIGINAL ENTRY';
  const title = document.createElement('h3');
  title.textContent = 'The original signal report stays here.';
  const leave = document.createElement('button');
  leave.type = 'button';
  leave.className = 'leave-return';
  leave.textContent = 'Leave this return';
  leave.addEventListener('click', startBeginning);
  returnAnchor.append(heading, title, leave);
  addText(returnAnchor, 'CHOSEN ATTENTION', entry.attention || 'No point of attention was saved in the original entry.');
  addText(returnAnchor, 'ORIGINAL SIGNAL REPORT · O(0)', entry.observation || 'No signal report was saved in the original entry. You may add your first one now.', [{ book: 1, page: 'page 12' }]);
  addText(returnAnchor, 'FIRST INTERPRETATION / STORY · O(1)', entry.meaning || 'No first interpretation was saved. Meaning can remain open.', [{ book: 1, page: 'page 12' }]);
  addText(returnAnchor, 'STORY CHOSEN TO CARRY', entry.chosenStory || 'No story was chosen in the original entry.');
  const storyLink = getStoryLink(entry.storyId);
  if (storyLink) returnAnchor.append(storyLink);
}

function setFieldText(id, label, hint) {
  const labelNode = document.getElementById(`${id}Label`);
  const hintNode = document.getElementById(`${id}Hint`);
  if (labelNode) {
    labelNode.replaceChildren();
    if (label instanceof Node) labelNode.append(label);
    else labelNode.textContent = label;
  }
  if (hintNode) hintNode.textContent = hint;
}

function createFieldLabel(number, text, concept) {
  const fragment = document.createDocumentFragment();
  const marker = document.createElement('b');
  marker.textContent = number;
  const conceptLink = document.createElement('a');
  conceptLink.className = 'book-reference';
  conceptLink.href = getBookHref(6);
  conceptLink.textContent = concept;
  fragment.append(
    marker,
    ` ${text} · `,
    conceptLink,
    ' ',
    createBookCitation(6, 'pages 15, 20')
  );
  return fragment;
}

function setSaveButton(label) {
  const button = document.getElementById('saveButton');
  const arrow = document.createElement('span');
  arrow.textContent = '↗';
  button.replaceChildren(`${label} `, arrow);
}

function setModeEyebrow(prefix, bookNumber, bookLabel, pageLabel) {
  const node = document.getElementById('modeEyebrow');
  const link = document.createElement('a');
  link.className = 'book-reference';
  link.href = getBookHref(bookNumber);
  link.textContent = `${bookLabel} (book ${bookNumber}, ${pageLabel}) ↗`;
  node.replaceChildren(`${prefix} · `, link);
}

function clearObservationError() {
  observationInput.removeAttribute('aria-invalid');
  observationError.hidden = true;
}

function requireRawReport() {
  if (String(observationInput.value || '').trim()) {
    clearObservationError();
    return true;
  }
  observationInput.setAttribute('aria-invalid', 'true');
  observationError.hidden = false;
  const observationIndex = getVisibleSpiralStages().indexOf(observationStage);
  showSpiralStage(observationIndex, true);
  observationInput.focus({ preventScroll: true });
  showToast('Write a raw-feeling report before saving this turn.');
  return false;
}

observationInput.addEventListener('input', () => {
  if (observationInput.value.trim()) clearObservationError();
});

function startBeginning() {
  formMode = 'beginning';
  activeEntryId = null;
  returnAnchor.hidden = true;
  returnAnchor.replaceChildren();
  journalMode.hidden = false;
  stateField.hidden = false;
  setModeEyebrow('RETURNING JOURNAL · ENTRY 01', 6, 'BOOK SIX', 'pages 20–22');
  document.getElementById('journalTitle').textContent = 'Begin the returning journal.';
  document.getElementById('journalInstructions').textContent = 'Move through the spiral one turn at a time. Notice the raw bodily feeling before the mind explains it, then catch the story attached to that feeling. Return across ordinary days; each later turn begins with how the previous story felt afterward.';
  setFieldText('observation', createFieldLabel('02', 'Raw feeling', 'O(0)'), 'Describe the feeling itself in your own words—pressure, heat, tingling, movement, stillness, or anything else—before explaining why it is there. The body sends a signal; your words are a human-language description of it. This report is required before the entry can be saved.');
  setFieldText('meaning', createFieldLabel('03', 'Meaning attached', 'O(1)'), 'What story, emotion, prediction, or explanation did your mind attach to the feeling? Write the interpretation as it arrived. It is real as an experience, but its meaning can remain open.');
  setSaveButton('Save this entry');
  form.reset();
  clearObservationError();
  syncStatePresets();
  updateSelectedStory();
  showSpiralStage(0);
}

function startReturn(entryId) {
  const entry = readEntries().find(item => item.id === entryId);
  if (!entry) return;
  formMode = 'return';
  activeEntryId = entryId;
  form.reset();
  clearObservationError();
  journalMode.hidden = false;
  stateField.hidden = true;
  setModeEyebrow(`RETURN ${((entry.returns || []).length + 1).toString().padStart(2, '0')}`, 6, 'BOOK SIX', 'pages 20–22');
  document.getElementById('journalTitle').textContent = 'Set today beside the first note.';
  document.getElementById('journalInstructions').textContent = 'Begin with how the story you carried last time felt afterward. Then choose today’s attention, describe the raw feeling before its meaning, catch the new story, and continue the practice across ordinary days.';
  setFieldText('observation', createFieldLabel('02', 'Raw feeling now', 'O(0)'), 'Describe what you feel directly now, before explaining it. Use your own words for the bodily experience. The description is yours; it is not the signal itself. This report is required before the return can be saved.');
  setFieldText('meaning', createFieldLabel('03', 'Meaning attached now', 'O(1)'), 'What story did your mind attach to the feeling this time? It may repeat, differ, or remain uncertain. You are noticing the interpretation before deciding what to keep.');
  setSaveButton('Save this return');
  renderAnchor(entry);
  returnAnchor.hidden = false;
  updateSelectedStory();
  showSpiralStage(0);
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSelectedStory() {
  if (!selectedStoryId || !storyTitles[selectedStoryId]) {
    selectedStoryNote.hidden = true;
    selectedStoryNote.textContent = '';
    return;
  }
  selectedStoryNote.hidden = false;
  const source = storySources[selectedStoryId];
  selectedStoryNote.replaceChildren(
    `Story starting point: ${storyTitles[selectedStoryId]}. `,
    createBookCitation(source.book, `page ${source.page}`),
    ' Your own signal report stays in your words.'
  );
}

document.querySelectorAll('.story-card').forEach(card => {
  const copy = card.querySelector('.story-copy');
  if (!copy) return;
  const citation = document.createElement('p');
  citation.className = 'story-source-citation';
  const storyId = card.querySelector('.story-pick')?.dataset.story;
  const source = storySources[storyId];
  citation.append('Source: ', createBookCitation(source.book, `page ${source.page}`));
  copy.prepend(citation);
});

document.querySelectorAll('.story-pick').forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    if (formMode === 'return') {
      showToast('Finish or leave this return before choosing a story for a new beginning.');
      return;
    }
    selectedStoryId = selectedStoryId === button.dataset.story ? null : button.dataset.story;
    updateSelectedStory();
    document.querySelectorAll('.story-pick').forEach(item => {
      const selected = item.dataset.story === selectedStoryId;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    showToast(selectedStoryId ? 'Story held as a starting point. Your journal remains your own.' : 'Story starting point cleared.');
    document.getElementById('memoryForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const values = new FormData(form);
  const stateValue = String(values.get('state') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .join(', ');
  const note = {
    id: makeId(),
    createdAt: Date.now(),
    returnObservation: String(values.get('returnObservation') || '').trim(),
    attention: String(values.get('attention') || '').trim(),
    observation: String(values.get('observation') || '').trim(),
    meaning: String(values.get('meaning') || '').trim(),
    alternativeStory: String(values.get('alternativeStory') || '').trim(),
    chosenStory: String(values.get('chosenStory') || '').trim(),
    evidence: String(values.get('evidence') || '').trim(),
    context: String(values.get('context') || '').trim(),
    practice: String(values.get('practice') || '').trim()
  };
  const hasTurnContent = [note.attention, note.observation, note.meaning, note.alternativeStory, note.chosenStory, note.evidence, note.context, note.practice].some(Boolean);

  if (!requireRawReport()) return;

  if (formMode === 'beginning') {
    const entry = {
      id: makeId(),
      createdAt: note.createdAt,
      state: stateValue,
      beginningNote: '',
      attention: note.attention,
      observation: note.observation,
      meaning: note.meaning,
      alternativeStory: note.alternativeStory,
      chosenStory: note.chosenStory,
      evidence: note.evidence,
      context: note.context,
      practice: note.practice,
      storyId: selectedStoryId,
      returns: []
    };
    if (!hasTurnContent) {
      showToast('Write any part of this turn, or leave this moment unrecorded.');
      return;
    }
    try {
      await writeEntries([entry, ...readEntries()]);
      selectedStoryId = null;
      document.querySelectorAll('.story-pick').forEach(item => {
        item.classList.remove('selected');
        item.setAttribute('aria-pressed', 'false');
      });
      startBeginning();
      renderEntries();
      showToast('This turn is kept on this device. Return later and begin with how this story felt.');
    } catch {
      showToast('This browser could not save the entry. Your writing has not been kept.');
    }
    return;
  }

  if (!note.returnObservation && !hasTurnContent) {
    showToast('Add a few words to this return, or leave the moment unrecorded.');
    return;
  }

  try {
    const entries = readEntries();
    const entry = entries.find(item => item.id === activeEntryId);
    if (!entry) {
      showToast('The original entry could not be found on this device.');
      startBeginning();
      return;
    }
    if (!Array.isArray(entry.returns)) entry.returns = [];
    entry.returns.push(note);
    await writeEntries(entries);
    renderEntries(note.id);
    renderAnchor(entry);
    returnAnchor.hidden = false;
    showToast('This return is saved. Continue the spiral; the full reflection opens only when you choose it.');
    const savedCard = [...memoryList.children].find(card => card.dataset.entryId === entry.id);
    if (savedCard) savedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    startBeginning();
  } catch {
    showToast('This browser could not save the return. Your writing has not been kept.');
  }
});

clearButton.addEventListener('click', () => {
  if (!window.confirm('Remove all saved entries from this device? This cannot be undone here.')) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    entriesCache = [];
    storageEnvelope = null;
    storageKey = null;
    storageLocked = false;
    setMemoryFormEnabled(true);
    renderEntries();
    showToast('Saved entries cleared from this device.');
  } catch {
    showToast('This browser could not clear the saved entries.');
  }
});

async function initializeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        entriesCache = normalizeEntries(parsed);
      } else if (parsed?.encrypted === true) {
        storageEnvelope = parsed;
        storageLocked = true;
        entriesCache = [];
      }
    }
  } catch {
    entriesCache = [];
  }

  if (storageLocked) {
    renderLockedState();
    return;
  }
  form.hidden = false;
  setMemoryFormEnabled(true);
  startBeginning();
  renderEntries();
}

initializeStorage();
