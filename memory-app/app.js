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
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
let themeTimer;
let formMode = 'beginning';
let activeEntryId = null;
let selectedStoryId = null;

function applyTheme(theme, animate = true) {
  const isLight = theme === 'light';
  if (animate && !reducedMotion) {
    document.documentElement.classList.add('theme-transition');
    clearTimeout(themeTimer);
    themeTimer = setTimeout(() => document.documentElement.classList.remove('theme-transition'), 500);
  }
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  themeToggle.querySelector('.theme-icon').textContent = isLight ? '☾' : '☼';
  themeToggle.querySelector('.theme-label').textContent = isLight ? 'DARK' : 'LIGHT';
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

function readEntries() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter(entry => entry && typeof entry.id === 'string') : [];
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
  const storyCount = [entry.meaning, ...allReturns.map(item => item.meaning)].filter(Boolean).length;
  const count = document.createElement('p');
  count.textContent = `Across this entry, ${reportCount} raw report${reportCount === 1 ? '' : 's'} and ${storyCount} stor${storyCount === 1 ? 'y is' : 'ies are'} saved separately.`;
  review.append(count);

  if (!entry.observation) {
    const missing = document.createElement('p');
    missing.className = 'review-note';
    missing.textContent = 'The original entry has no raw report. That absence stays visible; this return can be the first report if you choose.';
    review.append(missing);
  } else {
    const anchor = document.createElement('blockquote');
    anchor.className = 'review-anchor';
    appendLinkedBookText(anchor, `Original raw report · O(0): “${entry.observation}”`);
    review.append(anchor);
  }

  const echoes = repeatedReportWords(entry, currentReturn);
  const echoNote = document.createElement('p');
  echoNote.className = 'review-note';
  echoNote.textContent = echoes.length
    ? `Words appearing in more than one raw report: ${echoes.join(', ')}. This is only a word-level echo, not proof of a pattern or its cause.`
    : 'No repeated content words stand out across the raw reports yet. Similar experiences can also be described in different words.';
  review.append(echoNote);

  const question = document.createElement('p');
  question.className = 'review-question';
  question.textContent = 'As you place the reports beside the stories attached to them, what—if anything—do you notice changing, returning, or remaining uncertain?';
  review.append(question);

  const limit = document.createElement('small');
  limit.textContent = 'This is a transparent comparison of saved words and dates. It does not diagnose, infer causes, or decide what your notes mean.';
  review.append(limit);
  return review;
}

const portableJournalPrompts = [
  'What exactly did I notice before I began explaining it?',
  'Which story returned to this report, and which one changed?',
  'What could this report mean without deciding yet?',
  'What would help me stay with the report for one more breath?'
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
  button.textContent = 'Compare repeated reports';
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
  title.textContent = 'The same report, beside the stories it gathered.';
  const explanation = document.createElement('p');
  explanation.className = 'comparison-explanation';
  explanation.textContent = 'Raw reports are the root of this comparison. They are grouped only by report wording after trimming extra spaces; attached stories never decide which reports belong together. A repeated wording is not proof that the underlying sensation, cause, or meaning was identical.';
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
      count.textContent = `${storyCount} stor${storyCount === 1 ? 'y' : 'ies'} attached to this exact report`;
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
        storyText.textContent = item.story || 'No story was written with this report.';
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
    empty.textContent = 'No exact raw report has repeated in this thread yet. The comparison can notice identical wording, but it cannot decide that differently worded reports describe the same sensation.';
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
  exampleNote.textContent = 'The report stayed the same in this example; the stories around it changed. The comparison does not decide which story is true.';
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
    button.textContent = panel.hidden ? 'Compare repeated reports' : 'Close comparison';
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
        report: beginningReport,
        story: String(entry.meaning || '').trim()
      });
    }

    (entry.returns || []).forEach((item, index) => {
      const report = normalizeRawReport(item.observation);
      if (!report) return;
      moments.push({
        entryId: entry.id,
        source: `Return ${String(index + 1).padStart(2, '0')}`,
        createdAt: item.createdAt,
        report,
        story: String(item.meaning || '').trim()
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
      group.moments.forEach(compareMoment => {
        const comparison = compareReportWording(moment.report, compareMoment.report);
        if (comparison.similar && comparison.score > bestScore) {
          bestGroup = group;
          bestScore = comparison.score;
        }
      });
    });

    if (bestGroup) {
      bestGroup.moments.push(moment);
    } else {
      groups.push({ moments: [moment] });
    }
  });

  return groups
    .filter(group => group.moments.length > 1)
    .map(group => {
      const wordingCounts = new Map();
      group.moments.forEach(moment => {
        const wording = normalizeRawReport(moment.report);
        wordingCounts.set(wording, (wordingCounts.get(wording) || 0) + 1);
      });
      const normalizedReports = new Set(wordingCounts.keys());
      const tokenCounts = new Map();
      group.moments.forEach(moment => {
        getReportTokens(moment.report).forEach(token => {
          tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
        });
      });
      return {
        ...group,
        exact: normalizedReports.size === 1,
        mostFrequentWordingCount: Math.max(...wordingCounts.values()),
        sharedWords: [...tokenCounts.entries()]
          .filter(([, count]) => count > 1)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([word]) => word)
          .slice(0, 6),
        latestAt: Math.max(...group.moments.map(moment => moment.createdAt))
      };
    })
    .sort((a, b) => b.moments.length - a.moments.length || b.latestAt - a.latestAt);
}

function getFrequentFeelings(entries) {
  const counts = new Map();
  entries.forEach(entry => {
    String(entry.state || '').split(',').map(value => value.trim()).filter(Boolean).forEach(value => {
      const key = value.toLocaleLowerCase();
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
  title.textContent = 'One raw report, three different stories.';
  title.append(' ', createBookCitation(6, 'page 20'));
  const count = document.createElement('p');
  count.className = 'analysis-result-count';
  count.textContent = 'Example result · 4 related reports · 3 exact repeats · 3 stories attached';
  const quote = document.createElement('blockquote');
  quote.textContent = 'My shoulders rose when the meeting began.';

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
    storyText.textContent = `Story: “${storyLabel}”`;
    story.append(source, storyText);
    stories.append(story);
  });

  const supportsTitle = document.createElement('h5');
  supportsTitle.textContent = 'What this example supports';
  const supports = document.createElement('ul');
  supports.className = 'analysis-points';
  [
    'The raw report stayed stable enough to be grouped.',
    'The attached stories changed across the saved moments.',
    'The next useful question is what changed when the story changed.'
  ].forEach(point => {
    const item = document.createElement('li');
    item.textContent = point;
    supports.append(item);
  });

  const limit = document.createElement('p');
  limit.className = 'analysis-example-limit';
  limit.textContent = 'This example cannot show what caused the shoulders to rise, whether the sensation meant the same thing each time, or which story is true. It shows only what can be compared without going beyond the reports.';

  const prompt = document.createElement('p');
  prompt.className = 'analysis-carry-question';
  prompt.textContent = 'Question to carry: When the raw report stayed the same, what changed in the story—and what changed in what you did next?';

  body.append(label, title, count, quote, stories, supportsTitle, supports, limit, prompt);
  guide.append(summary, body);
  return guide;
}

function renderGlobalComparison() {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
  const moments = getReportMoments(entries);
  const groups = getSimilarReportGroups(moments);
  const storyCount = moments.filter(moment => moment.story).length;
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
  summary.textContent = `${entries.length} saved journal${entries.length === 1 ? '' : 's'} · ${moments.length} raw report${moments.length === 1 ? '' : 's'} · ${storyCount} attached stor${storyCount === 1 ? 'y' : 'ies'}.`;
  const explanation = document.createElement('p');
  explanation.className = 'comparison-explanation';
  explanation.textContent = 'Raw reports are the root of this comparison. Exact reports are grouped by wording after whitespace is normalized. Closely worded reports must share at least two significant words and 60% of their combined word set. Stories are listed beneath their reports but never determine the grouping. This shows textual overlap, not proof of an identical sensation or cause.';
  explanation.append(' ', createBookCitation(6, 'pages 15, 20'));
  globalComparison.append(eyebrow, title, summary, explanation);

  const relatedHeading = document.createElement('h4');
  relatedHeading.className = 'global-section-title';
  relatedHeading.textContent = 'Reports and the stories gathered around them';
  relatedHeading.append(' ', createBookCitation(6, 'page 20'));
  globalComparison.append(relatedHeading);

  if (!groups.length) {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No raw report has repeated or closely matched another yet. Recurring feelings and words will still appear below as the notes accumulate.';
    globalComparison.append(empty);
  } else {
    const groupList = document.createElement('div');
    groupList.className = 'repeated-report-list';
    groups.forEach(group => {
      const article = document.createElement('article');
      article.className = 'repeated-report global-report-group';
      const heading = document.createElement('p');
      heading.className = 'repeated-report-count';
      const attachedStories = group.moments.filter(moment => moment.story).length;
      const reportLabel = group.exact
        ? `${group.moments.length} exact reports`
        : `${group.moments.length} closely worded reports${group.mostFrequentWordingCount > 1 ? `, including ${group.mostFrequentWordingCount} exact repeats` : ''}`;
      heading.textContent = `${reportLabel} · ${attachedStories} stor${attachedStories === 1 ? 'y' : 'ies'} attached`;
      heading.append(' ', createBookCitation(6, 'page 20'));
      const quote = document.createElement('blockquote');
      quote.textContent = group.moments[0].report;
      article.append(heading, quote);

      if (!group.exact && group.sharedWords.length) {
        const shared = document.createElement('p');
        shared.className = 'shared-report-words';
        shared.textContent = `Shared significant words: ${group.sharedWords.join(', ')}.`;
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
        report.textContent = `Report: “${moment.report}”`;
        const story = document.createElement('p');
        story.textContent = moment.story ? `Story: “${moment.story}”` : 'No story was written with this report.';
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
  feelingTitle.textContent = 'Feelings named most often';
  feelingTitle.append(' ', createBookCitation(5, 'page 8'));
  feelingSection.append(feelingTitle);
  if (feelings.length) {
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
  wordTitle.textContent = 'Words recurring across raw reports';
  wordTitle.append(' ', createBookCitation(6, 'page 20'));
  wordSection.append(wordTitle);
  if (reportWords.length) {
    const wordList = createFrequencyList(reportWords);
    wordList.classList.add('word-frequency-list');
    wordSection.append(wordList);
  } else {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No significant words repeat across raw reports yet.';
    wordSection.append(empty);
  }

  insights.append(feelingSection, wordSection);
  globalComparison.append(insights);
  globalComparison.append(createAnalysisGuide());

  const limit = document.createElement('p');
  limit.className = 'global-comparison-limit';
  limit.textContent = 'These are transparent counts of the words you saved. They do not diagnose, assign causes, or decide what the repetition means.';
  globalComparison.append(limit);
}

function makeReturnButton(entry) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'spiral-return';
  button.setAttribute('aria-label', `Return to journal entry from ${formatDate(entry.createdAt)}`);
  button.innerHTML = '<img src="assets/return-spiral-mark.svg" alt="" aria-hidden="true"><span>Return</span>';
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
  addText(content, 'RAW REPORT NOW · O(0)', item.observation);
  addText(content, 'STORY NOW · O(1)', item.meaning);
  addText(content, 'WIDER MEMORY · O(n)', item.context);
  addText(content, 'SMALL PRACTICE', item.practice, [{ book: 6, page: 'page 22' }]);
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
    addText(beginningContent, 'RAW REPORT · O(0)', entry.observation);
    addText(beginningContent, 'FIRST STORY · O(1)', entry.meaning);
    addText(beginningContent, 'WIDER MEMORY · O(n)', entry.context);
    addText(beginningContent, 'SMALL PRACTICE', entry.practice, [{ book: 6, page: 'page 22' }]);
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
    remove.addEventListener('click', () => {
      try {
        writeEntries(readEntries().filter(item => item.id !== entry.id));
        renderEntries();
        showToast('Entry removed from this device.');
      } catch {
        showToast('This browser could not remove the saved entry.');
      }
    });
    card.append(remove);
    memoryList.append(card);
  });
}

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
  title.textContent = 'The original report stays here.';
  const leave = document.createElement('button');
  leave.type = 'button';
  leave.className = 'leave-return';
  leave.textContent = 'Leave this return';
  leave.addEventListener('click', startBeginning);
  returnAnchor.append(heading, title, leave);
  addText(returnAnchor, 'ORIGINAL RAW REPORT · O(0)', entry.observation || 'No raw report was saved in the original entry. You may add your first one now.', [{ book: 1, page: 'page 12' }]);
  addText(returnAnchor, 'FIRST STORY · O(1)', entry.meaning || 'No first story was saved. Meaning can remain open.', [{ book: 1, page: 'page 12' }]);
  const storyLink = getStoryLink(entry.storyId);
  if (storyLink) returnAnchor.append(storyLink);
  returnAnchor.append(createReview(entry));
}

function setFieldText(id, label, hint) {
  const labelNode = document.getElementById(`${id}Label`);
  const hintNode = document.getElementById(`${id}Hint`);
  if (labelNode) labelNode.innerHTML = label;
  if (hintNode) hintNode.textContent = hint;
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
  document.getElementById('journalInstructions').textContent = 'Write the raw report first, then the first story attached to it, then a wider memory if one arises. This entry is kept locally and is meant to be reread over time, not analyzed into a conclusion today.';
  setFieldText('observation', '<b>02</b> Raw report · <a class="book-reference" href="../portfolio-website/index.html#book-06">O(0)</a> <a class="book-citation" href="../portfolio-website/index.html#book-06">(book 6, pages 15, 20)</a>', 'What can you notice directly—in your body, surroundings, or actions—before explaining it? Use one or more defaults if they fit, and type anything else you want to add in your own words.');
  setFieldText('meaning', '<b>03</b> First story · <a class="book-reference" href="../portfolio-website/index.html#book-06">O(1)</a> <a class="book-citation" href="../portfolio-website/index.html#book-06">(book 6, pages 15, 20)</a>', 'What meaning, emotion, or explanation arrived? This is a story you can revisit, not a verdict.');
  document.getElementById('saveButton').innerHTML = 'Save this entry <span>↗</span>';
  form.reset();
  syncStatePresets();
  updateSelectedStory();
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
  document.getElementById('journalInstructions').textContent = 'Start with what is directly here now. Then write the story that appears, if one does. The notes are kept beside the original report so you can read them across time.';
  setFieldText('observation', '<b>01</b> Raw report now · <a class="book-reference" href="../portfolio-website/index.html#book-06">O(0)</a> <a class="book-citation" href="../portfolio-website/index.html#book-06">(book 6, pages 15, 20)</a>', 'What can you notice directly now, before you explain it? Your own words are always allowed.');
  setFieldText('meaning', '<b>02</b> Story now · <a class="book-reference" href="../portfolio-website/index.html#book-06">O(1)</a> <a class="book-citation" href="../portfolio-website/index.html#book-06">(book 6, pages 15, 20)</a>', 'What meaning or explanation is here now? It may differ, repeat, or remain uncertain.');
  document.getElementById('saveButton').innerHTML = 'Save this return <span>↗</span>';
  renderAnchor(entry);
  returnAnchor.hidden = false;
  updateSelectedStory();
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
    ' Your own report stays in your words.'
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

form.addEventListener('submit', event => {
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
    observation: String(values.get('observation') || '').trim(),
    meaning: String(values.get('meaning') || '').trim(),
    context: String(values.get('context') || '').trim(),
    practice: String(values.get('practice') || '').trim()
  };

  if (formMode === 'beginning') {
    const entry = {
      id: makeId(),
      createdAt: note.createdAt,
      state: stateValue,
      beginningNote: '',
      observation: note.observation,
      meaning: note.meaning,
      context: note.context,
      practice: note.practice,
      storyId: selectedStoryId,
      returns: []
    };
    if (!entry.observation && !entry.meaning && !entry.context && !entry.practice) {
      showToast('Write anything that is here, or leave this moment unrecorded.');
      return;
    }
    try {
      writeEntries([entry, ...readEntries()]);
      selectedStoryId = null;
      document.querySelectorAll('.story-pick').forEach(item => {
        item.classList.remove('selected');
        item.setAttribute('aria-pressed', 'false');
      });
      startBeginning();
      renderEntries();
      showToast('Kept on this device. You can close the page and return when you choose.');
    } catch {
      showToast('This browser could not save the entry. Your writing has not been kept.');
    }
    return;
  }

  if (!note.observation && !note.meaning && !note.context && !note.practice) {
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
    writeEntries(entries);
    renderEntries(note.id);
    renderAnchor(entry);
    returnAnchor.hidden = false;
    showToast('Return saved beside the beginning report.');
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
    renderEntries();
    showToast('Saved entries cleared from this device.');
  } catch {
    showToast('This browser could not clear the saved entries.');
  }
});

startBeginning();
renderEntries();
