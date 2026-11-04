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

  function filterLibrary() {
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
  }

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

  toneButtons.forEach((button) => {
    button.addEventListener("click", () => setTone(button.dataset.readingTone));
  });
  atmosphereButtons.forEach((button) => {
    button.addEventListener("click", () =>
      setAtmosphere(button.dataset.readerAtmosphere),
    );
  });

  function setReaderMessage(message, isError = false) {
    readerMessage.textContent = message;
    readerMessage.classList.toggle("is-error", isError);
    readerMessage.hidden = !message;
  }

  function updateReaderStatus() {
    const total = readerData?.pageCount || 0;
    pageCount.textContent = total || "—";
    readerCurrentPage.textContent = total
      ? String(Math.min(Math.max(1, currentPage), total))
      : "1";
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
      const text = typeof block?.text === "string" ? block.text.trim() : "";
      if (!text) return;

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

  function scrollToSourcePage(pageNumber, smooth = true) {
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
    const book = books[bookSlug];
    if (!book) return;
    const sequence = ++loadSequence;
    currentBook = { ...book, slug: bookSlug };
    readerData = null;
    currentPage = Math.max(1, Number.parseInt(requestedPage, 10) || 1);
    zoom = 1;
    readerTitle.textContent = book.title;
    readerSubtitle.textContent = book.subtitle;
    readerNumber.textContent = book.number;
    readerDownload.href = book.file;
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
      const data = await getReaderData(bookSlug);
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
    if (readerDialog.open) readerDialog.close();
    try {
      history.replaceState({}, "", "/books/");
    } catch {}
  }

  readerClose.addEventListener("click", closeReader);
  readerDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeReader();
  });
  readerDialog.addEventListener("click", (event) => {
    if (event.target === readerDialog) closeReader();
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
  readerFullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        readerFullscreen.textContent = "Fullscreen ⛶";
      } else {
        await readerDialog.requestFullscreen();
        readerFullscreen.textContent = "Exit fullscreen ⛶";
      }
    } catch {
      readerFullscreen.textContent = "Fullscreen unavailable";
    }
  });
  document.addEventListener("fullscreenchange", () => {
    readerFullscreen.textContent = document.fullscreenElement
      ? "Exit fullscreen ⛶"
      : "Fullscreen ⛶";
  });

  document.addEventListener("keydown", (event) => {
    if (!readerDialog.open) return;
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPage(currentPage - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToPage(currentPage + 1);
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
    if (Math.abs(xDistance) < 55 || Math.abs(xDistance) < Math.abs(yDistance)) {
      return;
    }
    goToPage(currentPage + (xDistance < 0 ? 1 : -1));
  });
  readerStage.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  addEventListener("nyarindo:themechange", (event) => {
    if (readerDialog.open && !atmosphereChosen) {
      setAtmosphere(event.detail.theme === "light" ? "day" : "night");
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="/books/?"]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    const book = url.searchParams.get("book");
    if (!books[book]) return;
    event.preventDefault();
    openReader(book, url.searchParams.get("page") || 1);
  });

  const openingUrl = new URL(location.href);
  const openingBook = openingUrl.searchParams.get("book");
  if (books[openingBook]) {
    requestAnimationFrame(() =>
      openReader(openingBook, openingUrl.searchParams.get("page") || 1),
    );
  }
})();
