(() => {
  const settings = document.body.dataset;
  if (!settings.appInstall) return;

  const appId = settings.appInstall;
  const appName = settings.appName || 'Nyarindo Lens Universal';
  const workerPath = settings.serviceWorker;
  const workerScope = settings.serviceWorkerScope;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const offerKey = `nyarindo-install-offer-dismissed:${appId}`;
  let installPrompt = null;

  const offerCopy = {
    universal: {
      eyebrow: 'THE WHOLE NYARINDO LENS',
      title: 'Carry the whole Lens with you.',
      body: 'Install the complete Nyarindo Lens now. Separate practices can be added later as you visit them.',
      action: 'Install the Lens'
    },
    library: {
      eyebrow: 'THE NYARINDO LIBRARY',
      title: 'Keep the whole library close.',
      body: 'Install the Library as its own app. Every reader edition remains available in one continuous scroll, with source page markers and your device preferences.',
      action: 'Install the Library'
    },
    return: {
      eyebrow: 'RETURN · MEMORY PRACTICE',
      title: 'Keep Return close.',
      body: 'Install this journaling practice as its own app for quieter, one-tap access. Your writing remains on this device.',
      action: 'Install Return'
    },
    drift: {
      eyebrow: 'DRIFT · MUSIC DISCOVERY',
      title: 'Let Drift travel with you.',
      body: 'Install Drift as a separate app and return directly to the music trail whenever you open it.',
      action: 'Install Drift'
    },
    'semantic-field': {
      eyebrow: 'SEMANTIC FIELD · LIVING MAP',
      title: 'Give the ideas their own room.',
      body: 'Install Semantic Field as a separate app and open the relationship map directly from your device.',
      action: 'Install Semantic Field'
    }
  };

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  }

  function buildEntryOffer() {
    const copy = offerCopy[appId] || offerCopy.universal;
    const offer = createElement('aside', 'install-offer');
    offer.id = 'install-offer';
    offer.setAttribute('aria-labelledby', 'install-offer-title');
    offer.hidden = true;

    const iconLink = document.querySelector('link[rel~="apple-touch-icon"]');
    if (iconLink) {
      const icon = createElement('img', 'install-offer-icon');
      icon.src = iconLink.href;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      icon.width = 52;
      icon.height = 52;
      offer.append(icon);
    }

    const copyBox = createElement('div', 'install-offer-copy');
    copyBox.append(
      createElement('p', 'install-offer-eyebrow', copy.eyebrow),
      createElement('h2', 'install-offer-title', copy.title),
      createElement('p', 'install-offer-body', copy.body)
    );

    const actions = createElement('div', 'install-offer-actions');
    const installButton = createElement('button', 'install-button install-offer-button', copy.action);
    installButton.type = 'button';
    installButton.dataset.installApp = '';
    installButton.dataset.installLabel = copy.action;
    const closeButton = createElement('button', 'install-offer-dismiss', 'Not now');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', `Dismiss the ${appName} installation offer`);
    actions.append(installButton, closeButton);

    const status = createElement('p', 'install-status install-offer-status');
    status.dataset.installStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const manual = createElement('div', 'install-manual install-offer-manual');
    manual.dataset.installManual = '';
    manual.hidden = true;
    manual.append(createElement('strong', '', 'Install from your browser'));
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      manual.append(createElement('span', '', 'Open the Share menu, then choose Add to Home Screen.'));
    } else {
      manual.append(createElement('span', '', 'Open the browser menu and choose Install app or Add to Home screen.'));
    }

    copyBox.append(actions, status, manual);
    offer.append(copyBox);
    document.body.append(offer);

    closeButton.addEventListener('click', () => {
      offer.hidden = true;
      try { sessionStorage.setItem(offerKey, '1'); } catch {}
    });

    return offer;
  }

  const entryOffer = standalone ? null : buildEntryOffer();
  const buttons = [...document.querySelectorAll('[data-install-app]')];
  const statuses = [...document.querySelectorAll('[data-install-status]')];
  const manuals = [...document.querySelectorAll('[data-install-manual]')];

  function setStatus(message) {
    statuses.forEach(status => { status.textContent = message; });
  }

  function setButtonState(label, busy = false) {
    buttons.forEach(button => {
      button.textContent = label;
      button.setAttribute('aria-busy', String(busy));
    });
  }

  function revealManualInstructions() {
    manuals.forEach(manual => { manual.hidden = false; });
  }

  async function registerWorker() {
    if (!workerPath || !('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register(workerPath, workerScope ? { scope: workerScope } : undefined);
    } catch {
      setStatus('The app is available online, but offline installation could not be prepared in this browser.');
    }
  }

  async function installApp() {
    if (standalone) {
      setStatus(`${appName} is already running as an installed app.`);
      return;
    }

    if (!installPrompt) {
      revealManualInstructions();
      setStatus(`Your browser has not offered an automatic prompt yet. Use the install steps below for ${appName}.`);
      return;
    }

    setButtonState(`Installing ${appName}…`, true);
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    installPrompt = null;
    buttons.forEach(button => {
      button.textContent = button.dataset.installLabel || `Install ${appName}`;
      button.setAttribute('aria-busy', 'false');
    });
    setStatus(choice.outcome === 'accepted'
      ? `${appName} is being installed.`
      : `Installation was dismissed. You can try again whenever you are ready.`);
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    setStatus(`${appName} is ready to install on this device.`);
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (entryOffer) entryOffer.hidden = true;
    buttons.forEach(button => {
      button.textContent = 'Installed';
      button.setAttribute('aria-busy', 'false');
    });
    setStatus(`${appName} is now installed on this device.`);
  });

  buttons.forEach(button => button.addEventListener('click', installApp));

  if (standalone) {
    setButtonState('Installed');
    setStatus(`${appName} is already running as an installed app.`);
  }

  registerWorker();

  if (entryOffer) {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(offerKey) === '1'; } catch {}
    if (!dismissed) {
      window.setTimeout(() => {
        entryOffer.hidden = false;
        setStatus(`Install ${appName} whenever you are ready.`);
      }, 650);
    }
  }

  if (new URLSearchParams(location.search).has('install')) {
    requestAnimationFrame(() => {
      document.querySelector('[data-install-panel]')?.scrollIntoView({
        block: 'center',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    });
  }
})();
