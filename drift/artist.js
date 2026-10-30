const form = document.getElementById('uploadForm');
const toast = document.getElementById('toast');
let timer;
function show(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 2800); }
document.getElementById('connectButton').addEventListener('click', () => show('Payout setup will open here when Drift connects its payment provider.'));
document.getElementById('instrumental').addEventListener('change', event => { document.getElementById('lyrics').disabled = event.target.checked; if (event.target.checked) document.getElementById('lyrics').value = ''; });
form.addEventListener('submit', event => { event.preventDefault(); show('Preview only — no music or cover file was uploaded.'); });
