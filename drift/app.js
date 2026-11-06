(() => {
  "use strict";

  const STORAGE_KEY = "drift.playground.v2";
  const PROFILE_NAME_KEY = "drift.profile-name.v1";
  const YOUTUBE_PLAYLIST = {
    title: "The best songs ever written",
    url: "https://www.youtube.com/playlist?list=PLax6dkIC77xw",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/videoseries?list=PLax6dkIC77xw&rel=0",
  };
  const SUNO_SAMPLE = {
    title: "Peace Pon Eye And Eye",
    url: "https://suno.com/song/1ff0aca8-5405-47fa-8b01-bd9074791cf6",
    embedUrl: "https://suno.com/embed/1ff0aca8-5405-47fa-8b01-bd9074791cf6",
  };
  const SANDBOX_PROMPT = [
    "Build inside my private Drift Playground.",
    "This workspace is local and private. Do not publish, upload, distribute, or publicly expose its files, lyrics, media, notes, identities, or generated tools.",
    "The Playground may link to official public sources, but it must not host or redistribute public music without permission.",
    "You may help me create private lyrics, karaoke timing, albums, playlists, themes, stories, and local tools.",
    "Do not police the private contents of this workspace. Preserve my use of free AI providers and tell me when a cloud provider will process content I send.",
  ].join(" ");
  const defaultLyricTheme = {
    tone: "night",
    background: "#08100d",
    text: "#f7f4ea",
    opacity: 34,
    imageName: "",
    fontName: "",
  };
  const defaultState = {
    trail: [],
    collections: [],
    imports: [],
    lyrics: {
      text: "",
      timings: [],
      mediaName: "",
    },
    lyricTheme: { ...defaultLyricTheme },
    theme: {
      color: "#0b1714",
      opacity: 24,
      transparent: false,
      imageName: "",
      fontName: "",
    },
    updatesEnabled: true,
    toolUsage: {},
  };

  const $ = (id) => document.getElementById(id);
  let state = loadState();
  let databasePromise = null;
  let themeImageUrl = "";
  let profileImageUrl = "";
  let localMediaUrl = "";
  let lyricImageUrl = "";
  let customThemeFont = null;
  let customLyricFont = null;
  let toastTimer = 0;
  let saveTimer = 0;

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        ...defaultState,
        ...stored,
        lyrics: { ...defaultState.lyrics, ...(stored.lyrics || {}) },
        lyricTheme: { ...defaultLyricTheme, ...(stored.lyricTheme || {}) },
        theme: { ...defaultState.theme, ...(stored.theme || {}) },
        trail: Array.isArray(stored.trail) ? stored.trail : [],
        collections: Array.isArray(stored.collections) ? stored.collections : [],
        imports: Array.isArray(stored.imports) ? stored.imports : [],
        toolUsage:
          stored.toolUsage && typeof stored.toolUsage === "object"
            ? stored.toolUsage
            : {},
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState(immediate = false) {
    clearTimeout(saveTimer);
    const write = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        toast("This browser could not save the latest local change.");
      }
    };
    if (immediate) write();
    else saveTimer = window.setTimeout(write, 140);
  }

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("nyarindo-drift-local", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("assets")) {
          request.result.createObjectStore("assets", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }

  async function readAsset(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database
        .transaction("assets", "readonly")
        .objectStore("assets")
        .get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeAsset(id, blob, name = "", type = "") {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("assets", "readwrite");
      transaction.objectStore("assets").put({
        id,
        blob,
        name,
        type: type || blob.type || "",
        savedAt: new Date().toISOString(),
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function deleteAsset(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("assets", "readwrite");
      transaction.objectStore("assets").delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function toast(message) {
    const element = $("toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("show"), 2600);
  }

  function createDownload(fileName, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function dateLabel(value) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return new Date(value).toLocaleString();
    }
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  }

  function recordTrail(type, title, url = "", source = "") {
    state.trail.unshift({
      id: uid("trail"),
      type,
      title,
      url,
      source,
      at: new Date().toISOString(),
    });
    state.trail = state.trail.slice(0, 100);
    saveState();
    renderTrail();
  }

  function sourceFromUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, "").toLocaleLowerCase();
      if (host === "youtu.be" || host.endsWith("youtube.com")) {
        const playlistId = url.searchParams.get("list");
        return {
          provider: playlistId ? "YouTube playlist" : "YouTube",
          embedUrl: playlistId
            ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0`
            : "",
        };
      }
      if (host.endsWith("suno.com")) {
        const songMatch = url.pathname.match(/\/song\/([^/]+)/);
        return {
          provider: "Suno",
          embedUrl: songMatch
            ? `https://suno.com/embed/${encodeURIComponent(songMatch[1])}`
            : "",
        };
      }
      if (host.endsWith("spotify.com")) {
        return { provider: "Spotify", embedUrl: "" };
      }
      if (host.endsWith("soundcloud.com")) {
        return { provider: "SoundCloud", embedUrl: "" };
      }
      if (host.endsWith("bandcamp.com")) {
        return { provider: "Bandcamp", embedUrl: "" };
      }
      return { provider: host, embedUrl: "" };
    } catch {
      return { provider: "Source", embedUrl: "" };
    }
  }

  function renderTrail() {
    const list = $("trailList");
    if (!list) return;
    if (!state.trail.length) {
      const item = document.createElement("li");
      item.textContent =
        "No listening entries yet. Your local trail begins when you play or open a source.";
      list.replaceChildren(item);
      return;
    }
    const fragment = document.createDocumentFragment();
    state.trail.forEach((entry) => {
      const item = document.createElement("li");
      const title = document.createElement(entry.url ? "a" : "strong");
      title.textContent = entry.title;
      if (entry.url) {
        title.href = entry.url;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
      }
      const detail = document.createElement("span");
      detail.textContent = `${entry.type}${entry.source ? ` · ${entry.source}` : ""} · ${dateLabel(entry.at)}`;
      item.append(title, detail);
      fragment.append(item);
    });
    list.replaceChildren(fragment);
  }

  function renderCollections() {
    const list = $("collectionList");
    const select = $("collectionTarget");
    if (!list) return;
    const fragment = document.createDocumentFragment();
    if (!state.collections.length) {
      const item = document.createElement("li");
      item.textContent = "No personal albums yet.";
      fragment.append(item);
    }
    state.collections.forEach((collection) => {
      const item = document.createElement("li");
      item.className = "collection-entry";
      const copy = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = collection.title;
      const description = document.createElement("span");
      description.textContent =
        collection.description || `${collection.items.length} saved sources`;
      copy.append(title, description);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        state.collections = state.collections.filter(
          (candidate) => candidate.id !== collection.id,
        );
        saveState(true);
        renderCollections();
      });
      item.append(copy, remove);
      if (collection.items.length) {
        const sources = document.createElement("ul");
        collection.items.forEach((source) => {
          const sourceItem = document.createElement("li");
          const link = document.createElement("a");
          link.href = source.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = source.title;
          sourceItem.append(link);
          sources.append(sourceItem);
        });
        item.append(sources);
      }
      fragment.append(item);
    });
    list.replaceChildren(fragment);
    if (select) {
      const options = document.createDocumentFragment();
      state.collections.forEach((collection) => {
        const option = document.createElement("option");
        option.value = collection.id;
        option.textContent = collection.title;
        options.append(option);
      });
      select.replaceChildren(options);
      select.disabled = !state.collections.length;
    }
  }

  function openOfficialPlayer(container, source) {
    if (!source.embedUrl || container.querySelector("iframe")) return;
    const frame = document.createElement("iframe");
    frame.src = source.embedUrl;
    frame.title = `${source.title} from ${source.provider}`;
    frame.loading = "lazy";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    container.append(frame);
  }

  function renderImports() {
    const list = $("importList");
    if (!list) return;
    const fragment = document.createDocumentFragment();
    state.imports.forEach((entry) => {
      const item = document.createElement("li");
      const copy = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = entry.title;
      const detail = document.createElement("span");
      detail.textContent = `${entry.provider}${entry.description ? ` · ${entry.description}` : ""}`;
      copy.append(title, detail);
      const actions = document.createElement("div");
      actions.className = "import-actions";
      const open = document.createElement("a");
      open.href = entry.url;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "Open source ↗";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        state.imports = state.imports.filter((candidate) => candidate.id !== entry.id);
        saveState(true);
        renderImports();
      });
      actions.append(open, remove);
      item.append(copy, actions);
      if (entry.embedUrl) {
        const load = document.createElement("button");
        load.type = "button";
        load.className = "soft-button import-player-button";
        load.textContent = "Load official player";
        load.addEventListener("click", () => {
          openOfficialPlayer(item, entry);
          recordTrail("played import", entry.title, entry.url, entry.provider);
        });
        item.append(load);
      }
      fragment.append(item);
    });
    list.replaceChildren(fragment);
  }

  function loadYoutubePlayer() {
    const media = $("youtubeMedia");
    if (!media || media.querySelector("iframe")) return;
    media.replaceChildren();
    const frame = document.createElement("iframe");
    frame.src = YOUTUBE_PLAYLIST.embedUrl;
    frame.title = "Official YouTube playlist: The best songs ever written";
    frame.loading = "eager";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    media.append(frame);
    recordTrail(
      "played playlist",
      YOUTUBE_PLAYLIST.title,
      YOUTUBE_PLAYLIST.url,
      "YouTube",
    );
  }

  function loadSunoPlayer() {
    const media = $("sunoMedia");
    if (!media || media.querySelector("iframe")) return;
    media.hidden = false;
    const frame = document.createElement("iframe");
    frame.src = SUNO_SAMPLE.embedUrl;
    frame.title = `${SUNO_SAMPLE.title} on Suno`;
    frame.loading = "lazy";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    media.replaceChildren(frame);
    recordTrail("played source", SUNO_SAMPLE.title, SUNO_SAMPLE.url, "Suno");
  }

  function applyTheme() {
    const theme = state.theme;
    document.documentElement.style.setProperty(
      "--drift-custom-colour",
      theme.color,
    );
    document.documentElement.style.setProperty(
      "--drift-custom-image-opacity",
      String(Math.max(0, Math.min(100, theme.opacity)) / 100),
    );
    if ($("themeColor")) $("themeColor").value = theme.color;
    if ($("themeOpacity")) $("themeOpacity").value = String(theme.opacity);
    if ($("themeTransparent")) {
      $("themeTransparent").checked = Boolean(theme.transparent);
    }
    if (customThemeFont) {
      document.documentElement.style.setProperty(
        "--drift-custom-font",
        '"Drift Theme Font", var(--sans)',
      );
    } else {
      document.documentElement.style.removeProperty("--drift-custom-font");
    }
  }

  async function applyStoredThemeImage() {
    const asset = await readAsset("theme-image-rendered").catch(() => null);
    if (themeImageUrl) URL.revokeObjectURL(themeImageUrl);
    themeImageUrl = asset?.blob ? URL.createObjectURL(asset.blob) : "";
    const layer = $("customThemeLayer");
    if (layer) {
      layer.style.backgroundImage = themeImageUrl ? `url("${themeImageUrl}")` : "";
      layer.classList.toggle("has-image", Boolean(themeImageUrl));
    }
  }

  async function bakeThemeImage(sourceBlob) {
    const bitmap = await createImageBitmap(sourceBlob);
    const maxSide = 2200;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!state.theme.transparent) {
      context.fillStyle = state.theme.color;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const rendered = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.86),
    );
    return rendered || sourceBlob;
  }

  async function rebakeStoredThemeImage() {
    const source = await readAsset("theme-image-source").catch(() => null);
    if (!source?.blob) return;
    const rendered = await bakeThemeImage(source.blob);
    await writeAsset(
      "theme-image-rendered",
      rendered,
      source.name,
      rendered.type,
    );
    await applyStoredThemeImage();
  }

  function applyStoredThemeFont(blob, fileName) {
    if (!blob) return Promise.resolve();
    const extension = fileName.split(".").pop()?.toLocaleLowerCase();
    const formats = {
      woff2: "woff2",
      woff: "woff",
      ttf: "truetype",
      otf: "opentype",
    };
    if (!formats[extension]) return Promise.reject(new Error("Unsupported font"));
    return blob
      .arrayBuffer()
      .then((buffer) => new FontFace("Drift Theme Font", buffer))
      .then((face) => face.load())
      .then((face) => {
        if (customThemeFont) document.fonts.delete(customThemeFont);
        customThemeFont = face;
        document.fonts.add(face);
        applyTheme();
      });
  }

  async function restoreTheme() {
    applyTheme();
    await applyStoredThemeImage().catch(() => {});
    const font = await readAsset("theme-font").catch(() => null);
    if (font?.blob) {
      await applyStoredThemeFont(font.blob, font.name).catch(() => {});
    }
  }

  function applyLyricTheme() {
    const stage = $("lyricStage");
    if (!stage) return;
    const theme = state.lyricTheme;
    stage.dataset.tone = theme.tone;
    stage.style.setProperty("--lyric-background", theme.background);
    stage.style.setProperty("--lyric-text", theme.text);
    stage.style.setProperty(
      "--lyric-image-opacity",
      String(Math.max(0, Math.min(100, theme.opacity)) / 100),
    );
    stage.style.setProperty(
      "--lyric-font",
      customLyricFont ? '"Drift Lyric Font", var(--serif)' : "var(--serif)",
    );
    document.querySelectorAll("[data-lyric-tone]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.lyricTone === theme.tone),
      );
    });
    if ($("lyricBackgroundColor")) $("lyricBackgroundColor").value = theme.background;
    if ($("lyricTextColor")) $("lyricTextColor").value = theme.text;
    if ($("lyricImageOpacity")) $("lyricImageOpacity").value = String(theme.opacity);
  }

  async function applyStoredLyricImage() {
    const image = await readAsset("lyric-theme-image").catch(() => null);
    if (lyricImageUrl) URL.revokeObjectURL(lyricImageUrl);
    lyricImageUrl = image?.blob ? URL.createObjectURL(image.blob) : "";
    const layer = $("lyricStageImage");
    if (layer) {
      layer.style.backgroundImage = lyricImageUrl ? `url("${lyricImageUrl}")` : "";
      layer.classList.toggle("has-image", Boolean(lyricImageUrl));
    }
  }

  function applyStoredLyricFont(blob, fileName) {
    if (!blob) return Promise.resolve();
    const extension = fileName.split(".").pop()?.toLocaleLowerCase();
    if (!["woff2", "woff", "ttf", "otf"].includes(extension)) {
      return Promise.reject(new Error("Unsupported font"));
    }
    return blob
      .arrayBuffer()
      .then((buffer) => new FontFace("Drift Lyric Font", buffer))
      .then((face) => face.load())
      .then((face) => {
        if (customLyricFont) document.fonts.delete(customLyricFont);
        customLyricFont = face;
        document.fonts.add(face);
        applyLyricTheme();
      });
  }

  async function restoreLyricTheme() {
    applyLyricTheme();
    await applyStoredLyricImage().catch(() => {});
    const font = await readAsset("lyric-theme-font").catch(() => null);
    if (font?.blob) {
      await applyStoredLyricFont(font.blob, font.name).catch(() => {});
    }
  }

  async function storeLyricThemeImage(file) {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.86),
    );
    if (!blob) throw new Error("Image encoding failed");
    await writeAsset("lyric-theme-image", blob, file.name, blob.type);
  }

  function setProfileUi(name, hasPhoto) {
    const displayName = name || "Local listener";
    const initial = displayName.trim().charAt(0).toLocaleUpperCase() || "D";
    if ($("profileDisplayName")) $("profileDisplayName").textContent = displayName;
    if ($("profileInitial")) $("profileInitial").textContent = initial;
    document.querySelectorAll(".profile-avatar-large > span").forEach((element) => {
      element.textContent = initial;
    });
    if ($("profileAvatarSmall")) $("profileAvatarSmall").hidden = !hasPhoto;
    if ($("profileAvatar")) $("profileAvatar").hidden = !hasPhoto;
  }

  async function restoreProfile() {
    const name = localStorage.getItem(PROFILE_NAME_KEY) || "";
    const avatar = await readAsset("profile-avatar").catch(() => null);
    if (profileImageUrl) URL.revokeObjectURL(profileImageUrl);
    profileImageUrl = avatar?.blob ? URL.createObjectURL(avatar.blob) : "";
    if ($("profileAvatarSmall")) $("profileAvatarSmall").src = profileImageUrl;
    if ($("profileAvatar")) $("profileAvatar").src = profileImageUrl;
    setProfileUi(name, Boolean(profileImageUrl));
  }

  async function resizeAvatar(file) {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      320,
      320,
    );
    bitmap.close();
    return new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.84),
    );
  }

  function renderLyrics() {
    if ($("lyricEditor") && $("lyricEditor").value !== state.lyrics.text) {
      $("lyricEditor").value = state.lyrics.text;
    }
    const count = state.lyrics.timings.length;
    const total = state.lyrics.text
      .split(/\r?\n/)
      .filter((line) => line.trim()).length;
    if ($("timingStatus")) {
      $("timingStatus").textContent = count
        ? `${count} of ${total} lyric lines timed${state.lyrics.mediaName ? ` against ${state.lyrics.mediaName}` : ""}.`
        : "Prime the local recording, then tap each line as it begins.";
    }
    renderLyricPreview();
  }

  function registerMediaSession() {
    if (!("mediaSession" in navigator) || !$("localMedia")) return;
    const media = $("localMedia");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.lyrics.mediaName || "Drift private recording",
      artist: "Private Playground",
      album: "On this device",
    });
    try {
      navigator.mediaSession.setActionHandler("play", () => media.play());
      navigator.mediaSession.setActionHandler("pause", () => media.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        media.currentTime = Math.max(0, media.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        media.currentTime = Math.min(
          media.duration || media.currentTime + 10,
          media.currentTime + 10,
        );
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (Number.isFinite(details.seekTime)) media.currentTime = details.seekTime;
      });
    } catch {}
  }

  async function restoreLocalMedia() {
    const media = $("localMedia");
    const stored = await readAsset("lyric-media").catch(() => null);
    if (!media || !stored?.blob) return;
    if (localMediaUrl) URL.revokeObjectURL(localMediaUrl);
    localMediaUrl = URL.createObjectURL(stored.blob);
    media.src = localMediaUrl;
    media.hidden = false;
    state.lyrics.mediaName = stored.name || state.lyrics.mediaName;
    renderLyrics();
    registerMediaSession();
  }

  function currentLyricLines() {
    return state.lyrics.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function renderLyricPreview() {
    const preview = $("lyricPreview");
    if (!preview) return;
    const lines = currentLyricLines();
    if (!lines.length) {
      const empty = document.createElement("p");
      empty.className = "lyric-preview-empty";
      empty.textContent = "Your lyrics will appear here as you write.";
      preview.replaceChildren(empty);
      return;
    }
    const media = $("localMedia");
    const currentTime =
      media && Number.isFinite(media.currentTime) ? media.currentTime : -1;
    let activeIndex = -1;
    state.lyrics.timings.forEach((timing, index) => {
      if (timing.at <= currentTime) activeIndex = index;
    });
    const fragment = document.createDocumentFragment();
    lines.forEach((line, index) => {
      const paragraph = document.createElement("p");
      if (index === activeIndex) paragraph.className = "is-active";
      if (
        state.lyrics.timings[index] &&
        Math.abs(state.lyrics.timings[index].at - currentTime) < 0.12
      ) {
        paragraph.setAttribute("aria-current", "true");
      }
      paragraph.textContent = line;
      fragment.append(paragraph);
    });
    preview.replaceChildren(fragment);
  }

  function tapNextLine() {
    const lines = currentLyricLines();
    const nextIndex = state.lyrics.timings.length;
    if (!lines.length) {
      toast("Write or paste at least one lyric line first.");
      return;
    }
    if (nextIndex >= lines.length) {
      toast("Every line is already timed. Clear the timing to try again.");
      return;
    }
    const media = $("localMedia");
    const time = media && Number.isFinite(media.currentTime) ? media.currentTime : 0;
    state.lyrics.timings.push({
      line: lines[nextIndex],
      at: Math.max(0, Math.round(time * 100) / 100),
    });
    saveState();
    renderLyrics();
    renderLyricPreview();
    toast(`Timed: ${lines[nextIndex]}`);
  }

  function lyricExport() {
    const lines = currentLyricLines();
    const timings = [...state.lyrics.timings].sort((a, b) => a.at - b.at);
    const lrc = ["[ti:Private Drift Playground]", "[by:Local listener]"];
    timings.forEach((timing) => {
      const minutes = Math.floor(timing.at / 60);
      const seconds = (timing.at % 60).toFixed(2).padStart(5, "0");
      lrc.push(`[${String(minutes).padStart(2, "0")}:${seconds}]${timing.line}`);
    });
    if (!timings.length) {
      lines.forEach((line) => lrc.push(`[00:00.00]${line}`));
    }
    return lrc.join("\n");
  }

  function reorderTools() {
    const nav = $("adaptiveTools");
    if (!nav) return;
    const buttons = [...nav.querySelectorAll("button[data-tool]")];
    const originalOrder = new Map(buttons.map((button, index) => [button, index]));
    buttons
      .sort((a, b) => {
        const aScore = Number(state.toolUsage[a.dataset.tool] || 0);
        const bScore = Number(state.toolUsage[b.dataset.tool] || 0);
        return bScore - aScore || originalOrder.get(a) - originalOrder.get(b);
      })
      .forEach((button) => nav.append(button));
  }

  function recordToolUse(tool) {
    state.toolUsage[tool] = Number(state.toolUsage[tool] || 0) + 1;
    saveState();
    reorderTools();
  }

  function trailMarkdown() {
    const lines = [
      "# My Drift Trail",
      "",
      `Exported ${new Date().toISOString()}`,
      "",
    ];
    if (!state.trail.length) lines.push("No entries yet.");
    state.trail.forEach((entry) => {
      lines.push(`## ${entry.title}`);
      lines.push("");
      lines.push(`- Action: ${entry.type}`);
      if (entry.source) lines.push(`- Source: ${entry.source}`);
      if (entry.url) lines.push(`- Link: ${entry.url}`);
      lines.push(`- Noticed: ${entry.at}`);
      lines.push("");
    });
    return lines.join("\n");
  }

  function playgroundJson() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profileName: localStorage.getItem(PROFILE_NAME_KEY) || "",
        trail: state.trail,
        collections: state.collections,
        imports: state.imports,
        lyrics: state.lyrics,
        theme: state.theme,
        updatesEnabled: state.updatesEnabled,
      },
      null,
      2,
    );
  }

  function bindDialogs() {
    const profileDialog = $("profileDialog");
    const faqDialog = $("faqDialog");
    const rightsDialog = $("rightsDialog");
    $("profileButton")?.addEventListener("click", () => {
      $("profileName").value = localStorage.getItem(PROFILE_NAME_KEY) || "";
      profileDialog?.showModal();
    });
    $("faqButton")?.addEventListener("click", () => faqDialog?.showModal());
    $("faqClose")?.addEventListener("click", () => faqDialog?.close());
    $("rightsButton")?.addEventListener("click", () => rightsDialog?.showModal());
    $("rightsClose")?.addEventListener("click", () => rightsDialog?.close());
    faqDialog?.addEventListener("click", (event) => {
      if (event.target === faqDialog) faqDialog.close();
    });
    rightsDialog?.addEventListener("click", (event) => {
      if (event.target === rightsDialog) rightsDialog.close();
    });
    profileDialog?.addEventListener("click", (event) => {
      if (event.target === profileDialog) profileDialog.close();
    });
  }

  function bindPlayground() {
    $("playgroundToggle")?.addEventListener("click", (event) => {
      const body = $("playgroundBody");
      const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
      event.currentTarget.setAttribute("aria-expanded", String(!expanded));
      event.currentTarget.querySelector("span").textContent = expanded ? "Open" : "Collapse";
      event.currentTarget.querySelector("b").textContent = expanded ? "⌄" : "⌃";
      body?.classList.toggle("is-collapsed", expanded);
    });

    document.querySelectorAll("[data-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = $(button.dataset.tool);
        recordToolUse(button.dataset.tool);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (target) {
          target.classList.add("tool-focus");
          window.setTimeout(() => target.classList.remove("tool-focus"), 900);
        }
      });
    });

    $("collectionForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = $("collectionName").value.trim();
      if (!title) return;
      state.collections.unshift({
        id: uid("collection"),
        title,
        description: $("collectionDescription").value.trim(),
        items: [],
        createdAt: new Date().toISOString(),
      });
      saveState(true);
      event.currentTarget.reset();
      renderCollections();
      toast(`Created ${title}.`);
    });

    $("collectionItemForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const collection = state.collections.find(
        (entry) => entry.id === $("collectionTarget").value,
      );
      const title = $("collectionItemTitle").value.trim();
      const url = $("collectionItemUrl").value.trim();
      if (!collection || !title || !url) return;
      try {
        new URL(url);
      } catch {
        toast("Enter a complete source URL.");
        return;
      }
      collection.items.push({ title, url });
      saveState(true);
      event.currentTarget.reset();
      renderCollections();
      toast(`Saved ${title} to ${collection.title}.`);
    });

    $("importForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const url = $("playlistUrl").value.trim();
      const provider = sourceFromUrl(url);
      const title =
        $("playlistTitle").value.trim() ||
        `${provider.provider} playlist`;
      state.imports.unshift({
        id: uid("import"),
        title,
        url,
        provider: provider.provider,
        embedUrl: provider.embedUrl,
        description: $("playlistDescription").value.trim(),
        importedAt: new Date().toISOString(),
      });
      saveState(true);
      event.currentTarget.reset();
      renderImports();
      $("importStatus").textContent =
        provider.embedUrl
          ? `${provider.provider} source saved locally. Open the official player when you want to listen.`
          : `${provider.provider} source saved as a link. This static build does not claim metadata or embedding it cannot verify.`;
      recordTrail("saved import", title, url, provider.provider);
    });

    $("exportTrail")?.addEventListener("click", () => {
      createDownload(
        `drift-trail-${new Date().toISOString().slice(0, 10)}.md`,
        trailMarkdown(),
        "text/markdown;charset=utf-8",
      );
      toast("Trail exported as Markdown.");
    });
    $("exportPlayground")?.addEventListener("click", () => {
      createDownload(
        `drift-playground-${new Date().toISOString().slice(0, 10)}.json`,
        playgroundJson(),
        "application/json",
      );
      toast("Playground metadata exported as JSON.");
    });

    $("clearTrail")?.addEventListener("click", () => {
      if (state.trail.length && !window.confirm("Clear this device's Drift trail?")) {
        return;
      }
      state.trail = [];
      saveState(true);
      renderTrail();
      toast("Trail cleared.");
    });

    $("copySandboxPrompt")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(SANDBOX_PROMPT);
        toast("Private sandbox prompt copied.");
      } catch {
        createDownload("drift-private-sandbox-prompt.txt", SANDBOX_PROMPT, "text/plain");
        toast("Clipboard access was unavailable, so the prompt was downloaded.");
      }
    });

    const updates = $("updateToggle");
    if (updates) {
      const render = () => {
        updates.setAttribute("aria-pressed", String(state.updatesEnabled));
        updates.textContent = state.updatesEnabled
          ? "Receiving updates"
          : "Updates paused";
      };
      render();
      updates.addEventListener("click", () => {
        state.updatesEnabled = !state.updatesEnabled;
        saveState(true);
        render();
        toast(
          state.updatesEnabled
            ? "Quiet artist updates resumed."
            : "Artist updates paused. Your listening is not affected.",
        );
      });
    }

    $("exportLyrics")?.addEventListener("click", () => {
      createDownload(
        `${(state.lyrics.mediaName || "private-lyrics").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-")}.lrc`,
        lyricExport(),
        "text/plain;charset=utf-8",
      );
      toast("Lyrics and timing exported locally.");
    });
    $("clearLyrics")?.addEventListener("click", () => {
      state.lyrics = { ...defaultState.lyrics };
      $("lyricEditor").value = "";
      deleteAsset("lyric-media").catch(() => {});
      if ($("localMedia")) {
        $("localMedia").pause();
        $("localMedia").removeAttribute("src");
        $("localMedia").hidden = true;
      }
      if (localMediaUrl) URL.revokeObjectURL(localMediaUrl);
      localMediaUrl = "";
      saveState(true);
      renderLyrics();
      toast("Private lyric workspace cleared.");
    });
    $("tapTiming")?.addEventListener("click", tapNextLine);

    document.querySelectorAll("[data-lyric-tone]").forEach((button) => {
      button.addEventListener("click", () => {
        state.lyricTheme.tone = button.dataset.lyricTone;
        saveState(true);
        applyLyricTheme();
      });
    });
    $("lyricBackgroundColor")?.addEventListener("input", () => {
      state.lyricTheme.background = $("lyricBackgroundColor").value;
      saveState();
      applyLyricTheme();
    });
    $("lyricTextColor")?.addEventListener("input", () => {
      state.lyricTheme.text = $("lyricTextColor").value;
      saveState();
      applyLyricTheme();
    });
    $("lyricImageOpacity")?.addEventListener("input", () => {
      state.lyricTheme.opacity = Number($("lyricImageOpacity").value);
      saveState();
      applyLyricTheme();
    });
    $("lyricThemeImage")?.addEventListener("change", async () => {
      const [file] = $("lyricThemeImage").files || [];
      if (!file) return;
      try {
        await storeLyricThemeImage(file);
        state.lyricTheme.imageName = file.name;
        saveState(true);
        await applyStoredLyricImage();
        $("lyricThemeStatus").textContent = `${file.name} stored locally.`;
      } catch {
        $("lyricThemeStatus").textContent = "This background image could not be loaded.";
      } finally {
        $("lyricThemeImage").value = "";
      }
    });
    $("lyricThemeFont")?.addEventListener("change", async () => {
      const [file] = $("lyricThemeFont").files || [];
      if (!file) return;
      try {
        await applyStoredLyricFont(file, file.name);
        await writeAsset("lyric-theme-font", file, file.name, file.type);
        state.lyricTheme.fontName = file.name;
        saveState(true);
        $("lyricThemeStatus").textContent = `${file.name} imported locally.`;
      } catch {
        $("lyricThemeStatus").textContent = "Choose a valid WOFF2, WOFF, TTF, or OTF font.";
      } finally {
        $("lyricThemeFont").value = "";
      }
    });
    $("resetLyricTheme")?.addEventListener("click", async () => {
      state.lyricTheme = { ...defaultLyricTheme };
      await Promise.all([
        deleteAsset("lyric-theme-image"),
        deleteAsset("lyric-theme-font"),
      ]).catch(() => {});
      if (customLyricFont) document.fonts.delete(customLyricFont);
      customLyricFont = null;
      await applyStoredLyricImage();
      applyLyricTheme();
      saveState(true);
      $("lyricThemeStatus").textContent = "Lyric window restored to its night theme.";
    });

    $("themeColor")?.addEventListener("input", () => {
      state.theme.color = $("themeColor").value;
      saveState();
      applyTheme();
    });
    $("themeColor")?.addEventListener("change", () => {
      if (!state.theme.transparent) {
        rebakeStoredThemeImage().catch(() => {});
      }
    });
    $("themeOpacity")?.addEventListener("input", () => {
      state.theme.opacity = Number($("themeOpacity").value);
      saveState();
      applyTheme();
    });
    $("themeTransparent")?.addEventListener("change", async () => {
      state.theme.transparent = $("themeTransparent").checked;
      saveState();
      applyTheme();
      await rebakeStoredThemeImage().catch(() => {});
    });
    $("resetTheme")?.addEventListener("click", async () => {
      state.theme = { ...defaultState.theme };
      await Promise.all([
        deleteAsset("theme-image-source"),
        deleteAsset("theme-image-rendered"),
        deleteAsset("theme-font"),
      ]).catch(() => {});
      if (customThemeFont) document.fonts.delete(customThemeFont);
      customThemeFont = null;
      await applyStoredThemeImage();
      applyTheme();
      saveState(true);
      $("themeStatus").textContent = "Theme reset to Drift.";
    });

    document.querySelectorAll("a[href*='youtube.com'], a[href*='suno.com']").forEach((link) => {
      link.addEventListener("click", () => {
        const provider = sourceFromUrl(link.href).provider;
        recordTrail("opened source", link.textContent.trim(), link.href, provider);
      });
    });
  }

  function bindMedia() {
    $("youtubePlay")?.addEventListener("click", loadYoutubePlayer);
    $("sunoPlay")?.addEventListener("click", loadSunoPlayer);
    $("lyricEditor")?.addEventListener("input", () => {
      state.lyrics.text = $("lyricEditor").value;
      state.lyrics.timings = [];
      saveState();
      renderLyrics();
    });
    $("localMediaFile")?.addEventListener("change", async () => {
      const [file] = $("localMediaFile").files || [];
      if (!file) return;
      if (file.size > 300 * 1024 * 1024) {
        toast("Choose a local media file smaller than 300 MB.");
        return;
      }
      const media = $("localMedia");
      if (localMediaUrl) URL.revokeObjectURL(localMediaUrl);
      localMediaUrl = URL.createObjectURL(file);
      media.src = localMediaUrl;
      media.hidden = false;
      state.lyrics.mediaName = file.name;
      saveState(true);
      await writeAsset("lyric-media", file, file.name, file.type).catch(() => {
        toast("The file can play now but could not be restored after reload.");
      });
      renderLyrics();
      registerMediaSession();
      toast("Local media loaded privately.");
    });
    $("localMedia")?.addEventListener("timeupdate", renderLyricPreview);
  }

  function bindProfile() {
    $("profileForm")?.addEventListener("submit", async (event) => {
      if (event.submitter?.value !== "save") return;
      const name = $("profileName").value.trim().slice(0, 60);
      localStorage.setItem(PROFILE_NAME_KEY, name);
      const [photo] = $("profilePhoto").files || [];
      if (photo) {
        try {
          const resized = await resizeAvatar(photo);
          if (resized) await writeAsset("profile-avatar", resized, "avatar.webp", "image/webp");
        } catch {
          toast("The profile picture could not be processed.");
        }
      }
      await restoreProfile();
      toast(name ? `Welcome, ${name}.` : "Local profile saved.");
    });
  }

  function bindThemeLab() {
    $("themeImage")?.addEventListener("change", async () => {
      const [file] = $("themeImage").files || [];
      if (!file) return;
      try {
        const rendered = await bakeThemeImage(file);
        await writeAsset("theme-image-source", file, file.name, file.type);
        await writeAsset("theme-image-rendered", rendered, file.name, rendered.type);
        state.theme.imageName = file.name;
        saveState(true);
        await applyStoredThemeImage();
        $("themeStatus").textContent = `${file.name} stored locally.`;
      } catch {
        $("themeStatus").textContent =
          "This image could not be processed by the browser.";
      } finally {
        $("themeImage").value = "";
      }
    });
    $("themeFont")?.addEventListener("change", async () => {
      const [file] = $("themeFont").files || [];
      if (!file) return;
      if (!/\.(?:woff2?|ttf|otf)$/i.test(file.name)) {
        $("themeStatus").textContent = "Choose a WOFF2, WOFF, TTF, or OTF font.";
        return;
      }
      try {
        await applyStoredThemeFont(file, file.name);
        await writeAsset("theme-font", file, file.name, file.type);
        state.theme.fontName = file.name;
        saveState(true);
        $("themeStatus").textContent = `${file.name} imported locally.`;
      } catch {
        $("themeStatus").textContent = "This font could not be loaded.";
      } finally {
        $("themeFont").value = "";
      }
    });
  }

  async function registerWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.register("./service-worker.js", { scope: "/drift/" });
    } catch {}
  }

  async function init() {
    bindDialogs();
    bindPlayground();
    bindMedia();
    bindProfile();
    bindThemeLab();
    renderTrail();
    renderCollections();
    renderImports();
    renderLyrics();
    reorderTools();
    await Promise.all([
      restoreProfile(),
      restoreTheme(),
      restoreLocalMedia(),
      restoreLyricTheme(),
    ]);
    registerWorker();
  }

  init();
})();
