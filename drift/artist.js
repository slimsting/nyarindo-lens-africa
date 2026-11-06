(() => {
  "use strict";

  const STORAGE_KEY = "drift.artist-preview.v1";
  const form = document.getElementById("artistForm");
  const preview = document.getElementById("rightsPreview");
  const toastElement = document.getElementById("toast");
  const $ = (id) => document.getElementById(id);
  let latestBatch = null;
  let toastTimer = 0;

  function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(
      () => toastElement.classList.remove("show"),
      2800,
    );
  }

  function sourceProvider(rawUrl) {
    try {
      const host = new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
      if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube";
      if (host.endsWith("suno.com")) return "Suno";
      if (host.endsWith("spotify.com")) return "Spotify";
      if (host.endsWith("soundcloud.com")) return "SoundCloud";
      if (host.endsWith("bandcamp.com")) return "Bandcamp";
      return host;
    } catch {
      return "Invalid source";
    }
  }

  function validHttpUrl(value) {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }

  function parseSources() {
    return $("sourceBatch")
      .value.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({
        url,
        provider: sourceProvider(url),
        valid: validHttpUrl(url),
      }));
  }

  function selectedRightsState() {
    return form.querySelector('input[name="rightsState"]:checked')?.value || "allow";
  }

  function draft() {
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      identity: {
        name: $("artistName").value.trim(),
        provider: $("providerName").value,
        profileUrl: $("providerProfile").value.trim(),
        contactEmail: $("artistContact").value.trim(),
        statedAuthority: $("rightsAuthority").checked,
        providerControlAccepted: $("providerControl").checked,
      },
      catalogue: {
        label: $("catalogueLabel").value.trim(),
        note: $("sourceNote").value.trim(),
      },
      permission: {
        state: selectedRightsState(),
        quietUpdates: $("quietUpdates").checked,
        hostMedia: false,
        reversible: true,
      },
      sources: parseSources(),
      verification: {
        localPreviewOnly: true,
        providerVerified: false,
        ownershipVerified: false,
      },
    };
  }

  function addPreviewRow(label, value) {
    const row = document.createElement("div");
    const term = document.createElement("b");
    const detail = document.createElement("span");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    preview.append(row);
  }

  function renderPreview() {
    const data = draft();
    latestBatch = data;
    const validSources = data.sources.filter((source) => source.valid);
    const invalidSources = data.sources.length - validSources.length;
    preview.replaceChildren();

    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = "RIGHTS PREVIEW · NOT VERIFIED";
    const heading = document.createElement("h3");
    heading.textContent = data.identity.name || "Identity pending";
    const summary = document.createElement("p");
    summary.textContent =
      `${validSources.length} official source${validSources.length === 1 ? "" : "s"} ready for review. ` +
      `${invalidSources ? `${invalidSources} line${invalidSources === 1 ? "" : "s"} need a complete URL. ` : ""}` +
      "Nothing has been published or sent to a provider.";
    preview.append(label, heading, summary);
    addPreviewRow("Public permission", data.permission.state.toUpperCase());
    addPreviewRow("Quiet updates", data.permission.quietUpdates ? "Allowed by choice" : "Paused");
    addPreviewRow("Media hosting", "None — official source links only");
    addPreviewRow("Identity proof", "Pending provider or domain verification");
    addPreviewRow("Rights proof", "Pending authorised contact verification");

    const providers = [...new Set(validSources.map((source) => source.provider))];
    if (providers.length) addPreviewRow("Provider lane", providers.join(", "));
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft()));
    } catch {}
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = draft();
    if (!data.sources.length || data.sources.some((source) => !source.valid)) {
      showToast("Use one complete http or https source URL per line.");
      return;
    }
    saveDraft();
    renderPreview();
    showToast(`Local preview created for ${data.sources.length} official sources.`);
  });

  $("previewRights").addEventListener("click", () => {
    renderPreview();
    preview.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("downloadBatch").addEventListener("click", () => {
    const data = draft();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `drift-artist-batch-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Local batch manifest downloaded.");
  });

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.identity) {
      $("artistName").value = saved.identity.name || "";
      $("providerProfile").value = saved.identity.profileUrl || "";
      $("artistContact").value = saved.identity.contactEmail || "";
      $("providerName").value = saved.identity.provider || "Suno";
      $("catalogueLabel").value = saved.catalogue?.label || "";
      $("sourceNote").value = saved.catalogue?.note || "";
      $("sourceBatch").value = (saved.sources || [])
        .map((source) => source.url)
        .join("\n");
      $("quietUpdates").checked = Boolean(saved.permission?.quietUpdates);
      const rights = form.querySelector(
        `input[name="rightsState"][value="${saved.permission?.state || "allow"}"]`,
      );
      if (rights) rights.checked = true;
    }
  } catch {}

  renderPreview();
})();
