const tracks = {
  familiar: [
    { title: 'Sunrise in Mombasa', artist: 'Amani & The Sea', album: 'Coastline Letters', path: 'You saved this one on a slow Sunday', reason: 'A familiar warmth from your saved music.', art: 'art-1', tone: 220, lyrics: ['The sun reaches the water', 'And the water says hello', 'We leave the night behind us', 'Where the slow warm breezes go'] },
    { title: 'Quiet Rooms', artist: 'Kio', path: 'One of your most-played tracks', reason: 'You return here when you want nothing new.', art: 'art-2', tone: 196, lyrics: ['There is a room inside the noise', 'Where every small thought settles', 'I leave the light on by the door', 'For all the gentle weather'] }
  ],
  genre: [
    { title: 'After the Rain', artist: 'Lemon Street', path: 'A new turn from your alt-soul trail', reason: 'It lives close to the sound you already trust.', art: 'art-3', tone: 247, lyrics: ['The pavement keeps the rain', 'Like a mirror keeps a face', 'I find the morning hiding', 'In the corners of this place'] },
    { title: 'Small Hours', artist: 'Mina Blue', path: 'Found near your late-night favourites', reason: 'The genre stays familiar; the voice is new.', art: 'art-2', tone: 277, lyrics: ['Small hours, wide awake', 'City breathing through the wall', 'Hold my hand inside the silence', 'We do not need to name it all'] }
  ],
  balance: [
    { title: 'Sunrise in Mombasa', artist: 'Amani & The Sea', path: 'Maya drifted here from Nia Archives', reason: 'It holds the warm, open rhythm you’ve been saving—and Maya loved it too.', art: 'art-1', tone: 220, lyrics: ['The sun reaches the water', 'And the water says hello', 'We leave the night behind us', 'Where the slow warm breezes go'] },
    { title: 'Tender Mercury', artist: 'Miro', path: 'Nora followed this from Amani & The Sea', reason: 'A gentle step outward from a sound you already love.', art: 'art-4', tone: 330, lyrics: ['Turn the silver into gold', 'Let the city lose its name', 'There is kindness in the current', 'There is fire without a flame'] }
  ],
  explore: [
    { title: 'Kite String', artist: 'Mira K', path: 'A surprise turn from three people you follow', reason: 'You asked for distance from the familiar. This is the new horizon.', art: 'art-3', tone: 294, lyrics: ['Let the kite string pull you', 'Past the roofline, past the blue', 'Every road you never travelled', 'Was still waiting there for you'] },
    { title: 'Night Bazaar', artist: 'Sadiq M.', path: 'Lebo drifted here from a midnight radio set', reason: 'A different rhythm, a different place, the same open door.', art: 'art-2', tone: 370, lyrics: ['Lantern light and moving feet', 'A thousand stories in the street', 'Follow drums beneath the stars', 'Find your way through night bazaars'] }
  ]
};
let mode = localStorage.getItem('drift-mode') || 'balance';
let index = Number(localStorage.getItem('drift-index') || 0);
let history = [];
let driftStart = { mode, index };
let repeatOne = localStorage.getItem('drift-repeat-one') === 'true';
let audioContext, oscillator, gain, lyricTimer, lyricIndex = 0;
const $ = (id) => document.getElementById(id);
const title = $('trackTitle'), artist = $('trackArtist'), album = $('trackAlbum'), path = $('trackPath'), reason = $('reasonText'), art = $('artwork'), transportPlay = $('transportPlay');
function current() { const list = tracks[mode]; return list[index % list.length]; }
function render(remember = false) {
  if (oscillator) stopTone();
  if (remember) history.push({ mode, index });
  const track = current();
  title.textContent = track.title; artist.textContent = track.artist; album.textContent = track.album ? `from ${track.album}` : ''; album.hidden = !track.album; path.textContent = track.path; reason.textContent = track.reason;
  art.className = `art ${track.art}`; transportPlay.setAttribute('aria-label', `Play ${track.title}`);
  document.documentElement.style.setProperty('--track-glow', track.art === 'art-2' ? '#77352c' : track.art === 'art-3' ? '#765226' : track.art === 'art-4' ? '#164b3a' : '#245c49');
  $('lyricsText').innerHTML = track.lyrics.map((line, lineIndex) => `<div class="lyric-line${lineIndex === 0 ? ' active' : ''}">${line}</div>`).join(''); lyricIndex = 0;
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('selected', b.dataset.mode === mode));
  localStorage.setItem('drift-mode', mode); localStorage.setItem('drift-index', index);
}
document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; index = 0; driftStart = { mode, index }; history = []; render(); toast(`${button.querySelector('b').textContent} selected — this is your new drift start.`); }));
$('driftButton').addEventListener('click', () => { $('directionPanel').hidden = !$('directionPanel').hidden; });
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => {
  const direction = button.dataset.direction;
  if (direction === 'softer') mode = 'balance';
  if (direction === 'deeper') mode = 'genre';
  if (direction === 'angle' || direction === 'surprise') mode = 'explore';
  if (direction === 'people') mode = 'balance';
  index++; $('directionPanel').hidden = true; render(true); toast(`Drifting ${direction}…`);
}));
$('returnButton').addEventListener('click', () => { if (mode === driftStart.mode && index === driftStart.index) return toast('You are already at the start of this drift.'); mode = driftStart.mode; index = driftStart.index; history = []; render(); toast('Returned to the start of this drift.'); });
function showLyric(line) { const lines = [...document.querySelectorAll('.lyric-line')]; lines.forEach((el, i) => el.classList.toggle('active', i === line)); $('lyricsText').style.transform = `translateY(${-line * 39}px)`; }
function setPlayState(playing) { transportPlay.textContent = playing ? '■' : '▶'; transportPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play'); }
function stopTone() { if (!oscillator) return; oscillator.stop(); oscillator = null; clearInterval(lyricTimer); setPlayState(false); }
function toggleTone() {
  if (oscillator) { stopTone(); return; }
  audioContext = audioContext || new AudioContext(); const track = current(); oscillator = audioContext.createOscillator(); gain = audioContext.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = track.tone; gain.gain.setValueAtTime(.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.08, audioContext.currentTime + .2); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); setPlayState(true); lyricTimer = setInterval(() => { lyricIndex = (lyricIndex + 1) % track.lyrics.length; showLyric(lyricIndex); }, 2600);
}
transportPlay.addEventListener('click', toggleTone);
$('nextTrack').addEventListener('click', () => { history.push({ mode, index }); const atEnd = index % tracks[mode].length === tracks[mode].length - 1; if (!repeatOne || !atEnd) index++; render(); toast(repeatOne && atEnd ? 'Repeating this song.' : 'Next song.'); });
$('previousTrack').addEventListener('click', () => { const previous = history.pop(); if (previous) { mode = previous.mode; index = previous.index; } else { index = (index - 1 + tracks[mode].length) % tracks[mode].length; } render(); toast('Previous song.'); });
const dialog = $('profileDialog'); $('profileButton').addEventListener('click', () => dialog.showModal());
$('profileForm').addEventListener('submit', (event) => { if (event.submitter.value !== 'save') return; const name = $('username').value.trim(); if (!name) return; localStorage.setItem('drift-user', name); updateUser(); toast(`Welcome to Drift, ${name}.`); });
function updateUser() { const name = localStorage.getItem('drift-user'); if (!name) return; $('profileInitial').textContent = name[0].toUpperCase(); $('greeting').textContent = `${name.toUpperCase()}'S LISTENING SPACE`; }
let timeout; function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(timeout); timeout = setTimeout(() => el.classList.remove('show'), 2300); }
['artistTip','driftSupport'].forEach(id => $(id).addEventListener('click', () => toast(id === 'artistTip' ? 'Artist tips are a preview—payments are not connected.' : 'Support options are a preview—no payment is collected.')));
$('lyricsToggle').addEventListener('click', () => { const panel = $('lyrics'); const open = panel.hidden; panel.hidden = !open; $('lyricsToggle').setAttribute('aria-expanded', String(open)); $('lyricsToggle').querySelector('span').textContent = open ? '−' : '+'; });
$('themeButton').addEventListener('click', () => { const light = document.body.classList.toggle('light'); $('themeButton').textContent = light ? '◐' : '☼'; $('themeButton').setAttribute('aria-label', light ? 'Use dark mode' : 'Use light mode'); localStorage.setItem('drift-theme', light ? 'light' : 'dark'); });
$('fullscreenButton').addEventListener('click', () => { const entering = !document.body.classList.contains('immersive'); document.body.classList.toggle('immersive', entering); $('fullscreenButton').textContent = entering ? 'Normal view ×' : 'Large screen ⛶'; $('fullscreenButton').setAttribute('aria-pressed', String(entering)); if (entering && $('lyrics').hidden) $('lyricsToggle').click(); });
document.querySelector('.lyrics-section').addEventListener('click', () => { if (document.body.classList.contains('immersive')) $('fullscreenButton').click(); });
$('repeatButton').addEventListener('click', () => { repeatOne = !repeatOne; localStorage.setItem('drift-repeat-one', String(repeatOne)); $('repeatButton').textContent = repeatOne ? 'One song ↻' : 'Whole playlist ↻'; $('repeatButton').setAttribute('aria-pressed', String(repeatOne)); toast(repeatOne ? 'Repeating one song.' : 'Playing the full playlist.'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
updateUser(); render();
if (localStorage.getItem('drift-theme') === 'light') $('themeButton').click();
if (repeatOne) { $('repeatButton').textContent = 'One song ↻'; $('repeatButton').setAttribute('aria-pressed', 'true'); }
