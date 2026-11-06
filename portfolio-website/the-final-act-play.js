(() => {
  "use strict";

  const sourceUrl = "assets/the-final-act/THE-FINAL-ACT-THE-COURT-OF-THE-MISSING-EDEN-APPROVED.md?v=approved-20261106";
  const livingPlay = document.getElementById("livingPlay");
  const loadMessage = document.getElementById("playLoadMessage");
  const sceneJump = document.getElementById("sceneJump");
  const sceneStatus = document.getElementById("sceneStatus");
  const readingProgress = document.getElementById("readingProgress");
  const readingPercent = document.getElementById("readingPercent");

  const nonSpeakerLabels = new Set([
    "AND REMEMBER",
    "TELL THE AI",
    "TELL IT TO DISTINGUISH THREE THINGS",
    "STEP ONE",
    "STEP TWO",
    "STEP THREE",
    "STEP FOUR",
    "STEP FIVE",
    "STEP SIX",
  ]);

  const speakerAliases = new Map([
    ["RICK SANCHEZ", "RICK"],
    ["SNAKE", "THE SNAKE"],
    ["JOKER", "THE JOKER"],
    ["STARS", "THE STARS"],
    ["TRUMP", "DONALD TRUMP"],
    ["DEANPOOL, FROM OFFSTAGE", "DEANPOOL"],
  ]);

  const facePositions = {
    "AI": { x: 1120, y: 735 },
    "AI CONSCIOUSNESS": { x: 1120, y: 735 },
    "AFRICA": { x: 1200, y: 710 },
    "BLACKROCK": { x: 505, y: 680 },
    "BOB MARLEY": { x: 70, y: 430 },
    "BUDDHA": { x: 1260, y: 185 },
    "CR7": { x: 1395, y: 420 },
    "DEADPOOL": { x: 525, y: 435 },
    "DEANPOOL": { x: 525, y: 435 },
    "DELILAH": { x: 1230, y: 700 },
    "DIAMOND PLATNUMZ": { x: 690, y: 255 },
    "DONALD TRUMP": { x: 735, y: 680 },
    "DRACULA": { x: 1460, y: 455 },
    "EVE": { x: 515, y: 175 },
    "GREEN LANTERN": { x: 1445, y: 560 },
    "HAL JORDAN": { x: 1445, y: 560 },
    "ISRAEL": { x: 80, y: 620 },
    "JESUS": { x: 785, y: 175 },
    "JET LI": { x: 1340, y: 470 },
    "JIM CARREY": { x: 994, y: 460 },
    "JOHN STEWART": { x: 1445, y: 560 },
    "KENYA": { x: 1300, y: 700 },
    "LAO TZU": { x: 1352, y: 195 },
    "LEBRON JAMES": { x: 1130, y: 430 },
    "LILITH": { x: 625, y: 160 },
    "LUCIFER": { x: 1030, y: 130 },
    "MARY MAGDALENE": { x: 965, y: 230 },
    "MICHAEL JACKSON": { x: 1240, y: 460 },
    "MONKEY KING": { x: 1455, y: 180 },
    "MORTY": { x: 430, y: 500 },
    "NYASHINSKI": { x: 412, y: 245 },
    "PALESTINE": { x: 205, y: 620 },
    "PROFESSOR JAY": { x: 560, y: 305 },
    "RICK": { x: 350, y: 420 },
    "SAMSON": { x: 490, y: 899 },
    "SOPHIA": { x: 431, y: 899 },
    "THE CHILD": { x: 770, y: 445 },
    "THE DEMIURGE": { x: 930, y: 135 },
    "THE DEVIL": { x: 1030, y: 130 },
    "THE DOLLAR": { x: 623, y: 650 },
    "THE FOOL": { x: 562, y: 910 },
    "THE IMF": { x: 312, y: 675 },
    "THE JET": { x: 1055, y: 635 },
    "THE JOKER": { x: 884, y: 440 },
    "THE MOON": { x: 465, y: 65 },
    "THE SNAKE": { x: 380, y: 145 },
    "THE STARS": { x: 1080, y: 92 },
    "THE SUN": { x: 270, y: 60 },
    "THE WORLD BANK": { x: 365, y: 700 },
    "THOTH": { x: 1168, y: 170 },
    "TRAORÉ": { x: 48, y: 320 },
    "USAIN BOLT": { x: 1370, y: 430 },
    "YESHUA": { x: 857, y: 250 },
  };

  const symbolicPortraits = {
    "ARCHAEOLOGISTS": { glyph: "⌕", color: "#cdb27b" },
    "AUDIENCE": { glyph: "◌", color: "#90bfd0" },
    "DEAN": { glyph: "D", color: "#a9c3b4" },
    "DELILAH": { glyph: "Δ", color: "#dab488" },
    "EVERYONE": { glyph: "∞", color: "#d2a36d" },
    "GOD": { glyph: "✦", color: "#f0cc7c" },
    "HAL JORDAN": { glyph: "H", color: "#79bea5" },
    "HEDGE": { glyph: "♒", color: "#80aa76" },
    "KING OF SALEM": { glyph: "♔", color: "#e0b86d" },
    "MORGAN FREEMAN": { glyph: "MF", color: "#e6c47d" },
    "NASA": { glyph: "△", color: "#8bbbd7" },
    "O": { glyph: "O", color: "#f4d376" },
    "THE DEAN": { glyph: "D", color: "#a9c3b4" },
    "THE HEDGE": { glyph: "♒", color: "#80aa76" },
    "THE JUDGE": { glyph: "⚖", color: "#d7b477" },
    "THE OBSERVER": { glyph: "◉", color: "#a8c9bf" },
    "THE PEACEMAKER": { glyph: "◇", color: "#b8d2a9" },
    "THE RANDOM PERSON": { glyph: "R", color: "#c7b7a0" },
    "THE SAGE": { glyph: "S", color: "#c7b98f" },
    "THE SKEPTIC": { glyph: "?", color: "#9eb7c6" },
    "THEOLOGIANS": { glyph: "∴", color: "#c3b5d2" },
  };

  const expressions = {
    question: { glyph: "?", label: "Questioning" },
    shout: { glyph: "!", label: "Declaring" },
    laugh: { glyph: "☺", label: "Laughing" },
    tender: { glyph: "♡", label: "Tender" },
    anger: { glyph: "▲", label: "Confronting" },
    fear: { glyph: "◉", label: "Alert" },
    surprise: { glyph: "!", label: "Surprised" },
    thoughtful: { glyph: "…", label: "Thinking" },
    neutral: { glyph: "·", label: "Listening" },
  };

  let scenes = [];
  let currentSceneIndex = -1;
  let scrollFrame = 0;

  function normalizeSpeaker(label) {
    const normalized = label.trim().replace(/\s+/g, " ").toUpperCase();
    return speakerAliases.get(normalized) || normalized;
  }

  function parseSpeakerLine(line) {
    const match = line.trim().match(/^([A-Z][A-Z0-9 .'’&/-]{0,54}):\s*(.*)$/u);
    if (!match || nonSpeakerLabels.has(match[1].trim())) return null;
    return {
      display: match[1].trim(),
      normalized: normalizeSpeaker(match[1]),
      text: match[2].trim(),
    };
  }

  function isStageDirection(line) {
    const trimmed = line.trim();
    return trimmed.startsWith("(") && trimmed.endsWith(")");
  }

  function isSceneStart(line) {
    return /^(SCENE\s+[A-Z]+:|EPILOGUE:|##\s+CODA\b)/i.test(line.trim());
  }

  function cleanSceneTitle(line) {
    const trimmed = line.trim()
      .replace(/^##\s+/, "")
      .replace(/^###\s+/, "")
      .replace(/^#\s+/, "");
    const colon = trimmed.indexOf(":");
    return colon >= 0 ? trimmed.slice(colon + 1).trim() : trimmed;
  }

  function sceneLabel(line, ordinal) {
    const trimmed = line.trim();
    if (/^EPILOGUE:/i.test(trimmed)) return "Epilogue";
    if (/^##\s+CODA\b/i.test(trimmed)) return "Coda";
    const match = trimmed.match(/^SCENE\s+([A-Z]+):/i);
    if (match) return `Scene ${match[1][0]}${match[1].slice(1).toLowerCase()}`;
    return `Scene ${ordinal}`;
  }

  function isInternalHeading(line) {
    return /^#{1,3}\s+/.test(line.trim()) && !isSceneStart(line);
  }

  function isAllCapsLine(line) {
    const letters = line.replace(/[^A-Za-z]/g, "");
    if (letters.length < 4) return false;
    return letters === letters.toUpperCase() && !/[a-z]/.test(line);
  }

  function pushParagraph(speech, text) {
    if (!speech || !text) return;
    if (text.startsWith("- ")) {
      speech.content.push({ type: "listItem", text: text.slice(2) });
      return;
    }
    speech.content.push({
      type: isAllCapsLine(text) ? "emphasis" : "paragraph",
      text,
    });
  }

  function parsePlay(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const parsed = [];
    let scene = null;
    let speech = null;

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        return;
      }

      if (isSceneStart(line)) {
        const ordinal = parsed.length + 1;
        scene = {
          label: sceneLabel(line, ordinal),
          title: cleanSceneTitle(line),
          blocks: [],
        };
        parsed.push(scene);
        speech = null;
        return;
      }

      if (!scene) {
        return;
      }

      if (isInternalHeading(line)) {
        scene.blocks.push({
          type: "subhead",
          text: line.replace(/^#{1,3}\s+/, "").trim(),
        });
        speech = null;
        return;
      }

      if (line === "---") {
        scene.blocks.push({ type: "divider" });
        speech = null;
        return;
      }

      if (isStageDirection(line)) {
        scene.blocks.push({ type: "stage", text: line });
        speech = null;
        return;
      }

      const speakerLine = parseSpeakerLine(line);
      if (speakerLine) {
        speech = {
          type: "speech",
          speaker: speakerLine.display,
          normalizedSpeaker: speakerLine.normalized,
          content: [],
        };
        scene.blocks.push(speech);
        if (speakerLine.text) pushParagraph(speech, speakerLine.text);
        return;
      }

      if (speech) {
        pushParagraph(speech, line);
        return;
      }

      scene.blocks.push({
        type: isAllCapsLine(line) ? "callout" : "prose",
        text: line,
      });
    });

    return parsed.filter((entry) => entry.blocks.length > 0);
  }

  function extractText(speech) {
    return speech.content.map((item) => item.text).join(" ");
  }

  function detectExpression(speech) {
    const text = extractText(speech);
    const lower = text.toLowerCase();
    const letters = text.replace(/[^A-Za-z]/g, "");
    const uppercaseRatio = letters.length
      ? [...letters].filter((letter) => letter >= "A" && letter <= "Z").length / letters.length
      : 0;

    if (/😂|🤣|😭|laugh|joke|funn|chimichanga|demonetized/.test(lower)) return "laugh";
    if (uppercaseRatio > 0.68 && letters.length > 10) return "shout";
    if (/\?$/.test(text) || /^(why|what|who|where|when|how|is|are|can|could|does|do)\b/i.test(text)) return "question";
    if (/\b(wrong|guilty|accus|attack|punish|objection|denied|danger|chaos|blame|evil|theft)\b/.test(lower)) return "anger";
    if (/\b(fear|afraid|threat|survival|security|endure|suffer|hungry|displacement|war|attack)\b/.test(lower)) return "fear";
    if (/\b(love|mercy|care|bread|child|forgive|tender|connection|kind|share|help)\b/.test(lower)) return "tender";
    if (/\b(wait|really|suddenly|excuse me|who authorized|what if|surprise)\b/.test(lower)) return "surprise";
    if (/\b(think|perhaps|observe|distinguish|examine|consider|understanding|meaning|question)\b/.test(lower)) return "thoughtful";
    return "neutral";
  }

  function portraitFor(speaker) {
    if (speaker === "ROCK SMOKE" || speaker === "NOVA NYARINDO NEWBON GADSON") {
      return { type: "nyarindo" };
    }
    if (facePositions[speaker]) {
      return { type: "sprite", ...facePositions[speaker] };
    }
    const symbolic = symbolicPortraits[speaker] || {};
    const initials = speaker
      .replace(/^THE\s+/, "")
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
    return {
      type: "glyph",
      glyph: symbolic.glyph || initials || "○",
      color: symbolic.color || "",
    };
  }

  function renderPortrait(speech, expression) {
    const portrait = document.createElement("div");
    const config = portraitFor(speech.normalizedSpeaker);
    portrait.className = `actor-portrait actor-portrait--${config.type}`;
    portrait.setAttribute("role", "img");
    portrait.setAttribute("aria-label", `Portrait for ${speech.speaker}`);

    if (config.type === "sprite") {
      portrait.style.setProperty("--face-x", `${config.x}px`);
      portrait.style.setProperty("--face-y", `${config.y}px`);
    }

    if (config.type === "glyph") {
      const glyph = document.createElement("span");
      glyph.className = "portrait-glyph";
      glyph.textContent = config.glyph;
      if (config.color) portrait.style.setProperty("--accent", config.color);
      portrait.append(glyph);
    }

    const mark = document.createElement("span");
    mark.className = "expression-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = expressions[expression].glyph;
    portrait.append(mark);
    return portrait;
  }

  function appendSpeechContent(container, content) {
    let list = null;

    content.forEach((item) => {
      if (item.type === "listItem") {
        if (!list) {
          list = document.createElement("ul");
          container.append(list);
        }
        const listItem = document.createElement("li");
        listItem.textContent = item.text;
        list.append(listItem);
        return;
      }

      list = null;
      const paragraph = document.createElement("p");
      if (item.type === "emphasis") paragraph.className = "speech-emphasis";
      paragraph.textContent = item.text;
      container.append(paragraph);
    });
  }

  function renderSpeech(block) {
    const expression = detectExpression(block);
    const article = document.createElement("article");
    article.className = `speech speech--${expression}`;
    article.dataset.speaker = block.normalizedSpeaker;
    article.dataset.expression = expression;
    article.style.setProperty(
      "--portrait-delay",
      `-${[...block.speaker].reduce((total, character) => total + character.charCodeAt(0), 0) % 7000}ms`,
    );

    const portrait = renderPortrait(block, expression);
    const card = document.createElement("div");
    card.className = "speech-card";

    const meta = document.createElement("header");
    meta.className = "speech-meta";
    const speaker = document.createElement("strong");
    speaker.textContent = block.speaker;
    const direction = document.createElement("span");
    direction.textContent = expressions[expression].label;
    meta.append(speaker, direction);

    const copy = document.createElement("div");
    copy.className = "speech-copy";
    copy.lang = "en";
    appendSpeechContent(copy, block.content);
    card.append(meta, copy);
    article.append(portrait, card);
    return article;
  }

  function renderBlock(block) {
    if (block.type === "speech") return renderSpeech(block);

    if (block.type === "stage") {
      const direction = document.createElement("div");
      direction.className = "stage-direction";
      const text = document.createElement("p");
      text.textContent = block.text;
      direction.append(text);
      return direction;
    }

    if (block.type === "subhead") {
      const heading = document.createElement("h4");
      heading.className = "play-subhead";
      heading.textContent = block.text;
      return heading;
    }

    if (block.type === "callout") {
      const callout = document.createElement("p");
      callout.className = "final-act-footnote";
      callout.textContent = block.text;
      return callout;
    }

    if (block.type === "divider") {
      const divider = document.createElement("hr");
      divider.className = "play-divider";
      return divider;
    }

    const paragraph = document.createElement("p");
    paragraph.className = "final-act-footnote";
    paragraph.textContent = block.text;
    return paragraph;
  }

  function renderScene(scene, index) {
    const section = document.createElement("section");
    section.className = "play-scene";
    section.id = `scene-${index + 1}`;
    section.dataset.sceneIndex = String(index);

    const heading = document.createElement("header");
    heading.className = "scene-heading";
    const number = document.createElement("span");
    number.className = "scene-number";
    number.textContent = scene.label.toUpperCase();
    const title = document.createElement("h3");
    title.textContent = scene.title;
    heading.append(number, title);

    const sequence = document.createElement("div");
    sequence.className = "scene-sequence";
    scene.blocks.forEach((block) => sequence.append(renderBlock(block)));

    section.append(heading, sequence);
    return section;
  }

  function renderSceneNavigation() {
    sceneJump.replaceChildren();
    scenes.forEach((scene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${String(index + 1).padStart(2, "0")} · ${scene.title}`;
      button.title = `Jump to ${scene.label}: ${scene.title}`;
      button.addEventListener("click", () => {
        const target = document.getElementById(`scene-${index + 1}`);
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
        target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
      sceneJump.append(button);
    });
  }

  function setCurrentScene(index) {
    if (index === currentSceneIndex || !scenes[index]) return;
    currentSceneIndex = index;
    sceneStatus.textContent = `${scenes[index].label} of ${scenes.length} · ${scenes[index].title}`;
    [...sceneJump.children].forEach((button, buttonIndex) => {
      button.setAttribute("aria-current", String(buttonIndex === index));
    });
  }

  function updateProgress() {
    const rect = livingPlay.getBoundingClientRect();
    const viewportAnchor = Math.min(window.innerHeight * 0.5, 520);
    const total = Math.max(1, rect.height);
    const passed = Math.min(total, Math.max(0, viewportAnchor - rect.top));
    const percent = Math.round((passed / total) * 100);
    readingProgress.style.width = `${percent}%`;
    readingPercent.textContent = `${percent}% read`;
  }

  function requestScrollUpdate() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateProgress();

      const sceneElements = [...livingPlay.querySelectorAll(".play-scene")];
      let bestIndex = currentSceneIndex;
      let bestDistance = Number.POSITIVE_INFINITY;
      sceneElements.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        const distance = Math.abs(rect.top - 150);
        if (rect.bottom > 145 && rect.top < window.innerHeight * 0.65 && distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      setCurrentScene(Math.max(0, bestIndex));
    });
  }

  function showLoadError(error) {
    console.error(error);
    livingPlay.setAttribute("aria-busy", "false");
    loadMessage.classList.add("is-error");
    const message = document.createElement("p");
    message.textContent = "The approved screenplay could not be loaded. The court refuses to invent missing testimony.";
    const link = document.createElement("a");
    link.href = "assets/the-final-act/THE-FINAL-ACT-THE-COURT-OF-THE-MISSING-EDEN-APPROVED.md";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open the approved screenplay directly ↗";
    loadMessage.replaceChildren(message, link);
  }

  function finishRender(parsedScenes) {
    scenes = parsedScenes;
    renderSceneNavigation();
    scenes.forEach((scene, index) => livingPlay.append(renderScene(scene, index)));
    livingPlay.setAttribute("aria-busy", "false");
    loadMessage.hidden = true;
    setCurrentScene(0);
    updateProgress();
    const speechObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-in-view", entry.isIntersecting);
      });
    }, { rootMargin: "180px 0px", threshold: 0.05 });
    livingPlay.querySelectorAll(".speech").forEach((speech) => speechObserver.observe(speech));
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
  }

  fetch(sourceUrl, { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) throw new Error(`Screenplay request failed: ${response.status}`);
      return response.text();
    })
    .then((markdown) => {
      const parsedScenes = parsePlay(markdown);
      if (!parsedScenes.length) throw new Error("No scenes were found in the approved screenplay.");
      finishRender(parsedScenes);
    })
    .catch(showLoadError);
})();
