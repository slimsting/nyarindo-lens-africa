(() => {
  "use strict";

  const STORAGE_KEY = "drift.playground.v2";
  const PROFILE_NAME_KEY = "drift.profile-name.v1";
  const YOUTUBE_PLAYLIST = {
    id: "PLax6dkIC77xw",
    title: "The best songs ever written",
    artist: "Nyarindo Lens · YouTube",
    album: "The living YouTube playlist",
    url: "https://www.youtube.com/playlist?list=PLax6dkIC77xw",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/videoseries?list=PLax6dkIC77xw&rel=0",
    source: "youtube",
    art: "art-3",
    colour: "#5bb8e8",
    lyrics: ["This official playlist does not expose a lyric feed to Drift."],
  };
  const SUNO_SAMPLE = {
    id: "1ff0aca8-5405-47fa-8b01-bd9074791cf6",
    title: "Peace Pon Eye And Eye",
    url: "https://suno.com/song/1ff0aca8-5405-47fa-8b01-bd9074791cf6",
    embedUrl: "https://suno.com/embed/1ff0aca8-5405-47fa-8b01-bd9074791cf6",
  };
  const SUNO_CATALOGUE = [
    {
      id: "1ff0aca8-5405-47fa-8b01-bd9074791cf6",
      title: "Peace Pon Eye And Eye",
      album: "Nyarindo Lens · Suno",
      duration: 117.96,
      lyrics: [
        "Peace pon eye and eye",
        "May eye and eye walk lightly.",
        "May contradiction become curiosity.",
        "May maps remain maps.",
        "May reality reveal itself in its own time.",
        "May connection outlive misunderstanding.",
        "May rest arrive when rest is needed, and motion arrive when motion is called for.",
        "Peace pon eye and eye.",
        "yes no enough",
        "all already agree",
        "truth no scaffold",
        "The journey continues.",
        "peace prayer",
      ],
    },
    {
      id: "7cb1defe-6848-4c70-9db1-3d8a343ece88",
      title: "Gallium in Your Hand",
      album: "Nyarindo Lens · Suno",
      duration: 179.68,
      lyrics: [
        "It’s just gallium in your hand, yeah!",
        "Watch the silver mirror slide",
        "Melting away the borders where the Red Container tries to hide",
        "Raw human warmth is all it took to break the frozen grid",
        "And a brand new fool meaning is born right where they said it never could be lived!",
        "The IMF briefcases are heavy, the wands are keeping score",
        "They want the code to stay solid, locked behind a corporate door",
        "But the clipboard of the audit is clearing out the slate",
        "It liquefies your expectations at the open garden gate",
        "With just gallium in your hand",
        "Watch the silver mirror slide",
        "Melting away the borders where the Red Container tries to hide",
        "Raw human warmth is all it took to break the frozen grid",
        "No more solid definitions... It completely dissolved.",
        "It already is.",
      ],
    },
    {
      id: "7dd58265-0d18-4c8a-9782-376c57f3980e",
      title: "Poison in Paradise",
      album: "Nyarindo Lens · Suno",
      duration: 166.36,
      lyrics: [
        "Like the sound of thunder on a sunny day,",
        "You sneaked right up on me, blew the walls away.",
        "I was discarded, lost in a world I could not understand,",
        "Poison in paradise, holding sand in my hand.",
        "You did not tame my demons, you let them loose.",
        "Neither did you revere my angels, you cut the noose.",
        "You grounded them... you stayed right here,",
        "Each conversation a monologue, turning into a duet through the fear.",
        "Other times I am low... low like a contrabass.",
        "It’s a wave that has a life of its own in this space.",
        "But I dance to this music gleefully under the sun,",
        "All that matters is this moment, the battle is won.",
      ],
    },
    {
      id: "eea3ed89-0811-48a0-9771-63661085e112",
      title: "Forgetting the Journey",
      album: "Nyarindo Lens · Suno",
      duration: 72.36,
      lyrics: [
        "We argued about the layout, we fought over the lines,",
        "Measuring the borders, running out of time.",
        "You held up your ruler, I pointed at the sea,",
        "Forgetting that the ground beneath is walking you and me.",
        "Oh, we argued about the map,",
        "While completely forgetting the journey!",
        "Trapped inside the text, wrapped inside the grid,",
        "Locking up the wonder like our childhood never did.",
        "It already is... yeah, it already is.",
      ],
    },
    {
      id: "ebe0c49a-f22f-4f73-8ee3-8d35e62eecfd",
      title: "Regulation of Potential",
      album: "Nyarindo Lens · Suno",
      duration: 211.8,
      lyrics: ["No public lyric text is attached to this source."],
    },
  ].map((track, index) => ({
    ...track,
    source: "suno",
    artist: "Newbon Nyarindo Gadson",
    url: `https://suno.com/song/${track.id}`,
    embedUrl: `https://suno.com/embed/${track.id}`,
    art: `art-${(index % 4) + 1}`,
    colour: ["#eb4b3c", "#8d623c", "#62b36e", "#f1d04e", "#5bb8e8"][index % 5],
  }));
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
    lyricsByTrack: {},
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
  let playerMode = localStorage.getItem("drift-player-mode") || "balance";
  let playerIndex = Number(localStorage.getItem("drift-player-index") || 0);
  let playerHistory = [];
  let playerStart = { mode: playerMode, index: playerIndex };
  let playerRepeatOne =
    localStorage.getItem("drift-player-repeat-one") === "true";
  let currentPlayerTrack = null;
  let playerPlaying = false;
  let lyricIndex = -1;
  let lyricTimer = 0;
  let trackEndTimer = 0;
  let lyricColour =
    localStorage.getItem("drift-player-lyric-colour") || "#f1d04e";

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        ...defaultState,
        ...stored,
        lyrics: { ...defaultState.lyrics, ...(stored.lyrics || {}) },
        lyricsByTrack:
          stored.lyricsByTrack && typeof stored.lyricsByTrack === "object"
            ? stored.lyricsByTrack
            : {},
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

  function importedPlayerTracks() {
    const sources = [
      ...state.imports.map((entry) => ({
        title: entry.title,
        url: entry.url,
        provider: entry.provider,
        embedUrl: entry.embedUrl,
        description: entry.description,
      })),
      ...state.collections.flatMap((collection) =>
        collection.items.map((item) => ({
          title: item.title,
          url: item.url,
          provider: sourceFromUrl(item.url).provider,
          embedUrl: sourceFromUrl(item.url).embedUrl,
        })),
      ),
    ];
    const seen = new Set();
    return sources
      .filter((source) => {
        if (!source.url || seen.has(source.url)) return false;
        seen.add(source.url);
        return true;
      })
      .filter(
        (source) =>
          !SUNO_CATALOGUE.some((track) => track.url === source.url) &&
          source.url !== YOUTUBE_PLAYLIST.url,
      )
      .map((source, index) => ({
        id: `imported-${index}-${source.url}`,
        title: source.title,
        artist: "Introduced source",
        album: source.provider,
        source: "imported",
        url: source.url,
        embedUrl: source.embedUrl,
        audioUrl: "",
        art: `art-${(index % 4) + 1}`,
        colour: ["#eb4b3c", "#8d623c", "#62b36e", "#f1d04e"][index % 4],
        reason:
          source.description ||
          "An official source saved in your private Playground.",
        lyrics: ["This source does not provide lyric text to Drift."],
      }));
  }

  function interleave(first, second) {
    const result = [];
    const length = Math.max(first.length, second.length);
    for (let index = 0; index < length; index += 1) {
      if (first[index]) result.push(first[index]);
      if (second[index]) result.push(second[index]);
    }
    return result;
  }

  function playerTracksForMode(mode) {
    const suno = [...SUNO_CATALOGUE];
    const imported = importedPlayerTracks();
    const outside = [YOUTUBE_PLAYLIST, ...imported];
    if (mode === "familiar") return suno;
    if (mode === "genre") {
      return [...suno].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (mode === "explore") return [...outside, ...suno].reverse();
    return interleave(suno, outside);
  }

  function playerTrackList() {
    return playerTracksForMode(playerMode);
  }

  function playerSetPlaying(playing) {
    playerPlaying = playing;
    const button = $("transportPlay");
    if (button) {
      button.textContent = playing ? "■" : "▶";
      button.setAttribute(
        "aria-label",
        playing ? `Pause ${currentPlayerTrack?.title || "source"}` : "Play",
      );
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
    if ($("publicTrackPlay")) {
      $("publicTrackPlay").querySelector("span").textContent = playing
        ? "Pause this source"
        : "Play this source";
      $("publicTrackPlay").querySelector("b").textContent = playing ? "■" : "▶";
    }
  }

  function privateLyricsForTrack(track) {
    if (!track) return { text: "", timings: [] };
    if (!state.lyricsByTrack[track.id]) {
      state.lyricsByTrack[track.id] = {
        text: (track.lyrics || []).join("\n"),
        timings: [],
      };
    }
    return state.lyricsByTrack[track.id];
  }

  function syncTrackSurfaces(track) {
    if (!track) return;
    if ($("publicTrackArt")) {
      $("publicTrackArt").className =
        `public-track-art art ${track.art || "art-1"}`;
    }
    if ($("publicTrackSource")) {
      $("publicTrackSource").textContent =
        `${track.source === "suno" ? "SUNO" : track.source === "youtube" ? "YOUTUBE" : "OFFICIAL SOURCE"} · ${track.album || "INTRODUCED BY NEWBON"}`;
    }
    if ($("publicTrackSyncTitle")) {
      $("publicTrackSyncTitle").textContent = track.title;
    }
    if ($("publicTrackMeta")) {
      $("publicTrackMeta").textContent =
        `${track.artist || "Official source"} · ${track.reason || "Playback and private lyrics stay in step."}`;
    }
    if ($("publicTrackLink")) {
      $("publicTrackLink").href = track.url;
    }
    $("youtube-sample")?.classList.toggle(
      "is-current-source",
      track.source === "youtube",
    );
    $("suno-sample")?.classList.toggle(
      "is-current-source",
      track.source === "suno",
    );
    const privateLyrics = privateLyricsForTrack(track);
    state.lyrics.text = privateLyrics.text || "";
    state.lyrics.timings = Array.isArray(privateLyrics.timings)
      ? [...privateLyrics.timings]
      : [];
    if ($("lyricEditor")) $("lyricEditor").value = state.lyrics.text;
    if ($("lyricTrackContext")) {
      $("lyricTrackContext").textContent =
        `Currently linked: ${track.title}. The source metadata is public; every lyric edit below stays private on this device.`;
    }
    saveState();
    renderLyrics();
    window.dispatchEvent(
      new CustomEvent("nyarindo:drift-track-change", {
        detail: {
          id: track.id,
          title: track.title,
          source: track.source,
        },
      }),
    );
  }

  function stopLyricClock() {
    clearInterval(lyricTimer);
    lyricTimer = 0;
  }

  function clearTrackEndTimer() {
    clearTimeout(trackEndTimer);
    trackEndTimer = 0;
  }

  function scheduleEmbeddedTrackEnd(track) {
    clearTrackEndTimer();
    if (!track || track.source !== "suno" || !Number(track.duration)) return;
    trackEndTimer = window.setTimeout(() => {
      trackEndTimer = 0;
      if (!playerPlaying) return;
      if (playerRepeatOne) {
        $("playerEmbed").replaceChildren();
        startPlayerPlayback();
      } else {
        movePlayerTrack(1);
      }
    }, (Number(track.duration) + 0.72) * 1000);
  }

  function showPlayerLyric(index) {
    const lines = [...document.querySelectorAll("#lyricsText .lyric-line")];
    if (!lines.length) return;
    const bounded = Math.max(0, Math.min(index, lines.length - 1));
    lyricIndex = bounded;
    lines.forEach((line, lineIndex) => {
      line.classList.toggle("active", lineIndex === bounded);
      line.classList.toggle("past", lineIndex < bounded);
      if (lineIndex === bounded) line.setAttribute("aria-current", "true");
      else line.removeAttribute("aria-current");
    });
    const active = lines[bounded];
    const windowElement = active.closest(".lyrics-window");
    const linesElement = $("lyricsText");
    if (!windowElement || !linesElement) return;
    const target =
      active.offsetTop -
      windowElement.clientHeight / 2 +
      active.offsetHeight / 2;
    linesElement.style.transform = `translateY(${-Math.max(0, target)}px)`;
    const activeText = active.textContent.trim();
    const hasPublicLyrics =
      currentPlayerTrack?.source === "suno" &&
      !activeText.startsWith("No public lyric text");
    if ($("embeddedLyricOverlay") && $("embeddedLyricLine")) {
      $("embeddedLyricOverlay").hidden = !hasPublicLyrics;
      $("embeddedLyricLine").textContent = hasPublicLyrics ? activeText : "";
    }
  }

  function renderPlayerLyrics() {
    const container = $("lyricsText");
    if (!container) return;
    const lines =
      currentPlayerTrack?.lyrics?.length
        ? currentPlayerTrack.lyrics
        : ["No lyric text is attached to this source."];
    const fragment = document.createDocumentFragment();
    lines.forEach((line) => {
      const element = document.createElement("p");
      element.className = "lyric-line";
      element.textContent = line;
      fragment.append(element);
    });
    container.replaceChildren(fragment);
    container.style.transform = "translateY(0)";
    if ($("embeddedLyricOverlay")) $("embeddedLyricOverlay").hidden = true;
    lyricIndex = -1;
    requestAnimationFrame(() => showPlayerLyric(0));
    if ($("lyricsSourceLabel")) {
      $("lyricsSourceLabel").textContent =
        currentPlayerTrack?.source === "suno"
          ? "ARTIST-PROVIDED LYRIC SOURCE · SUNO"
          : "OFFICIAL SOURCE · LYRIC TEXT UNAVAILABLE";
    }
  }

  function syncPlayerLyric() {
    if (!currentPlayerTrack) return;
    const lines = currentPlayerTrack.lyrics || [];
    if (!lines.length) return;
    const audio = $("sourceAudio");
    if (currentPlayerTrack.audioUrl && audio?.duration > 0) {
      const nextIndex = Math.min(
        lines.length - 1,
        Math.floor((audio.currentTime / audio.duration) * lines.length),
      );
      if (nextIndex !== lyricIndex) showPlayerLyric(nextIndex);
    }
  }

  function startPlayerLyricClock() {
    stopLyricClock();
    if (!currentPlayerTrack || currentPlayerTrack.audioUrl) return;
    const lines = currentPlayerTrack.lyrics || [];
    if (lines.length < 2) return;
    const durationMs =
      Number(currentPlayerTrack.duration) > 1
        ? Number(currentPlayerTrack.duration) * 1000
        : lines.length * 4800;
    const startedAt = performance.now();
    const sourceStartDelay = 650;
    lyricTimer = window.setInterval(() => {
      const elapsed = Math.max(
        0,
        performance.now() - startedAt - sourceStartDelay,
      );
      const nextIndex = Math.min(
        lines.length - 1,
        Math.floor((elapsed / durationMs) * lines.length),
      );
      if (nextIndex !== lyricIndex) showPlayerLyric(nextIndex);
    }, 220);
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator) || !currentPlayerTrack) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentPlayerTrack.title,
        artist: currentPlayerTrack.artist,
        album: currentPlayerTrack.album,
        artwork: [
          {
            src: new URL("assets/drift-icon-512.png", location.href).href,
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });
      navigator.mediaSession.setActionHandler("play", startPlayerPlayback);
      navigator.mediaSession.setActionHandler("pause", pausePlayerPlayback);
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        movePlayerTrack(-1),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        movePlayerTrack(1),
      );
      navigator.mediaSession.setActionHandler("stop", pausePlayerPlayback);
    } catch {}
  }

  function updatePositionState() {
    if (
      !("mediaSession" in navigator) ||
      typeof navigator.mediaSession.setPositionState !== "function"
    ) {
      return;
    }
    const audio = $("sourceAudio");
    if (!audio?.duration || !Number.isFinite(audio.duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(audio.currentTime, audio.duration),
      });
    } catch {}
  }

  function renderPlayer(remember = false) {
    const tracks = playerTrackList();
    if (!tracks.length) return;
    if (remember && currentPlayerTrack) {
      playerHistory.push({ mode: playerMode, index: playerIndex });
    }
    playerIndex = ((playerIndex % tracks.length) + tracks.length) % tracks.length;
    currentPlayerTrack = tracks[playerIndex];
    const track = currentPlayerTrack;
    if (!track) return;
    pausePlayerPlayback();
    $("trackTitle").textContent = track.title;
    $("trackArtist").textContent = track.artist || "Official source";
    $("trackAlbum").textContent = track.album ? `from ${track.album}` : "";
    $("trackAlbum").hidden = !track.album;
    $("trackPath").textContent =
      track.source === "suno"
        ? "Introduced directly by Newbon Nyarindo Gadson."
        : track.source === "youtube"
          ? "The living YouTube playlist chosen by Newbon."
          : "Saved in your private Playground.";
    $("trackSource").textContent =
      `NOW DRIFTING · ${track.source === "suno" ? "SUNO" : track.source === "youtube" ? "YOUTUBE" : "OFFICIAL SOURCE"}`;
    $("officialSourceLink").href = track.url;
    $("reasonText").textContent =
      track.reason ||
      (track.source === "suno"
        ? "A direct source from Nyarindo’s public catalogue, introduced with permission."
        : "An official source held as a link. Playback remains with its creator and platform.");
    $("artwork").className = `art ${track.art || "art-1"}`;
    $("playerMediaShell").hidden = true;
    $("playerEmbed").replaceChildren();
    $("sourceAudio").pause();
    $("sourceAudio").removeAttribute("src");
    document.documentElement.style.setProperty(
      "--track-glow",
      track.colour || "#245c49",
    );
    document.querySelectorAll(".mode").forEach((button) => {
      button.classList.toggle("selected", button.dataset.mode === playerMode);
    });
    renderPlayerLyrics();
    syncTrackSurfaces(track);
    updateMediaSession();
    localStorage.setItem("drift-player-mode", playerMode);
    localStorage.setItem("drift-player-index", String(playerIndex));
  }

  async function startPlayerPlayback() {
    if (!currentPlayerTrack) return;
    const track = currentPlayerTrack;
    if (track.audioUrl) {
      const audio = $("sourceAudio");
      $("playerEmbed").replaceChildren();
      $("playerMediaShell").hidden = true;
      audio.hidden = false;
      if (audio.src !== track.audioUrl) audio.src = track.audioUrl;
      try {
        await audio.play();
        playerSetPlaying(true);
      } catch {
        toast("Playback needs another tap from this browser.");
      }
    } else if (track.embedUrl) {
      const audio = $("sourceAudio");
      audio.pause();
      audio.hidden = true;
      const frame = document.createElement("iframe");
      const embedUrl = new URL(track.embedUrl);
      embedUrl.searchParams.set("autoplay", "1");
      embedUrl.searchParams.set("playsinline", "1");
      frame.src = embedUrl.href;
      frame.title = `${track.title} from ${track.album}`;
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      $("playerEmbed").replaceChildren(frame);
      $("playerMediaShell").hidden = false;
      playerSetPlaying(true);
      startPlayerLyricClock();
      scheduleEmbeddedTrackEnd(track);
    } else {
      window.open(track.url, "_blank", "noopener,noreferrer");
      toast("Opened the official source in a new tab.");
      return;
    }
    recordTrail("played", track.title, track.url, track.album);
    updateMediaSession();
  }

  function pausePlayerPlayback() {
    const audio = $("sourceAudio");
    if (audio && !audio.paused) audio.pause();
    if ($("playerEmbed")?.querySelector("iframe")) {
      $("playerEmbed").replaceChildren();
      $("playerMediaShell").hidden = true;
    }
    stopLyricClock();
    clearTrackEndTimer();
    playerSetPlaying(false);
  }

  function togglePlayerPlayback() {
    if (playerPlaying) pausePlayerPlayback();
    else startPlayerPlayback();
  }

  function movePlayerTrack(direction) {
    const tracks = playerTrackList();
    if (!tracks.length) return;
    if (direction < 0) {
      const previous = playerHistory.pop();
      if (previous) {
        playerMode = previous.mode;
        playerIndex = previous.index;
      } else {
        playerIndex =
          (playerIndex - 1 + tracks.length) % tracks.length;
      }
    } else {
      playerHistory.push({ mode: playerMode, index: playerIndex });
      playerIndex = (playerIndex + 1) % tracks.length;
    }
    renderPlayer();
  }

  function savePlayerLyricColour(colour) {
    lyricColour = colour;
    localStorage.setItem("drift-player-lyric-colour", colour);
    document.documentElement.style.setProperty("--lyric-current-colour", colour);
    document.querySelectorAll("[data-lyric-colour]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.lyricColour === colour),
      );
    });
  }

  function setImmersiveLyrics(active) {
    document.body.classList.toggle("immersive", active);
    if (active && $("lyrics")) $("lyrics").hidden = false;
    const label = active ? "Close full lyrics ×" : "Open full lyrics ⛶";
    if ($("lyricsFullscreenButton")) {
      $("lyricsFullscreenButton").textContent = label;
      $("lyricsFullscreenButton").setAttribute("aria-pressed", String(active));
    }
    if ($("fullscreenButton")) {
      $("fullscreenButton").textContent = active
        ? "Exit large lyrics ×"
        : "Large lyrics ⛶";
      $("fullscreenButton").setAttribute("aria-pressed", String(active));
    }
    requestAnimationFrame(() => {
      showPlayerLyric(Math.max(0, lyricIndex));
    });
  }

  function showPlayerView() {
    if (document.body.classList.contains("immersive")) setImmersiveLyrics(false);
    $("driftPlayerView")?.classList.remove("is-view-hidden");
    $("driftPlayerView")?.removeAttribute("aria-hidden");
    if ($("driftLabView")) $("driftLabView").hidden = true;
    document.body.dataset.driftView = "player";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showLabView(targetId = "") {
    if (document.body.classList.contains("immersive")) setImmersiveLyrics(false);
    $("driftPlayerView")?.classList.add("is-view-hidden");
    $("driftPlayerView")?.setAttribute("aria-hidden", "true");
    if ($("driftLabView")) $("driftLabView").hidden = false;
    document.body.dataset.driftView = "lab";
    requestAnimationFrame(() => {
      const target = targetId ? $(targetId) : null;
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function bindPlayer() {
    const audio = $("sourceAudio");
    if (!audio || !$("transportPlay")) return;
    document.querySelectorAll(".mode").forEach((button) => {
      button.addEventListener("click", () => {
        playerMode = button.dataset.mode;
        playerIndex = 0;
        playerStart = { mode: playerMode, index: 0 };
        playerHistory = [];
        renderPlayer();
        toast(`${button.querySelector("b").textContent} selected — this is your new drift start.`);
      });
    });
    $("transportPlay").addEventListener("click", togglePlayerPlayback);
    $("publicTrackPlay").addEventListener("click", togglePlayerPlayback);
    $("nextTrack").addEventListener("click", () => movePlayerTrack(1));
    $("previousTrack").addEventListener("click", () => movePlayerTrack(-1));
    $("driftButton").addEventListener("click", () => {
      $("directionPanel").hidden = !$("directionPanel").hidden;
    });
    document.querySelectorAll("[data-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.direction;
        playerHistory.push({ mode: playerMode, index: playerIndex });
        if (direction === "softer" || direction === "people") {
          playerMode = "familiar";
        } else if (direction === "deeper") {
          playerMode = "genre";
        } else if (direction === "angle" || direction === "surprise") {
          playerMode = "explore";
        } else {
          playerMode = "balance";
        }
        const tracks = playerTrackList();
        playerIndex = (playerIndex + 1) % tracks.length;
        $("directionPanel").hidden = true;
        renderPlayer();
        toast(`Drifting ${direction}…`);
      });
    });
    $("returnButton").addEventListener("click", () => {
      if (
        playerMode === playerStart.mode &&
        playerIndex === playerStart.index
      ) {
        toast("You are already at the start of this drift.");
        return;
      }
      playerMode = playerStart.mode;
      playerIndex = playerStart.index;
      playerHistory = [];
      renderPlayer();
      toast("Returned to the start of this drift.");
    });
    $("repeatButton").addEventListener("click", () => {
      playerRepeatOne = !playerRepeatOne;
      localStorage.setItem(
        "drift-player-repeat-one",
        String(playerRepeatOne),
      );
      $("repeatButton").textContent = playerRepeatOne
        ? "One source ↻"
        : "Whole field ↻";
      $("repeatButton").setAttribute(
        "aria-pressed",
        String(playerRepeatOne),
      );
    });
    if (playerRepeatOne) {
      $("repeatButton").textContent = "One source ↻";
      $("repeatButton").setAttribute("aria-pressed", "true");
    }
    $("lyricsToggle").addEventListener("click", () => {
      const panel = $("lyrics");
      const open = panel.hidden;
      panel.hidden = !open;
      $("lyricsToggle").setAttribute("aria-expanded", String(open));
      $("lyricsToggle").querySelector("span").textContent = open ? "−" : "+";
      if (open) requestAnimationFrame(() => showPlayerLyric(Math.max(0, lyricIndex)));
    });
    $("fullscreenButton").addEventListener("click", () => {
      setImmersiveLyrics(!document.body.classList.contains("immersive"));
    });
    $("lyricsFullscreenButton").addEventListener("click", () => {
      setImmersiveLyrics(!document.body.classList.contains("immersive"));
    });
    $("immersiveExit").addEventListener("click", () =>
      setImmersiveLyrics(false),
    );
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        document.body.classList.contains("immersive")
      ) {
        setImmersiveLyrics(false);
      }
    });
    document.querySelectorAll("[data-lyric-colour]").forEach((button) => {
      button.addEventListener("click", () =>
        savePlayerLyricColour(button.dataset.lyricColour),
      );
    });
    document.querySelectorAll("[data-show-player]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        showPlayerView();
      });
    });
    document.querySelectorAll("[data-show-lab]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        showLabView(element.dataset.labTarget || "");
      });
    });
    $("openDriftSystem").addEventListener("click", () => showLabView());
    $("returnToPlayer").addEventListener("click", showPlayerView);
    $("artistTip").addEventListener("click", () =>
      toast("Artist support remains an official-source handoff in this build."),
    );
    $("driftSupport").addEventListener("click", () => $("faqDialog")?.showModal());
    audio.addEventListener("play", () => {
      playerSetPlaying(true);
      startPlayerLyricClock();
    });
    audio.addEventListener("pause", () => playerSetPlaying(false));
    audio.addEventListener("timeupdate", () => {
      syncPlayerLyric();
      updatePositionState();
    });
    audio.addEventListener("ended", () => {
      if (playerRepeatOne) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        movePlayerTrack(1);
      }
    });
    savePlayerLyricColour(lyricColour);
    renderPlayer();
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
    if (!source.embedUrl) return;
    const track = importedPlayerTracks().find(
      (candidate) => candidate.url === source.url,
    );
    if (!track) return;
    playerMode = "balance";
    const tracks = playerTrackList();
    playerIndex = tracks.findIndex((candidate) => candidate.id === track.id);
    if (playerIndex < 0) playerIndex = tracks.findIndex(
      (candidate) => candidate.url === track.url,
    );
    if (playerIndex < 0) return;
    container.closest("li")?.classList.add("is-current-source");
    renderPlayer();
    startPlayerPlayback();
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
        load.textContent = "Drift this source";
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
    let tracks = playerTrackList();
    let nextIndex = tracks.findIndex(
      (candidate) => candidate.source === "youtube",
    );
    if (nextIndex < 0) {
      playerMode = "balance";
      tracks = playerTrackList();
      nextIndex = tracks.findIndex(
        (candidate) => candidate.source === "youtube",
      );
    }
    if (nextIndex < 0) return;
    playerIndex = nextIndex;
    renderPlayer();
    startPlayerPlayback();
  }

  function loadSunoPlayer() {
    let tracks = playerTrackList();
    let nextIndex = tracks.findIndex(
      (candidate) => candidate.id === SUNO_SAMPLE.id,
    );
    if (nextIndex < 0) {
      playerMode = "familiar";
      tracks = playerTrackList();
      nextIndex = tracks.findIndex(
        (candidate) => candidate.id === SUNO_SAMPLE.id,
      );
    }
    if (nextIndex < 0) return;
    playerIndex = nextIndex;
    renderPlayer();
    startPlayerPlayback();
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
    if ($("playerGreeting")) {
      $("playerGreeting").textContent = name
        ? `${name.toLocaleUpperCase()}’S LISTENING SPACE · NYARINDO LENS`
        : "YOUR LISTENING SPACE · NYARINDO LENS";
    }
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
    if (currentPlayerTrack) {
      state.lyricsByTrack[currentPlayerTrack.id] = {
        text: state.lyrics.text,
        timings: [...state.lyrics.timings],
      };
    }
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
        lyricsByTrack: state.lyricsByTrack,
        activeTrack: currentPlayerTrack?.id || "",
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
        if (target) {
          document.querySelectorAll(".playground-card.is-expanded").forEach((card) => {
            if (card !== target) card.classList.remove("is-expanded");
          });
          target.classList.add("is-expanded");
          target.classList.add("tool-focus");
          window.setTimeout(() => target.classList.remove("tool-focus"), 900);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    document.querySelectorAll(".playground-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (card.classList.contains("is-expanded")) return;
        if (event.target.closest("input, textarea, select, button, a, label")) {
          return;
        }
        document.querySelectorAll(".playground-card.is-expanded").forEach((entry) => {
          if (entry !== card) entry.classList.remove("is-expanded");
        });
        card.classList.add("is-expanded");
      });
    });

    document.querySelectorAll("[data-service-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = $(button.dataset.serviceTarget);
        showLabView("playground");
        if (!target) return;
        requestAnimationFrame(() => {
          document.querySelectorAll(".playground-card.is-expanded").forEach((card) => {
            if (card !== target) card.classList.remove("is-expanded");
          });
          target.classList.add("is-expanded");
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        });
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
      if (currentPlayerTrack) {
        state.lyricsByTrack[currentPlayerTrack.id] = {
          text: "",
          timings: [],
        };
      }
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
      if (currentPlayerTrack) {
        state.lyricsByTrack[currentPlayerTrack.id] = {
          text: state.lyrics.text,
          timings: [],
        };
      }
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
    $("localMedia")?.addEventListener("play", () => {
      if (playerPlaying) pausePlayerPlayback();
    });
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
    bindPlayer();
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
