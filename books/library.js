(() => {
  "use strict";

  const books = Object.freeze({
    introduction: {
      title: "General Introduction",
      subtitle: "Entering the grammar of the Nyarindo Lens",
      number: "THE ENTRANCE",
      file: "/books/pdfs/general-introduction.pdf",
    },
    "the-nyarindo-lens": {
      title: "The Nyarindo Lens",
      subtitle: "A Grammar of Pulse for the Fragile and the Fluid",
      number: "BOOK 01",
      file: "/books/pdfs/book-01-nyarindo-lens.pdf",
    },
    "the-pulse-reports": {
      title: "The Pulse Reports",
      subtitle: "A Grammar of Feeling and the External Pulse",
      number: "BOOK 02",
      file: "/books/pdfs/book-02-pulse-reports.pdf",
    },
    "stories-we-tell-about-the-pulse": {
      title: "The Stories We Tell About the Pulse",
      subtitle: "A Grammar of Systems and the Collective Pulse",
      number: "BOOK 03",
      file: "/books/pdfs/book-03-stories-we-tell-about-the-pulse.pdf",
    },
    "the-method-in-the-waves": {
      title: "The Method in the Waves",
      subtitle: "A Grammar of Coherence for the Wavy Mind",
      number: "BOOK 04",
      file: "/books/pdfs/book-04-method-in-the-waves.pdf",
    },
    attention: {
      title: "Attention",
      subtitle:
        "The Green Between Faith and Science / A Grammar of Calibrated Self-Knowledge",
      number: "BOOK 05",
      file: "/books/pdfs/book-05-attention.pdf",
    },
    "teaching-the-wave-mind": {
      title: "Teaching the Wave Mind",
      subtitle: "Grammar as the Anchor",
      number: "BOOK 06",
      file: "/books/pdfs/book-06-teaching-the-wave-mind.pdf",
    },
    "the-vacuum-experiment": {
      title: "The Vacuum Experiment",
      subtitle: "Emergence observed, not pre-assigned",
      number: "BOOK 07",
      file: "/books/pdfs/book-07-vacuum-experiment.pdf",
    },
    collection: {
      title: "The Spiral of Reach and Return",
      subtitle: "The complete Nyarindo Lens collection",
      number: "THE COLLECTION",
      file: "/books/pdfs/collection-spiral-of-reach-and-return.pdf",
    },
    "end-note": {
      title: "End Note",
      subtitle: "The spiral deepens and begins to open",
      number: "THE RETURN",
      file: "/books/pdfs/end-note.pdf",
    },
  });
  const localBooks = new Map();

  function getBook(bookSlug) {
    return localBooks.get(bookSlug) || books[bookSlug] || null;
  }

  async function refreshLocalBooks() {
    if (!window.NyarindoPdfLibrary) return;
    const documents = await window.NyarindoPdfLibrary.listBooks();
    localBooks.clear();
    documents.forEach((document) => {
      localBooks.set(document.id, { ...document, local: true });
    });
  }

  const root = document.documentElement;
  const searchInput = document.getElementById("librarySearch");
  const clearSearch = document.getElementById("clearSearch");
  const searchStatus = document.getElementById("searchStatus");
  const emptyState = document.getElementById("emptyState");
  const emptyReset = document.getElementById("emptyReset");
  const searchableEntries = [...document.querySelectorAll(".searchable")];

  function normalise(value) {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (searchInput && clearSearch && searchStatus && emptyState && emptyReset) {
    const filterLibrary = () => {
      const query = normalise(searchInput.value);
      let matches = 0;
      searchableEntries.forEach((entry) => {
        const haystack = normalise(entry.dataset.search || entry.textContent);
        const match = !query || haystack.includes(query);
        entry.hidden = !match;
        if (match) matches += 1;
      });
      clearSearch.hidden = !query;
      emptyState.hidden = matches !== 0;
      searchStatus.textContent = query
        ? `${matches} ${matches === 1 ? "entry follows" : "entries follow"} “${searchInput.value.trim()}”.`
        : `Showing all ${searchableEntries.length} library entries.`;
    };

    searchInput.addEventListener("input", filterLibrary);
    clearSearch.addEventListener("click", () => {
      searchInput.value = "";
      filterLibrary();
      searchInput.focus();
    });
    emptyReset.addEventListener("click", () => {
      searchInput.value = "";
      filterLibrary();
      searchInput.focus();
    });
    filterLibrary();
  }

  const readerDialog = document.getElementById("readerDialog");
  const readerClose = document.getElementById("readerClose");
  const readerTitle = document.getElementById("readerTitle");
  const readerSubtitle = document.getElementById("readerSubtitle");
  const readerNumber = document.getElementById("readerNumber");
  const readerDownload = document.getElementById("readerDownload");
  const readerStage = document.getElementById("readerStage");
  const readerMessage = document.getElementById("readerMessage");
  const readerPaper = document.getElementById("readerPaper");
  const readerCopy = document.getElementById("readerCopy");
  const readerPageMarker = document.getElementById("readerPageMarker");
  const readerCurrentPage = document.getElementById("readerCurrentPage");
  const pageCount = document.getElementById("pageCount");
  const readerProgressBar = document.getElementById("readerProgressBar");
  const zoomOut = document.getElementById("zoomOut");
  const zoomReset = document.getElementById("zoomReset");
  const zoomIn = document.getElementById("zoomIn");
  const readerFullscreen = document.getElementById("readerFullscreen");
  const readerPreviousPage = document.getElementById("readerPreviousPage");
  const readerNextPage = document.getElementById("readerNextPage");
  const readerPageJumpForm = document.getElementById("readerPageJumpForm");
  const readerPageInput = document.getElementById("readerPageInput");
  const readerSectionJumpForm = document.getElementById("readerSectionJumpForm");
  const readerSectionInput = document.getElementById("readerSectionInput");
  const readerSectionOptions = document.getElementById("readerSectionOptions");
  const readerTextColor = document.getElementById("readerTextColor");
  const readerFontFamily = document.getElementById("readerFontFamily");
  const readerFontFile = document.getElementById("readerFontFile");
  const readerResetType = document.getElementById("readerResetType");
  const readerTypeStatus = document.getElementById("readerTypeStatus");
  const readerBackgroundColor = document.getElementById("readerBackgroundColor");
  const readerBackgroundImage = document.getElementById("readerBackgroundImage");
  const readerBackgroundOpacity = document.getElementById("readerBackgroundOpacity");
  const readerBackgroundOpacityValue = document.getElementById("readerBackgroundOpacityValue");
  const readerBackgroundTransparent = document.getElementById("readerBackgroundTransparent");
  const readerClearBackgroundImage = document.getElementById("readerClearBackgroundImage");
  const readerResetBackground = document.getElementById("readerResetBackground");
  const readerBackgroundStatus = document.getElementById("readerBackgroundStatus");
  const readerAtmosphereCustom = document.getElementById("readerAtmosphereCustom");
  const readerMobileControlsToggle = document.getElementById("readerMobileControlsToggle");
  const readerFocusHint = document.getElementById("readerFocusHint");
  const toneButtons = [...document.querySelectorAll("[data-reading-tone]")];
  const atmosphereButtons = [
    ...document.querySelectorAll("[data-reader-atmosphere]"),
  ];

  const readerCache = new Map();
  let readerData = null;
  let currentBook = null;
  let currentPage = 1;
  let zoom = 1;
  let loadSequence = 0;
  let atmosphereChosen = false;
  let scrollFrame = 0;
  let rememberTimer = 0;
  let controlsHideTimer = 0;
  let focusHintTimer = 0;
  let pointerFrame = 0;
  let fallbackFocusMode = false;
  let readerControlsManuallyHidden = false;
  let readerBubbleHandledPointer = false;
  let sectionIndex = [];
  let customReaderFontFace = null;
  let customReaderFontFile = null;
  let readerBackgroundImageUrl = "";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setPressed(buttons, active, key) {
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset[key] === active),
      );
    });
  }

  function setTone(tone) {
    readerDialog.dataset.readingTone = tone;
    setPressed(toneButtons, tone, "readingTone");
  }

  function setAtmosphere(atmosphere) {
    readerDialog.dataset.atmosphere = atmosphere;
    setPressed(atmosphereButtons, atmosphere, "readerAtmosphere");
    atmosphereChosen = true;
  }

  const readerTypeKey = "nyarindo-reader-type";
  const readerTypeDefaults = {
    color: "",
    family: "serif",
    customFileName: "",
  };

  function openReaderTypeDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("nyarindo-reader-type", 2);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("fonts")) {
          database.createObjectStore("fonts", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("backgrounds")) {
          database.createObjectStore("backgrounds", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readStoredReaderFont() {
    const db = await openReaderTypeDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction("fonts", "readonly").objectStore("fonts").get("current");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeStoredReaderFont(record) {
    const db = await openReaderTypeDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("fonts", "readwrite");
      transaction.objectStore("fonts").put({ id: "current", ...record });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function clearStoredReaderFont() {
    const db = await openReaderTypeDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("fonts", "readwrite");
      transaction.objectStore("fonts").delete("current");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  const readerBackgroundKey = "nyarindo-reader-background";
  const readerBackgroundDefaults = {
    enabled: false,
    color: "#2e7181",
    opacity: 28,
    transparent: true,
    imageName: "",
  };

  async function readStoredReaderBackground() {
    const db = await openReaderTypeDb();
    return new Promise((resolve, reject) => {
      const request = db
        .transaction("backgrounds", "readonly")
        .objectStore("backgrounds")
        .get("current");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeStoredReaderBackground(record) {
    const db = await openReaderTypeDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("backgrounds", "readwrite");
      transaction.objectStore("backgrounds").put({ id: "current", ...record });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function clearStoredReaderBackground() {
    const db = await openReaderTypeDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("backgrounds", "readwrite");
      transaction.objectStore("backgrounds").delete("current");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function readReaderBackground() {
    try {
      const stored = JSON.parse(localStorage.getItem(readerBackgroundKey) || "{}");
      return {
        ...readerBackgroundDefaults,
        ...stored,
        opacity: Math.max(0, Math.min(100, Number(stored.opacity) || readerBackgroundDefaults.opacity)),
        transparent: stored.transparent !== false,
      };
    } catch {
      return { ...readerBackgroundDefaults };
    }
  }

  function writeReaderBackground(preferences) {
    try {
      localStorage.setItem(readerBackgroundKey, JSON.stringify(preferences));
    } catch {}
  }

  function applyReaderBackground(preferences = readReaderBackground()) {
    const validColour = /^#[0-9a-f]{6}$/i.test(preferences.color)
      ? preferences.color
      : readerBackgroundDefaults.color;
    const opacity = Math.max(
      0,
      Math.min(100, Number(preferences.opacity) || readerBackgroundDefaults.opacity),
    );
    const hasImage = Boolean(readerBackgroundImageUrl && preferences.imageName);
    const active = Boolean(preferences.enabled);
    readerDialog.style.setProperty("--reader-custom-color", validColour);
    readerDialog.style.setProperty(
      "--reader-custom-color-strength",
      preferences.transparent ? ".34" : ".7",
    );
    readerDialog.style.setProperty(
      "--reader-custom-image-opacity",
      String(opacity / 100),
    );
    readerDialog.style.setProperty(
      "--reader-custom-image",
      hasImage ? `url("${readerBackgroundImageUrl}")` : "none",
    );
    readerDialog.classList.toggle("has-reader-custom-background", active);
    readerDialog.classList.toggle(
      "has-reader-transparent-background",
      Boolean(preferences.transparent),
    );
    readerBackgroundColor.value = validColour;
    readerBackgroundOpacity.value = String(opacity);
    readerBackgroundOpacityValue.textContent = `${opacity}%`;
    readerBackgroundTransparent.checked = Boolean(preferences.transparent);
    readerBackgroundStatus.textContent = active
      ? hasImage
        ? `${preferences.imageName} · ${opacity}% photo · ${preferences.transparent ? "transparent" : "solid"} blend`
        : `${validColour} · ${preferences.transparent ? "transparent" : "solid"} colour`
      : "Original living sky.";
  }

  function readReaderType() {
    try {
      return {
        ...readerTypeDefaults,
        ...JSON.parse(localStorage.getItem(readerTypeKey) || "{}"),
      };
    } catch {
      return { ...readerTypeDefaults };
    }
  }

  function writeReaderType(preferences) {
    try {
      localStorage.setItem(readerTypeKey, JSON.stringify(preferences));
    } catch {}
  }

  function fontStack(family, customAvailable) {
    if (family === "custom" && customAvailable) {
      return '"Drift Reader Custom", var(--serif)';
    }
    return family === "sans"
      ? "var(--sans)"
      : family === "mono"
        ? "var(--mono)"
        : "var(--serif)";
  }

  function applyReaderType(preferences = readReaderType()) {
    const customAvailable = Boolean(customReaderFontFace);
    const family =
      preferences.family === "custom" && !customAvailable
        ? "serif"
        : preferences.family;
    readerDialog.style.setProperty(
      "--reader-font-family",
      fontStack(family, customAvailable),
    );
    readerFontFamily.value = family;
    const customOption = readerFontFamily.querySelector('option[value="custom"]');
    customOption.disabled = !customAvailable;
    customOption.textContent = customAvailable && preferences.customFileName
      ? `Imported · ${preferences.customFileName}`
      : "Imported font";
    if (/^#[0-9a-f]{6}$/i.test(preferences.color)) {
      readerDialog.style.setProperty("--reader-text-color", preferences.color);
      readerDialog.classList.add("has-reader-type");
      readerTextColor.value = preferences.color;
    } else {
      readerDialog.style.removeProperty("--reader-text-color");
      readerDialog.classList.remove("has-reader-type");
      readerTextColor.value =
        root.dataset.theme === "light" ? "#22251f" : "#f0eadc";
    }
  }

  async function installReaderFont(blob, fileName) {
    const extension = fileName.split(".").pop().toLocaleLowerCase();
    const formats = {
      woff2: "woff2",
      woff: "woff",
      ttf: "truetype",
      otf: "opentype",
    };
    const format = formats[extension];
    if (!format) throw new Error("Choose a WOFF2, WOFF, TTF, or OTF font.");
    const buffer = await blob.arrayBuffer();
    const face = new FontFace("Drift Reader Custom", buffer, { style: "normal" });
    await face.load();
    if (customReaderFontFace) document.fonts.delete(customReaderFontFace);
    customReaderFontFace = face;
    customReaderFontFile = { blob, fileName, format };
    document.fonts.add(face);
    await writeStoredReaderFont({ blob, fileName, format });
    const preferences = readReaderType();
    preferences.family = "custom";
    preferences.customFileName = fileName;
    writeReaderType(preferences);
    applyReaderType(preferences);
    readerTypeStatus.textContent = `${fileName} imported locally.`;
  }

  async function restoreReaderType() {
    const preferences = readReaderType();
    try {
      const stored = await readStoredReaderFont();
      if (stored?.blob) {
        const face = new FontFace("Drift Reader Custom", await stored.blob.arrayBuffer(), {
          style: "normal",
        });
        await face.load();
        customReaderFontFace = face;
        customReaderFontFile = stored;
        document.fonts.add(face);
      }
    } catch {
      readerTypeStatus.textContent = "The saved font could not be restored.";
    }
    applyReaderType(preferences);
  }

  async function bakeReaderBackground(file) {
    const bitmap = await createImageBitmap(file);
    const maxSide = 2200;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      bitmap.close();
      throw new Error("The background image could not be prepared.");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const rendered = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.86),
    );
    if (!rendered) throw new Error("The background image could not be compressed.");
    return rendered;
  }

  async function restoreReaderBackground() {
    const preferences = readReaderBackground();
    try {
      const stored = await readStoredReaderBackground();
      if (stored?.blob) {
        if (readerBackgroundImageUrl) URL.revokeObjectURL(readerBackgroundImageUrl);
        readerBackgroundImageUrl = URL.createObjectURL(stored.blob);
        preferences.imageName = stored.fileName || preferences.imageName;
      }
    } catch {
      readerBackgroundStatus.textContent = "The saved background could not be restored.";
    }
    applyReaderBackground(preferences);
  }

  toneButtons.forEach((button) => {
    button.addEventListener("click", () => setTone(button.dataset.readingTone));
  });
  atmosphereButtons.forEach((button) => {
    button.addEventListener("click", () =>
      setAtmosphere(button.dataset.readerAtmosphere),
    );
  });

  readerTextColor.addEventListener("input", () => {
    const preferences = readReaderType();
    preferences.color = readerTextColor.value;
    writeReaderType(preferences);
    applyReaderType(preferences);
    readerTypeStatus.textContent = "Text colour updated.";
  });
  readerFontFamily.addEventListener("change", () => {
    if (readerFontFamily.value === "custom" && !customReaderFontFace) {
      readerFontFamily.value = "serif";
      return;
    }
    const preferences = readReaderType();
    preferences.family = readerFontFamily.value;
    writeReaderType(preferences);
    applyReaderType(preferences);
    readerTypeStatus.textContent = readerFontFamily.value === "custom"
      ? `${preferences.customFileName || "Imported font"} selected.`
      : "Built-in reader font selected.";
  });
  readerFontFile.addEventListener("change", async () => {
    const [file] = readerFontFile.files || [];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      readerTypeStatus.textContent = "Choose a font file smaller than 12 MB.";
      readerFontFile.value = "";
      return;
    }
    try {
      await installReaderFont(file, file.name);
    } catch (error) {
      readerTypeStatus.textContent =
        error instanceof Error ? error.message : "The font could not be imported.";
    } finally {
      readerFontFile.value = "";
    }
  });
  readerResetType.addEventListener("click", async () => {
    if (customReaderFontFace) document.fonts.delete(customReaderFontFace);
    customReaderFontFace = null;
    customReaderFontFile = null;
    await clearStoredReaderFont().catch(() => {});
    writeReaderType({ ...readerTypeDefaults });
    applyReaderType({ ...readerTypeDefaults });
    readerTypeStatus.textContent = "Reader type reset.";
  });

  readerBackgroundColor.addEventListener("input", () => {
    const preferences = readReaderBackground();
    preferences.enabled = true;
    preferences.color = readerBackgroundColor.value;
    writeReaderBackground(preferences);
    applyReaderBackground(preferences);
  });

  readerBackgroundOpacity.addEventListener("input", () => {
    const preferences = readReaderBackground();
    preferences.enabled = true;
    preferences.opacity = Number(readerBackgroundOpacity.value);
    writeReaderBackground(preferences);
    applyReaderBackground(preferences);
  });

  readerBackgroundTransparent.addEventListener("change", () => {
    const preferences = readReaderBackground();
    preferences.enabled = true;
    preferences.transparent = readerBackgroundTransparent.checked;
    writeReaderBackground(preferences);
    applyReaderBackground(preferences);
  });

  readerBackgroundImage.addEventListener("change", async () => {
    const [file] = readerBackgroundImage.files || [];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      readerBackgroundStatus.textContent = "Choose a background image smaller than 20 MB.";
      readerBackgroundImage.value = "";
      return;
    }
    try {
      const rendered = await bakeReaderBackground(file);
      await writeStoredReaderBackground({
        blob: rendered,
        fileName: file.name,
        type: rendered.type,
      });
      if (readerBackgroundImageUrl) URL.revokeObjectURL(readerBackgroundImageUrl);
      readerBackgroundImageUrl = URL.createObjectURL(rendered);
      const preferences = readReaderBackground();
      preferences.enabled = true;
      preferences.imageName = file.name;
      writeReaderBackground(preferences);
      applyReaderBackground(preferences);
      readerBackgroundStatus.textContent = `${file.name} stored locally.`;
    } catch (error) {
      readerBackgroundStatus.textContent =
        error instanceof Error ? error.message : "The background image could not be imported.";
    } finally {
      readerBackgroundImage.value = "";
    }
  });

  readerClearBackgroundImage.addEventListener("click", async () => {
    await clearStoredReaderBackground().catch(() => {});
    if (readerBackgroundImageUrl) URL.revokeObjectURL(readerBackgroundImageUrl);
    readerBackgroundImageUrl = "";
    const preferences = readReaderBackground();
    preferences.imageName = "";
    writeReaderBackground(preferences);
    applyReaderBackground(preferences);
    readerBackgroundStatus.textContent = preferences.enabled
      ? "Background photo removed. The colour layer remains."
      : "Original living sky.";
  });

  readerResetBackground.addEventListener("click", async () => {
    await clearStoredReaderBackground().catch(() => {});
    if (readerBackgroundImageUrl) URL.revokeObjectURL(readerBackgroundImageUrl);
    readerBackgroundImageUrl = "";
    writeReaderBackground({ ...readerBackgroundDefaults });
    applyReaderBackground({ ...readerBackgroundDefaults });
    readerBackgroundStatus.textContent = "Reader backdrop reset to the living sky.";
  });

  function setReaderMessage(message, isError = false) {
    readerMessage.textContent = message;
    readerMessage.classList.toggle("is-error", isError);
    readerMessage.hidden = !message;
  }

  function updateReaderStatus() {
    const total = readerData?.pageCount || 0;
    const activePage = total
      ? Math.min(Math.max(1, currentPage), total)
      : 1;
    pageCount.textContent = total || "—";
    readerCurrentPage.textContent = String(activePage);
    readerPageInput.max = total ? String(total) : "";
    if (document.activeElement !== readerPageInput) {
      readerPageInput.value = total ? String(activePage) : "";
    }
    readerPreviousPage.disabled = !total || activePage <= 1;
    readerNextPage.disabled = !total || activePage >= total;
    const scrollable = readerStage.scrollHeight - readerStage.clientHeight;
    const progress = scrollable > 8
      ? Math.min(1, Math.max(0, readerStage.scrollTop / scrollable))
      : 0;
    readerProgressBar.style.width = total ? `${Math.max(3, progress * 100)}%` : "0";
    zoomReset.textContent = `${Math.round(zoom * 100)}%`;
    readerPageMarker.textContent = total
      ? `Continuous edition · ${total} source pages`
      : "Choose a book to begin";
  }

  function applyZoom() {
    readerPaper.style.setProperty(
      "--reader-font-size",
      `${(1.12 * zoom).toFixed(2)}rem`,
    );
    updateReaderStatus();
  }

  function buildLibraryUrl(bookSlug, page = currentPage) {
    const params = new URLSearchParams({ book: bookSlug });
    if (page > 1) params.set("page", String(page));
    return `/books/?${params.toString()}`;
  }

  function rememberReaderState() {
    if (!currentBook) return;
    try {
      history.replaceState(
        { libraryReader: true },
        "",
        buildLibraryUrl(currentBook.slug, currentPage),
      );
    } catch {}
  }

  function scheduleRememberReaderState() {
    clearTimeout(rememberTimer);
    rememberTimer = window.setTimeout(rememberReaderState, 180);
  }

  function appendPageBlocks(blocks, container) {
    const fragment = document.createDocumentFragment();
    let currentList = null;

    blocks.forEach((block) => {
      if (block?.type === "image" && block.src) {
        currentList = null;
        const figure = document.createElement("figure");
        figure.className = "reader-page-image";
        const image = document.createElement("img");
        image.src = block.src;
        image.alt = block.alt || "Rendered PDF page";
        image.loading = "lazy";
        image.decoding = "async";
        figure.append(image);
        fragment.append(figure);
        return;
      }

      if (block?.type === "link") {
        currentList = null;
        const link = document.createElement("a");
        link.className = "reader-pdf-link";
        link.textContent = block.text || "Open PDF link";
        if (block.targetPage) {
          link.href = `#reader-page-${block.targetPage}`;
          link.addEventListener("click", (event) => {
            event.preventDefault();
            goToPage(block.targetPage);
          });
        } else if (block.url) {
          link.href = block.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        if (link.getAttribute("href")) {
          fragment.append(link);
        }
        return;
      }

      const text = typeof block?.text === "string" ? block.text.trim() : "";
      if (!text) return;

      const contentsMatch = text.replace(/\s+/g, " ").trim().match(
        /^(.*?)(?:\s*(?:\.{2,}|…{2,}|-{2,}|–{2,})\s*|\s{2,})\s*(?:pages?|pg\.?|p\.?)?\s*(\d+)\s*$/iu,
      );
      if (contentsMatch) {
        const targetPage = Math.max(
          1,
          Math.min(Number.parseInt(contentsMatch[2], 10), readerData.pageCount),
        );
        const link = document.createElement("a");
        link.className = "reader-toc-entry";
        link.href = `#reader-page-${targetPage}`;
        link.dataset.readerTarget = String(targetPage);
        link.setAttribute(
          "aria-label",
          `Go to ${contentsMatch[1].trim()}, source page ${targetPage}`,
        );
        const title = document.createElement("span");
        title.className = "reader-toc-title";
        title.textContent = contentsMatch[1].trim();
        const page = document.createElement("span");
        page.className = "reader-toc-page";
        page.textContent = String(targetPage);
        link.append(title, page);
        link.addEventListener("click", (event) => {
          event.preventDefault();
          requestAnimationFrame(() => scrollToSourcePage(targetPage, false));
        });
        currentList = null;
        fragment.append(link);
        return;
      }

      if (block.type === "list-item") {
        if (!currentList) {
          currentList = document.createElement("ul");
          fragment.append(currentList);
        }
        const item = document.createElement("li");
        item.textContent = text;
        currentList.append(item);
        return;
      }

      currentList = null;
      if (block.type === "heading") {
        const heading = document.createElement("h2");
        heading.textContent = text;
        fragment.append(heading);
        return;
      }

      const paragraph = document.createElement("p");
      if (block.type === "caption") paragraph.className = "reader-caption";
      paragraph.textContent = text;
      fragment.append(paragraph);
    });

    container.append(fragment);
  }

  function scrollToSourcePage(pageNumber, smooth = false) {
    if (!readerData) return;
    const bounded = Math.min(
      Math.max(1, Number.parseInt(pageNumber, 10) || 1),
      readerData.pageCount,
    );
    const target = readerCopy.querySelector(
      `[data-reader-page="${bounded}"]`,
    );
    if (!target) return;
    currentPage = bounded;
    const stageRect = readerStage.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top = readerStage.scrollTop + targetRect.top - stageRect.top - 18;
    readerStage.scrollTo({
      top,
      left: 0,
      behavior: smooth && !reducedMotion ? "smooth" : "auto",
    });
    updateReaderStatus();
  }

  function goToPage(pageNumber, smooth = false) {
    if (!readerData) return;
    scrollToSourcePage(pageNumber, smooth);
  }

  function populateSectionJumps() {
    const entries = [];
    const seen = new Set();
    const addEntry = (label, page) => {
      const cleanLabel = String(label || "").trim().replace(/\s+/g, " ");
      const cleanPage = Number.parseInt(page, 10);
      if (!cleanLabel || !Number.isFinite(cleanPage)) return;
      const key = `${cleanLabel.toLocaleLowerCase()}::${cleanPage}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({
        label: cleanLabel,
        searchLabel: cleanLabel.toLocaleLowerCase(),
        page: cleanPage,
      });
    };

    readerCopy.querySelectorAll(".reader-toc-entry").forEach((entry) => {
      addEntry(entry.querySelector(".reader-toc-title")?.textContent, entry.dataset.readerTarget);
    });
    readerCopy.querySelectorAll(".reader-source-page h2").forEach((heading) => {
      addEntry(heading.textContent, heading.closest(".reader-source-page")?.dataset.readerPage);
    });

    sectionIndex = entries;
    const options = document.createDocumentFragment();
    entries.forEach((entry) => {
      const option = document.createElement("option");
      option.value = `${entry.label} — page ${entry.page}`;
      options.append(option);
    });
    readerSectionOptions.replaceChildren(options);
    readerSectionInput.value = "";
  }

  function renderDocument(requestedPage = 1) {
    if (!readerData || !currentBook) return;
    const fragment = document.createDocumentFragment();
    readerData.pages.forEach((page) => {
      const section = document.createElement("section");
      section.className = "reader-source-page";
      section.dataset.readerPage = String(page.number);
      section.id = `reader-page-${page.number}`;
      const marker = document.createElement("p");
      marker.className = "reader-source-page-marker";
      marker.textContent = `Source page ${page.number} of ${readerData.pageCount}`;
      section.append(marker);
      appendPageBlocks(page.blocks || [], section);
      fragment.append(section);
    });
    readerCopy.replaceChildren(fragment);
    readerPaper.setAttribute(
      "aria-label",
      `${currentBook.title}, continuous edition, ${readerData.pageCount} source pages`,
    );
    readerPaper.setAttribute(
      "data-page-count",
      String(readerData.pageCount),
    );
    populateSectionJumps();
    setReaderMessage("");
    currentPage = Math.min(
      Math.max(1, Number.parseInt(requestedPage, 10) || 1),
      readerData.pageCount,
    );
    updateReaderStatus();
    const targetPage = currentPage;
    requestAnimationFrame(() => {
      scrollToSourcePage(targetPage, false);
      requestAnimationFrame(updateReaderStatus);
    });
    if (targetPage > 1) {
      window.setTimeout(() => {
        if (readerData && currentBook) scrollToSourcePage(targetPage, false);
      }, 280);
    }
  }

  function syncVisiblePage() {
    if (!readerData || !currentBook) return;
    const sections = readerCopy.querySelectorAll(".reader-source-page");
    if (!sections.length) return;
    const stageRect = readerStage.getBoundingClientRect();
    const readingLine = stageRect.top + Math.min(190, stageRect.height * 0.3);
    const scrollable = readerStage.scrollHeight - readerStage.clientHeight;
    let activePage = Number(sections[0].dataset.readerPage) || 1;
    if (scrollable > 8 && readerStage.scrollTop >= scrollable - 4) {
      activePage = readerData.pageCount;
    } else {
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= readingLine) {
          activePage = Number(section.dataset.readerPage) || activePage;
        }
      });
    }
    if (activePage !== currentPage) {
      currentPage = activePage;
      scheduleRememberReaderState();
    }
    updateReaderStatus();
  }

  async function getReaderData(bookSlug) {
    if (readerCache.has(bookSlug)) return readerCache.get(bookSlug);
    const response = await fetch(`/books/reader-content/${bookSlug}.json`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Reader request failed: ${response.status}`);
    const data = await response.json();
    if (
      !data ||
      !Array.isArray(data.pages) ||
      !Number.isInteger(data.pageCount) ||
      data.pageCount < 1
    ) {
      throw new Error("Reader data is incomplete");
    }
    readerCache.set(bookSlug, data);
    return data;
  }

  async function openReader(bookSlug, requestedPage = 1) {
    await refreshLocalBooks();
    const book = getBook(bookSlug);
    if (!book) return;
    const sequence = ++loadSequence;
    window.NyarindoPdfLibrary?.releaseReaderUrls();
    currentBook = { ...book, slug: bookSlug };
    readerData = null;
    currentPage = Math.max(1, Number.parseInt(requestedPage, 10) || 1);
    zoom = 1;
    readerTitle.textContent = book.title;
    readerSubtitle.textContent = book.subtitle;
    readerNumber.textContent = book.number;
    readerDownload.href = book.file || "#";
    readerCopy.replaceChildren();
    pageCount.textContent = "—";
    applyZoom();
    if (!atmosphereChosen) {
      setAtmosphere(root.dataset.theme === "light" ? "day" : "night");
    }
    if (!readerDialog.open) readerDialog.showModal();
    rememberReaderState();
    setReaderMessage("Opening the book…");
    try {
      const data = book.local
        ? await window.NyarindoPdfLibrary.getReaderData(bookSlug)
        : await getReaderData(bookSlug);
      if (book.local) {
        readerDownload.href =
          (await window.NyarindoPdfLibrary.getOriginalFileUrl(bookSlug)) || "#";
      }
      if (sequence !== loadSequence) return;
      readerData = data;
      currentPage = Math.min(currentPage, readerData.pageCount);
      applyZoom();
      renderDocument(currentPage);
    } catch {
      if (sequence !== loadSequence) return;
      setReaderMessage(
        "The online reader could not open this edition. Check the connection or download the PDF with the button above.",
        true,
      );
    }
  }

  function closeReader() {
    loadSequence += 1;
    readerData = null;
    currentBook = null;
    readerCopy.replaceChildren();
    window.NyarindoPdfLibrary?.releaseReaderUrls();
    clearTimeout(controlsHideTimer);
    fallbackFocusMode = false;
    setFocusMode(false);
    if (document.fullscreenElement === readerDialog) {
      document.exitFullscreen().catch(() => {});
    }
    if (readerDialog.open) readerDialog.close();
    try {
      history.replaceState({}, "", "/books/");
    } catch {}
  }

  readerClose.addEventListener("click", closeReader);
  readerDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (focusModeActive()) {
      if (document.fullscreenElement === readerDialog) {
        document.exitFullscreen().catch(() => {});
      }
      fallbackFocusMode = false;
      setFocusMode(false);
      return;
    }
    closeReader();
  });
  readerDialog.addEventListener("click", (event) => {
    if (event.target !== readerDialog) return;
    if (focusModeActive()) {
      showReaderControls();
    } else {
      closeReader();
    }
  });
  readerStage.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        syncVisiblePage();
      });
    },
    { passive: true },
  );
  zoomOut.addEventListener("click", () => {
    zoom = Math.max(0.65, Math.round((zoom - 0.15) * 100) / 100);
    applyZoom();
  });
  zoomIn.addEventListener("click", () => {
    zoom = Math.min(2.25, Math.round((zoom + 0.15) * 100) / 100);
    applyZoom();
  });
  zoomReset.addEventListener("click", () => {
    zoom = 1;
    applyZoom();
  });

  readerPreviousPage.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });
  readerNextPage.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });
  readerPageJumpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!readerData) return;
    const page = Number.parseInt(readerPageInput.value, 10);
    if (!Number.isFinite(page)) {
      setReaderMessage("Enter a page number.", true);
      readerPageInput.focus();
      return;
    }
    setReaderMessage("");
    goToPage(page);
    readerPageInput.blur();
  });
  readerSectionJumpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = readerSectionInput.value.trim().toLocaleLowerCase();
    if (!query || !sectionIndex.length) return;
    const match =
      sectionIndex.find((entry) =>
        `${entry.label} — page ${entry.page}`.toLocaleLowerCase() === query
      ) ||
      sectionIndex.find((entry) => entry.searchLabel.includes(query));
    if (!match) {
      setReaderMessage("No section with that name appears in this edition.", true);
      return;
    }
    setReaderMessage("");
    readerSectionInput.value = `${match.label} — page ${match.page}`;
    goToPage(match.page);
    readerSectionInput.blur();
  });

  function focusModeActive() {
    return (
      readerDialog.classList.contains("reader-focus-mode") ||
      document.fullscreenElement === readerDialog
    );
  }

  function hideReaderControls() {
    if (!focusModeActive()) return;
    const focusedControl = readerDialog.querySelector(
      ":is(button, input, select):focus",
    );
    if (focusedControl) {
      scheduleReaderControlHide();
      return;
    }
    readerDialog.classList.add("reader-controls-hidden");
    readerFocusHint.textContent = "Move, tap, or press any key to show controls";
    readerFocusHint.classList.add("is-visible");
  }

  function scheduleReaderControlHide() {
    clearTimeout(controlsHideTimer);
    if (!focusModeActive()) return;
    controlsHideTimer = window.setTimeout(hideReaderControls, 2800);
  }

  function showReaderControls(schedule = true, force = false) {
    if (readerControlsManuallyHidden && !force) return;
    readerControlsManuallyHidden = false;
    readerDialog.classList.remove("reader-controls-hidden");
    readerFocusHint.classList.remove("is-visible");
    clearTimeout(focusHintTimer);
    if (schedule) scheduleReaderControlHide();
  }

  function setFocusMode(active) {
    readerDialog.classList.toggle("reader-focus-mode", active);
    readerDialog.classList.remove("reader-controls-hidden");
    readerControlsManuallyHidden = false;
    clearTimeout(focusHintTimer);
    readerFullscreen.textContent = active ? "Exit fullscreen ×" : "Fullscreen ⛶";
    readerFullscreen.setAttribute("aria-pressed", String(active));
    clearTimeout(controlsHideTimer);
    if (active) {
      readerDialog.querySelector(":focus")?.blur();
      readerFocusHint.textContent = "Move, tap, or press any key to show controls";
      readerFocusHint.classList.add("is-visible");
      window.setTimeout(() => readerFocusHint.classList.remove("is-visible"), 1600);
      scheduleReaderControlHide();
    }
  }

  function setTouchReaderControlsHidden(hidden) {
    readerControlsManuallyHidden = hidden;
    readerDialog.classList.toggle("reader-controls-hidden", hidden);
    readerMobileControlsToggle.setAttribute("aria-pressed", String(hidden));
    readerMobileControlsToggle.setAttribute(
      "aria-label",
      hidden ? "Show reader controls" : "Hide reader controls",
    );
    clearTimeout(controlsHideTimer);
    clearTimeout(focusHintTimer);
    if (hidden) {
      readerDialog.querySelector(":focus")?.blur();
      readerFocusHint.textContent = "Controls hidden · tap the bubble to show";
      readerFocusHint.classList.add("is-visible");
      focusHintTimer = window.setTimeout(
        () => readerFocusHint.classList.remove("is-visible"),
        1900,
      );
    } else {
      readerFocusHint.textContent = "Controls visible";
      readerFocusHint.classList.add("is-visible");
      focusHintTimer = window.setTimeout(
        () => readerFocusHint.classList.remove("is-visible"),
        1100,
      );
      if (focusModeActive()) scheduleReaderControlHide();
    }
  }

  readerMobileControlsToggle.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    readerBubbleHandledPointer = true;
    event.stopPropagation();
    setTouchReaderControlsHidden(
      !readerDialog.classList.contains("reader-controls-hidden"),
    );
  });
  readerMobileControlsToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (readerBubbleHandledPointer) {
      readerBubbleHandledPointer = false;
      return;
    }
    setTouchReaderControlsHidden(
      !readerDialog.classList.contains("reader-controls-hidden"),
    );
  });

  readerFullscreen.addEventListener("click", async () => {
    if (document.fullscreenElement === readerDialog || fallbackFocusMode) {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {}
      fallbackFocusMode = false;
      setFocusMode(false);
      return;
    }
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await readerDialog.requestFullscreen();
        setFocusMode(true);
      }
    } catch {
      fallbackFocusMode = true;
      setFocusMode(true);
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === readerDialog) {
      setFocusMode(true);
    } else if (!fallbackFocusMode) {
      setFocusMode(false);
    }
  });

  readerDialog.addEventListener("pointermove", () => {
    if (!focusModeActive() || pointerFrame || readerControlsManuallyHidden) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      showReaderControls();
    });
  });
  readerDialog.addEventListener("pointerdown", () => {
    if (readerControlsManuallyHidden) return;
    showReaderControls();
  });
  readerDialog.addEventListener("focusin", (event) => {
    if (event.target === readerMobileControlsToggle) return;
    if (
      readerControlsManuallyHidden &&
      !event.target.closest("a, button, input, select, textarea, summary")
    ) {
      return;
    }
    showReaderControls(false, true);
  });
  readerDialog.addEventListener("focusout", scheduleReaderControlHide);

  document.addEventListener("keydown", (event) => {
    if (!readerDialog.open) return;
    showReaderControls(true, true);
    if (event.key === "Escape" && fallbackFocusMode) {
      event.preventDefault();
      fallbackFocusMode = false;
      setFocusMode(false);
      return;
    }
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goToPage(currentPage - 1);
    }
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goToPage(currentPage + 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      goToPage(1);
    }
    if (event.key === "End") {
      event.preventDefault();
      goToPage(readerData?.pageCount || 1);
    }
    if (event.key.toLocaleLowerCase() === "g") {
      event.preventDefault();
      readerPageInput.focus();
      readerPageInput.select();
    }
    if (event.key.toLocaleLowerCase() === "s") {
      event.preventDefault();
      readerSectionInput.focus();
      readerSectionInput.select();
    }
    if (event.key.toLocaleLowerCase() === "f") {
      event.preventDefault();
      readerFullscreen.click();
    }
  });

  let swipeStart = null;
  readerStage.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  readerStage.addEventListener("pointerup", (event) => {
    if (!swipeStart || !event.isPrimary) return;
    const xDistance = event.clientX - swipeStart.x;
    const yDistance = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(xDistance) >= 55 && Math.abs(xDistance) > Math.abs(yDistance)) {
      goToPage(currentPage + (xDistance < 0 ? 1 : -1));
    }
  });
  readerStage.addEventListener("pointercancel", () => {
    swipeStart = null;
  });
  addEventListener("nyarindo:themechange", (event) => {
    if (readerDialog.open && !atmosphereChosen) {
      setAtmosphere(event.detail.theme === "light" ? "day" : "night");
    }
    const preferences = readReaderType();
    if (!preferences.color) applyReaderType(preferences);
  });
  window.NyarindoLibrary = { openReader };
  window.addEventListener("nyarindo:local-library-changed", refreshLocalBooks);

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="/books/?"]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    const book = url.searchParams.get("book");
    if (!getBook(book)) return;
    event.preventDefault();
    openReader(book, url.searchParams.get("page") || 1);
  });

  const openingUrl = new URL(location.href);
  const openingBook = openingUrl.searchParams.get("book");
  restoreReaderType();
  restoreReaderBackground().catch(() => {
    readerBackgroundStatus.textContent = "The saved background could not be restored.";
  });
  refreshLocalBooks().then(() => {
    if (getBook(openingBook)) {
      requestAnimationFrame(() =>
        openReader(openingBook, openingUrl.searchParams.get("page") || 1),
      );
    }
  });
})();
