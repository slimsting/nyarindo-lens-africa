(() => {
  "use strict";

  const form = document.getElementById("localPdfForm");
  const fileInput = document.getElementById("localPdfFile");
  const titleInput = document.getElementById("localPdfTitle");
  const status = document.getElementById("localPdfStatus");
  const list = document.getElementById("localPdfList");
  const databaseName = "nyarindo-library-local";
  const databaseVersion = 1;
  let databasePromise = null;
  let pdfjsPromise = null;
  let activeReaderUrls = [];

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("documents")) {
          database.createObjectStore("documents", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("readerData")) {
          database.createObjectStore("readerData", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("files")) {
          database.createObjectStore("files", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("pageImages")) {
          database.createObjectStore("pageImages", { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }

  async function readAll(storeName) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function readRecord(storeName, key) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeDocumentBatch(documentRecord, readerRecord, fileRecord, images = []) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        ["documents", "readerData", "files", "pageImages"],
        "readwrite",
      );
      transaction.objectStore("documents").put(documentRecord);
      transaction.objectStore("readerData").put(readerRecord);
      transaction.objectStore("files").put(fileRecord);
      const imageStore = transaction.objectStore("pageImages");
      images.forEach((image) => imageStore.put(image));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function deleteDocument(documentId) {
    const database = await openDatabase();
    const images = await readAll("pageImages");
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        ["documents", "readerData", "files", "pageImages"],
        "readwrite",
      );
      transaction.objectStore("documents").delete(documentId);
      transaction.objectStore("readerData").delete(documentId);
      transaction.objectStore("files").delete(documentId);
      const imageStore = transaction.objectStore("pageImages");
      images
        .filter((image) => image.key.startsWith(`${documentId}:`))
        .forEach((image) => imageStore.delete(image.key));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function loadPdfJs() {
    if (pdfjsPromise) return pdfjsPromise;
    pdfjsPromise = import("/books/vendor/pdfjs/pdf.min.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/books/vendor/pdfjs/pdf.worker.min.mjs";
      return pdfjs;
    });
    return pdfjsPromise;
  }

  function cleanTitle(file) {
    return (titleInput.value.trim() || file.name.replace(/\.pdf$/i, ""))
      .replace(/\s+/g, " ")
      .slice(0, 120);
  }

  function normaliseText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function blocksFromTextItems(items) {
    const positioned = items
      .filter((item) => typeof item.str === "string" && item.str.trim() && item.transform)
      .map((item) => ({
        text: normaliseText(item.str),
        x: Number(item.transform[4]) || 0,
        y: Number(item.transform[5]) || 0,
        size: Math.max(1, Math.abs(Number(item.transform[3]) || Number(item.transform[0]) || 10)),
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    const lines = [];
    positioned.forEach((item) => {
      let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(1.5, item.size * 0.32));
      if (!line) {
        line = { y: item.y, size: item.size, items: [] };
        lines.push(line);
      }
      line.items.push(item);
      line.size = Math.max(line.size, item.size);
      line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length;
    });

    const contentLines = lines
      .map((line) => ({
        y: Math.round(line.y * 10) / 10,
        size: Math.round(line.size * 10) / 10,
        text: normaliseText(
          line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" "),
        ),
      }))
      .filter((line) => line.text)
      .sort((a, b) => b.y - a.y);

    if (!contentLines.length) return [];
    const sizes = contentLines.map((line) => line.size).sort((a, b) => a - b);
    const medianSize = sizes[Math.floor(sizes.length / 2)] || 10;
    const blocks = [];
    let paragraph = "";
    let previous = null;

    const flushParagraph = () => {
      if (!paragraph) return;
      blocks.push({ type: "paragraph", text: paragraph });
      paragraph = "";
    };

    contentLines.forEach((line) => {
      const heading =
        line.size >= medianSize * 1.35 &&
        line.text.length <= 180;
      if (heading) {
        flushParagraph();
        blocks.push({ type: "heading", text: line.text });
        previous = line;
        return;
      }

      const verticalGap = previous ? Math.max(0, previous.y - line.y) : 0;
      const continues =
        paragraph &&
        verticalGap <= Math.max(12, medianSize * 1.9) &&
        !/[.!?]["'”’)]?$/.test(previous.text);
      paragraph = `${paragraph}${continues ? " " : "\n"}${line.text}`.trim();
      if (!continues) {
        const [first, ...rest] = paragraph.split("\n");
        if (first) blocks.push({ type: "paragraph", text: first });
        paragraph = rest.join(" ");
      }
      previous = line;
    });
    flushParagraph();
    return blocks;
  }

  async function getInternalPage(pdf, destination) {
    let resolved = destination;
    if (typeof resolved === "string") {
      resolved = await pdf.getDestination(resolved);
    }
    if (!Array.isArray(resolved) || !resolved.length) return null;
    const first = resolved[0];
    if (Number.isInteger(first)) return first + 1;
    try {
      return (await pdf.getPageIndex(first)) + 1;
    } catch {
      return null;
    }
  }

  async function extractAnnotations(pdf, page, positionedItems) {
    const annotations = await page.getAnnotations({ intent: "display" });
    const links = [];

    for (const annotation of annotations) {
      if (annotation.subtype !== "Link") continue;
      const rect = annotation.rect;
      const overlappingText = Array.isArray(rect)
        ? positionedItems
            .filter((item) => {
              const itemX = Number(item.transform?.[4]) || 0;
              const itemY = Number(item.transform?.[5]) || 0;
              return (
                itemX >= rect[0] - 3 &&
                itemX <= rect[2] + 3 &&
                itemY >= rect[1] - 3 &&
                itemY <= rect[3] + 3
              );
            })
            .sort((a, b) => (Number(a.transform?.[4]) || 0) - (Number(b.transform?.[4]) || 0))
            .map((item) => normaliseText(item.str))
            .join(" ")
        : "";

      if (annotation.dest) {
        const targetPage = await getInternalPage(pdf, annotation.dest);
        if (targetPage) {
          links.push({
            text: overlappingText || `Go to page ${targetPage}`,
            targetPage,
          });
        }
        continue;
      }

      const rawUrl = annotation.url || annotation.unsafeUrl || "";
      try {
        const url = new URL(rawUrl, location.href);
        if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) continue;
        links.push({
          text: normaliseText(annotation.contents) || overlappingText || url.hostname || rawUrl,
          url: url.href,
        });
      } catch {}
    }

    const seen = new Set();
    return links.filter((link) => {
      const key = link.targetPage ? `page:${link.targetPage}` : `url:${link.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function renderPageImage(page, documentId) {
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.8, Math.max(1, 1500 / baseViewport.width));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    return {
      key: `${documentId}:${page.pageNumber}`,
      blob,
    };
  }

  async function convertPdf(file) {
    const pdfjs = await loadPdfJs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      cMapUrl: "/books/vendor/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/books/vendor/pdfjs/standard_fonts/",
      wasmUrl: "/books/vendor/pdfjs/wasm/",
    });
    loadingTask.onPassword = (updatePassword, reason) => {
      const enteredPassword = window.prompt(
        reason === 1
          ? "This PDF needs a password:"
          : "That password was not accepted. Try again:",
      );
      if (enteredPassword === null) {
        loadingTask.destroy();
        return;
      }
      updatePassword(enteredPassword);
    };

    const pdf = await loadingTask.promise;
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    const existing = (await readAll("documents")).find((document) => document.hash === hash);
    if (existing) {
      await loadingTask.destroy();
      return existing;
    }

    const documentId = `local-${crypto.randomUUID()}`;
    const pages = [];
    const images = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      status.textContent = `Converting page ${pageNumber} of ${pdf.numPages}…`;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const textBlocks = blocksFromTextItems(textContent.items);
      const characterCount = textContent.items.reduce(
        (total, item) => total + String(item.str || "").trim().length,
        0,
      );
      const links = await extractAnnotations(pdf, page, textContent.items);
      const blocks = [...textBlocks];

      if (characterCount < 20) {
        const image = await renderPageImage(page, documentId);
        if (image.blob) {
          images.push(image);
          blocks.push({
            type: "image",
            assetKey: image.key,
            alt: `${cleanTitle(file)}, rendered page ${pageNumber}`,
          });
        }
      }

      links.forEach((link) => {
        blocks.push({
          type: "link",
          text: link.text,
          targetPage: link.targetPage || null,
          url: link.url || "",
        });
      });

      if (!blocks.length) {
        blocks.push({
          type: "paragraph",
          text: "This page contains no extractable text.",
        });
      }
      pages.push({ number: pageNumber, blocks });
    }

    const title = cleanTitle(file);
    const importedAt = new Date().toISOString();
    const documentRecord = {
      id: documentId,
      title,
      subtitle: "Local PDF · private to this device",
      number: "LOCAL PDF",
      fileName: file.name,
      fileType: file.type || "application/pdf",
      bytes: file.size,
      pageCount: pdf.numPages,
      hash,
      importedAt,
      local: true,
    };
    const readerRecord = {
      id: documentId,
      pageCount: pdf.numPages,
      pages,
    };
    const fileRecord = {
      id: documentId,
      blob: file,
      fileName: file.name,
    };
    await writeDocumentBatch(documentRecord, readerRecord, fileRecord, images);
    await loadingTask.destroy();
    return documentRecord;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    return `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MB`;
  }

  function renderLibrary(documents) {
    const fragment = document.createDocumentFragment();
    documents
      .sort((a, b) => String(b.importedAt).localeCompare(String(a.importedAt)))
      .forEach((localDocument) => {
        const card = document.createElement("article");
        card.className = "local-pdf-card";
        const copy = document.createElement("div");
        const label = document.createElement("p");
        label.className = "book-role";
        label.textContent = "LOCAL PDF";
        const heading = document.createElement("h3");
        heading.textContent = localDocument.title;
        const detail = document.createElement("p");
        detail.textContent = `${localDocument.pageCount} pages · ${formatBytes(localDocument.bytes)} · stored on this device`;
        copy.append(label, heading, detail);

        const actions = document.createElement("div");
        actions.className = "local-pdf-actions";
        const open = document.createElement("button");
        open.type = "button";
        open.textContent = "Open in reader";
        open.addEventListener("click", () => window.NyarindoLibrary?.openReader(localDocument.id));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "local-pdf-remove";
        remove.textContent = "Remove";
        remove.addEventListener("click", async () => {
          if (!window.confirm(`Remove “${localDocument.title}” and its local PDF from this device?`)) return;
          await deleteDocument(localDocument.id);
          status.textContent = `Removed “${localDocument.title}” from this device.`;
          await renderLibraryView();
          window.dispatchEvent(new CustomEvent("nyarindo:local-library-changed"));
        });
        actions.append(open, remove);
        card.append(copy, actions);
        fragment.append(card);
      });
    list.replaceChildren(fragment);
  }

  async function renderLibraryView() {
    renderLibrary(await readAll("documents"));
  }

  async function listBooks() {
    return (await readAll("documents")).sort((a, b) =>
      String(b.importedAt).localeCompare(String(a.importedAt)),
    );
  }

  async function getBook(documentId) {
    return readRecord("documents", documentId);
  }

  async function getReaderData(documentId) {
    const data = await readRecord("readerData", documentId);
    if (!data) throw new Error("The local PDF data could not be found.");
    const pages = await Promise.all(
      data.pages.map(async (page) => ({
        ...page,
        blocks: await Promise.all(
          (page.blocks || []).map(async (block) => {
            if (block.type !== "image" || !block.assetKey) return block;
            const image = await readRecord("pageImages", block.assetKey);
            if (!image?.blob) return block;
            const url = URL.createObjectURL(image.blob);
            activeReaderUrls.push(url);
            return { ...block, src: url };
          }),
        ),
      })),
    );
    return { pageCount: data.pageCount, pages };
  }

  async function getOriginalFileUrl(documentId) {
    const file = await readRecord("files", documentId);
    if (!file?.blob) return "";
    const url = URL.createObjectURL(file.blob);
    activeReaderUrls.push(url);
    return url;
  }

  function releaseReaderUrls() {
    activeReaderUrls.forEach((url) => URL.revokeObjectURL(url));
    activeReaderUrls = [];
  }

  window.NyarindoPdfLibrary = {
    listBooks,
    getBook,
    getReaderData,
    getOriginalFileUrl,
    releaseReaderUrls,
    deleteDocument,
  };

  if (form && fileInput && titleInput && status && list) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const [file] = fileInput.files || [];
      if (!file) return;
      if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
        status.textContent = "Choose a PDF file.";
        return;
      }
      if (file.size > 250 * 1024 * 1024) {
        status.textContent = "Choose a PDF smaller than 250 MB.";
        return;
      }
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        status.textContent = "Reading the PDF on this device…";
        const document = await convertPdf(file);
        status.textContent = `“${document.title}” is ready in this browser.`;
        form.reset();
        await renderLibraryView();
        window.dispatchEvent(new CustomEvent("nyarindo:local-library-changed"));
      } catch (error) {
        console.error(error);
        status.textContent = "The PDF could not be converted. It may be encrypted, damaged, or unsupported.";
      } finally {
        submit.disabled = false;
      }
    });
    renderLibraryView().catch(() => {
      status.textContent = "Local PDF storage is unavailable in this browser.";
    });
  }
})();
