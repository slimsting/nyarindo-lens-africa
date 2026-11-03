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
const themeToggle = document.getElementById('themeToggle');
const storageNote = document.getElementById('storageNote');
const storageSecurity = document.getElementById('storageSecurity');
const unlockEntriesButton = document.getElementById('unlockEntries');
const attentionMessage = document.getElementById('attentionMessage');
const attentionCopy = document.getElementById('attentionCopy');
const attentionProgress = document.getElementById('attentionProgress');
const spiralStages = [...document.querySelectorAll('.spiral-stage')];
const previousStageButton = document.getElementById('previousStage');
const nextStageButton = document.getElementById('nextStage');
const stageProgress = document.getElementById('stageProgress');
const saveButton = document.getElementById('saveButton');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
let themeTimer;
let formMode = 'beginning';
let activeEntryId = null;
let activeStageIndex = 0;
let selectedStoryId = null;
let entriesCache = [];
let storageEnvelope = null;
let storageKey = null;
let storageLocked = false;

function applyTheme(theme, animate = true) {
  const isLight = theme === 'light';
  if (animate && !reducedMotion) {
    document.documentElement.classList.add('theme-transition');
    clearTimeout(themeTimer);
    themeTimer = setTimeout(() => document.documentElement.classList.remove('theme-transition'), 500);
  }
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  themeToggle.setAttribute('aria-pressed', String(!isLight));
  themeToggle.setAttribute('aria-label', 'Dark mode');
  themeToggle.querySelector('.theme-icon').textContent = isLight ? '☼' : '☾';
  themeToggle.querySelector('.theme-label').textContent = isLight ? 'DAY' : 'NIGHT';
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#eeeae0' : '#10110f';
  try {
    localStorage.setItem('nyarindo-theme', isLight ? 'light' : 'dark');
  } catch {}
}

themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});
applyTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark', false);

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
  return `../portfolio-website/index.html#book-${String(bookNumber).padStart(2, '0')}`;
}

function createBookCitation(bookNumber, pageLabel = null) {
  const link = document.createElement('a');
  link.className = 'book-citation';
  link.href = getBookHref(bookNumber);
  link.textContent = `(book ${bookNumber}${pageLabel ? `, ${pageLabel}` : ''})`;
  link.setAttribute('aria-label', `Open ${bookTitles[bookNumber]}, Book ${bookNumber}${pageLabel ? `, ${pageLabel}` : ''}`);
  return link;
}

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

function returnsWithCurrent(entry, currentReturn = null) {
  const returns = [...(entry.returns || [])];
  if (currentReturn && !returns.some(item => item.id === currentReturn.id)) returns.push(currentReturn);
  return returns;
}

function repeatedReportWords(entry, currentReturn = null) {
  const reports = [entry.observation, ...returnsWithCurrent(entry, currentReturn).map(item => item.observation)];
  const counts = new Map();
  reports.filter(Boolean).forEach(report => {
    const words = new Set(report.toLocaleLowerCase().match(/[\p{L}\p{N}']+/gu) || []);
    words.forEach(word => {
      if (word.length > 2 && !commonWords.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
    });
  });
  return [...counts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([word]) => word).slice(0, 8);
}

function createReview(entry, currentReturn = null) {
  const review = document.createElement('section');
  review.className = 'return-review';
  const heading = document.createElement('h4');
  appendLinkedBookText(heading, 'What the notes show beside O(0)');
  review.append(heading);

  const allReturns = returnsWithCurrent(entry, currentReturn);
  const reportCount = [entry.observation, ...allReturns.map(item => item.observation)].filter(Boolean).length;
  const interpretationCount = [entry.meaning, ...allReturns.map(item => item.meaning)].filter(Boolean).length;
  const attentionCount = [entry.attention, ...allReturns.map(item => item.attention)].filter(Boolean).length;
  const chosenStoryCount = [entry.chosenStory, ...allReturns.map(item => item.chosenStory)].filter(Boolean).length;
  const returnObservationCount = allReturns.filter(item => item.returnObservation).length;
  const count = document.createElement('p');
  count.textContent = `Across this entry: ${attentionCount} chosen point${attentionCount === 1 ? '' : 's'} of attention, ${reportCount} signal report${reportCount === 1 ? '' : 's'}, ${interpretationCount} first interpretation${interpretationCount === 1 ? '' : 's'}, ${chosenStoryCount} tested story choice${chosenStoryCount === 1 ? '' : 's'}, and ${returnObservationCount} later observation${returnObservationCount === 1 ? '' : 's'}.`;
  review.append(count);

  if (!entry.observation) {
    const missing = document.createElement('p');
    missing.className = 'review-note';
    missing.textContent = 'The original entry has no signal report. That absence stays visible; this return can hold the first signal description if you choose.';
    review.append(missing);
  } else {
    const anchor = document.createElement('blockquote');
    anchor.className = 'review-anchor';
    appendLinkedBookText(anchor, `Original signal report · O(0): “${entry.observation}”`);
    review.append(anchor);
  }

  const echoes = repeatedReportWords(entry, currentReturn);
  const echoNote = document.createElement('p');
  echoNote.className = 'review-note';
  echoNote.textContent = echoes.length
    ? `Words appearing in more than one signal report: ${echoes.join(', ')}. This is only a word-level echo, not proof of a pattern or its cause.`
    : 'No repeated content words stand out across the signal reports yet. Similar experiences can also be described in different words.';
  review.append(echoNote);

  const question = document.createElement('p');
  question.className = 'review-question';
  question.textContent = 'Read the turns in order. Where did your attention go, which story did you choose to carry, what did you do, and what followed? The notes can show the sequence without deciding what it means.';
  review.append(question);

  const limit = document.createElement('small');
  limit.textContent = 'This is a transparent comparison of saved words and dates. It does not diagnose, infer causes, or decide what your notes mean.';
  review.append(limit);
  return review;
}

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
  explanation.textContent = 'These are your saved turns shown in order. Read where attention went, what story arrived first, what stayed open or changed, what you chose to carry, what you did, and what followed. The page does not score the sequence or supply the meaning.';
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
    addTrailField(body, 'WHAT FOLLOWED', cycle.laterObservation, index === cycles.length - 1 ? 'This turn has not been returned to yet.' : 'No return observation was recorded after this turn.');
    details.append(summary, body);
    list.append(details);
  });
  section.append(list);

  const completed = cycles.filter(cycle => cycle.laterObservation).length;
  const question = document.createElement('p');
  question.className = 'analysis-carry-question';
  question.textContent = completed
    ? `You have recorded ${completed} observation${completed === 1 ? '' : 's'} after a saved turn. Read the trail from beginning to end: where did attention seem to lead what you noticed, chose, did, or experienced next?`
    : 'No turn has been returned to yet. The spiral has not reached the point where it can show what followed. Make a small next turn, then return and read what actually changed.';
  section.append(question);
  return section;
}

function renderGlobalComparison() {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
  const moments = getReportMoments(entries);
  const groups = getSimilarReportGroups(moments);
  const storyCount = moments.filter(moment => moment.story).length;
  const attentionCount = moments.filter(moment => moment.attention).length;
  const returnObservationCount = moments.filter(moment => moment.returnObservation).length;
  const feelings = getFrequentFeelings(entries);
  const reportWords = getFrequentReportWords(moments).map(([word, count]) => ({ word, count }));

  globalComparison.replaceChildren();

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'ACROSS THE WHOLE SPIRAL';
  const title = document.createElement('h3');
  title.textContent = 'What returns when the notes gather.';
  const summary = document.createElement('p');
  summary.className = 'comparison-summary';
  summary.textContent = `${entries.length} saved journal${entries.length === 1 ? '' : 's'} · ${attentionCount} chosen point${attentionCount === 1 ? '' : 's'} of attention · ${moments.length} signal report${moments.length === 1 ? '' : 's'} · ${storyCount} first interpretation${storyCount === 1 ? '' : 's'} · ${returnObservationCount} later observation${returnObservationCount === 1 ? '' : 's'}.`;
  const explanation = document.createElement('p');
  explanation.className = 'comparison-explanation';
  explanation.textContent = 'The body reports a signal; cells do not communicate in human language. A saved “signal report” is already your human-language description, and the interpretation is the story you attach afterward. Every saved report appears below. Wording groups require each report to match every other member: exact wording, or at least two significant words and 60% of the combined word set. Interpretations never determine the grouping. Word overlap is not proof of an identical sensation or cause.';
  explanation.append(' ', createBookCitation(6, 'pages 15, 20'));
  globalComparison.append(eyebrow, title, summary, explanation);
  globalComparison.append(createAttentionTrail(entries));

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
  globalComparison.append(limit);
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
  const details = document.createElement('details');
  details.className = 'return-history-item';
  details.dataset.returnId = item.id;
  details.open = item.id === openReturnId;
  const summary = document.createElement('summary');
  summary.textContent = `Return ${index + 1} · ${formatDate(item.createdAt)}`;
  details.append(summary);
  const content = document.createElement('div');
  content.className = 'return-history-copy';
  addText(content, 'WHAT FOLLOWED THE PREVIOUS TURN', item.returnObservation, [{ book: 5, page: 'page 12' }]);
  addText(content, 'CHOSEN ATTENTION', item.attention);
  addText(content, 'SIGNAL REPORT NOW · O(0)', item.observation);
  addText(content, 'INTERPRETATION / STORY NOW · O(1)', item.meaning);
  addText(content, 'ALTERNATIVE OR REMAINED OPEN', item.alternativeStory);
  addText(content, 'STORY CHOSEN TO CARRY', item.chosenStory);
  addText(content, 'TEST OR OBSERVATION', item.evidence);
  addText(content, 'WIDER MEMORY · O(n)', item.context);
  addText(content, 'SMALL ACTION', item.practice, [{ book: 6, page: 'page 22' }]);
  content.append(createReview(entry, item));
  details.append(content);
  return details;
}

function renderEntries(openReturnId = null) {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
  memoryList.replaceChildren();
  emptyNote.hidden = entries.length > 0;
  clearButton.hidden = entries.length === 0;
  compareAllButton.hidden = entries.length === 0;
  compareAllButton.textContent = 'Analyze entries';
  compareAllButton.setAttribute('aria-expanded', 'false');
  globalComparison.hidden = true;
  globalComparison.replaceChildren();

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

    (entry.returns || []).forEach((item, index) => card.append(renderReturnDetail(entry, item, index, openReturnId)));

    card.append(createComparison(entry));

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
  updateAttentionReveal();
}

function updateAttentionReveal() {
  const completed = getAttentionTrailCycles(readEntries())
    .filter(cycle => cycle.laterObservation)
    .length;
  const ready = completed >= 2;
  attentionMessage.hidden = !ready;

  if (!ready) {
    attentionProgress.textContent = completed === 0
      ? 'The first turn is still open. Save a beginning, return with what followed, then let another turn gather before looking for a pattern.'
      : 'One loop has returned. Make another small turn and return to it; this section will appear when two observations can sit beside each other.';
    return;
  }

  attentionProgress.textContent = `You now have ${completed} returned turns in your own notes. Read the sequence before accepting any explanation—including this one.`;
  attentionCopy.textContent = 'Where did attention go before a story arrived, what did you choose to carry, what did you do, and what followed? The trail can be read without assigning a cause or final meaning. Attend to what actually recurred, what remained uncertain, and what your own record can support.';
}

const defaultStorageNote = 'This returning-journal entry stays in this browser on this device. It does not sync or encrypt. The private clearing page above is never saved here.';
const encryptedStorageNote = 'This returning-journal entry is encrypted at rest with your passphrase. It stays in this browser, does not sync, and must be unlocked again after this session.';

function setMemoryFormEnabled(enabled) {
  [...form.elements].forEach(control => {
    control.disabled = !enabled;
  });
}

function updateStorageUi(entryCount) {
  const cryptoReady = Boolean(globalThis.crypto?.subtle);
  unlockEntriesButton.hidden = !storageLocked;
  storageSecurity.hidden = storageLocked || entryCount === 0 || !cryptoReady;
  storageSecurity.textContent = storageEnvelope ? 'Lock now' : 'Protect entries';
  storageNote.textContent = storageEnvelope ? encryptedStorageNote : defaultStorageNote;
}

function renderLockedState() {
  setMemoryFormEnabled(false);
  emptyNote.hidden = true;
  memoryList.replaceChildren();
  const note = document.createElement('p');
  note.className = 'storage-locked-note';
  note.textContent = 'Saved entries are encrypted. Unlock them with your passphrase to read, add, or remove entries.';
  memoryList.append(note);
  clearButton.hidden = true;
  compareAllButton.hidden = true;
  storageSecurity.hidden = true;
  unlockEntriesButton.hidden = false;
  storageNote.textContent = 'Your saved entries are encrypted and locked for this session.';
}

async function protectExistingEntries() {
  if (!entriesCache.length) {
    showToast('There are no saved entries to encrypt yet.');
    return;
  }
  if (!globalThis.crypto?.subtle) {
    showToast('This browser cannot provide application-level encryption on this page.');
    return;
  }
  const passphrase = window.prompt('Create a passphrase of at least 10 characters. There is no recovery if you forget it.');
  if (passphrase === null) return;
  if (passphrase.length < 10) {
    showToast('Use a passphrase with at least 10 characters.');
    return;
  }
  try {
    const result = await createStorageEnvelope(entriesCache, passphrase);
    storageEnvelope = result.envelope;
    storageKey = result.key;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageEnvelope));
    renderEntries();
    showToast('Saved entries are now encrypted. You will unlock them again after this session.');
  } catch {
    showToast('The entries could not be encrypted. Nothing was changed.');
  }
}

async function unlockSavedEntries() {
  if (!storageEnvelope) return;
  const passphrase = window.prompt('Enter the passphrase for the encrypted journal.');
  if (passphrase === null) return;
  try {
    const result = await decryptStorageEnvelope(storageEnvelope, passphrase);
    entriesCache = result.entries;
    const oldIterations = Number(storageEnvelope.iterations);
    if (!Number.isFinite(oldIterations) || oldIterations < PBKDF2_ITERATIONS) {
      const upgraded = await createStorageEnvelope(entriesCache, passphrase);
      storageEnvelope = upgraded.envelope;
      storageKey = upgraded.key;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageEnvelope));
    } else {
      storageKey = result.key;
    }
    storageLocked = false;
    setMemoryFormEnabled(true);
    startBeginning();
    renderEntries();
    showToast('Encrypted entries unlocked for this session.');
  } catch {
    showToast('That passphrase did not unlock the saved entries.');
  }
}

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
  await protectExistingEntries();
});

unlockEntriesButton.addEventListener('click', unlockSavedEntries);

compareAllButton.addEventListener('click', () => {
  if (globalComparison.hidden) {
    renderGlobalComparison();
    globalComparison.hidden = false;
    compareAllButton.textContent = 'Close analysis';
    compareAllButton.setAttribute('aria-expanded', 'true');
    globalComparison.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  globalComparison.hidden = true;
  compareAllButton.textContent = 'Analyze entries';
  compareAllButton.setAttribute('aria-expanded', 'false');
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
  returnAnchor.append(createReview(entry));
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

function startBeginning() {
  formMode = 'beginning';
  activeEntryId = null;
  returnAnchor.hidden = true;
  returnAnchor.replaceChildren();
  journalMode.hidden = false;
  stateField.hidden = false;
  setModeEyebrow('RETURNING JOURNAL · ENTRY 01', 6, 'BOOK SIX', 'pages 20–22');
  document.getElementById('journalTitle').textContent = 'Begin the returning journal.';
  document.getElementById('journalInstructions').textContent = 'Move through the spiral one turn at a time. Begin with what you choose to attend to, then notice the signal before deciding what it means. An interpretation can stay open. The later return is where you read what followed in your own words.';
  setFieldText('observation', createFieldLabel('02', 'Signal report', 'O(0)'), 'Describe the signal directly—pressure, heat, tingling, movement, stillness, or anything else—before explaining it. Your words are a human-language description of the signal, not the signal itself.');
  setFieldText('meaning', createFieldLabel('03', 'First interpretation', 'O(1)'), 'What words, meaning, emotion, or explanation did your mind attach to the signal? This is an interpretation you can revisit, not a verdict.');
  setSaveButton('Save this entry');
  form.reset();
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
  journalMode.hidden = false;
  stateField.hidden = true;
  setModeEyebrow(`RETURN ${((entry.returns || []).length + 1).toString().padStart(2, '0')}`, 6, 'BOOK SIX', 'pages 20–22');
  document.getElementById('journalTitle').textContent = 'Set today beside the first note.';
  document.getElementById('journalInstructions').textContent = 'Begin with what followed the last turn. Then choose today’s point of attention, notice the signal before naming it, catch the first story, pause, test another account, and make a small next turn.';
  setFieldText('observation', createFieldLabel('02', 'Signal report now', 'O(0)'), 'Describe what you can notice directly now, before explaining it. The words are your human-language description of a bodily signal, not the signal itself.');
  setFieldText('meaning', createFieldLabel('03', 'Interpretation now', 'O(1)'), 'What words, meaning, or explanation did your mind attach to the signal? It may differ, repeat, or remain uncertain.');
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
      showToast('This turn is kept on this device. Return later to record what followed.');
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
    showToast('This return is saved beside the beginning report.');
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
  setMemoryFormEnabled(true);
  startBeginning();
  renderEntries();
}

initializeStorage();
