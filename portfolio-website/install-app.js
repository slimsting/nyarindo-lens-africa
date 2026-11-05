(() => {
  const settings = document.body.dataset;
  if (!settings.appInstall) return;

  const appName = settings.appName || 'Nyarindo Lens Universal';
  const workerPath = settings.serviceWorker;
  const workerScope = settings.serviceWorkerScope;
  const standalone =
    matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;
  const notes = [...document.querySelectorAll('[data-install-app]')];
  const statuses = [...document.querySelectorAll('[data-install-status]')];
  let installPrompt = null;

  function setStatus(message) {
    statuses.forEach((status) => {
      status.textContent = message;
    });
  }

  function setNoteState(label, busy = false) {
    notes.forEach((note) => {
      note.textContent = label;
      note.setAttribute('aria-busy', String(busy));
    });
  }

  function resetNotes() {
    notes.forEach((note) => {
      note.textContent =
        note.dataset.installLabel || `Install ${appName} on this device.`;
      note.setAttribute('aria-busy', 'false');
    });
  }

  function manualInstructions() {
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isIos
      ? `Open Share, then choose “Add to Home Screen” to install ${appName}.`
      : `Open your browser menu and choose “Install app” to install ${appName}.`;
  }

  async function registerWorker() {
    if (!workerPath || !('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register(
        workerPath,
        workerScope ? { scope: workerScope } : undefined,
      );
    } catch {
      setStatus('Offline preparation is unavailable in this browser.');
    }
  }

  async function installApp() {
    if (standalone) {
      setStatus(`${appName} is already installed.`);
      return;
    }

    if (!installPrompt) {
      setStatus(manualInstructions());
      return;
    }

    setNoteState(`Installing ${appName}…`, true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      installPrompt = null;
      resetNotes();
      setStatus(
        choice.outcome === 'accepted'
          ? `${appName} is being installed.`
          : 'Installation was dismissed.',
      );
    } catch {
      installPrompt = null;
      resetNotes();
      setStatus(manualInstructions());
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    setNoteState('Installed');
    setStatus(`${appName} is installed.`);
  });

  notes.forEach((note) => note.addEventListener('click', installApp));

  if (standalone) {
    setNoteState('Installed');
    setStatus(`${appName} is already installed.`);
  }

  registerWorker();
})();
