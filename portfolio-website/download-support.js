(() => {
  "use strict";

  const collectionDownloadId = "1vVEtwMBR1gsnjCHoJC4WzAvs3np3PUFP";
  let notice = null;
  let hideTimer = 0;

  function isDownloadAction(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    if (anchor.hasAttribute("download")) return true;

    const url = new URL(anchor.href, location.href);
    if (/\.pdf$/i.test(url.pathname)) return true;

    return (
      url.hostname === "drive.google.com" &&
      url.searchParams.get("id") === collectionDownloadId
    );
  }

  function buildNotice() {
    const aside = document.createElement("aside");
    aside.className = "download-support-notice";
    aside.hidden = true;
    aside.setAttribute("role", "status");
    aside.setAttribute("aria-live", "polite");
    aside.setAttribute("aria-atomic", "true");

    const copy = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "download-support-eyebrow";
    eyebrow.textContent = "THE DOWNLOAD IS ALREADY MOVING";
    const title = document.createElement("strong");
    title.className = "download-support-title";
    title.textContent = "No offering is required. Coherence accepts coffee.";
    const body = document.createElement("p");
    body.className = "download-support-body";
    body.textContent =
      "If the work earns its keep, you may buy me a coffee, take me out, or offer a ceremonial bribe. The file comes first, always ☕😂";
    copy.append(eyebrow, title, body);

    const actions = document.createElement("div");
    actions.className = "download-support-actions";
    const support = document.createElement("a");
    support.className = "download-support-link";
    support.href = "/portfolio-website/#books";
    support.textContent = "Visit the tip jar";
    const close = document.createElement("button");
    close.className = "download-support-close";
    close.type = "button";
    close.textContent = "Not now";
    close.addEventListener("click", () => {
      aside.hidden = true;
      clearTimeout(hideTimer);
    });
    actions.append(support, close);

    aside.append(copy, actions);
    return aside;
  }

  function showNotice(anchor) {
    if (!notice) notice = buildNotice();
    const host = document.querySelector("dialog[open]") || document.body;
    if (notice.parentElement !== host) host.append(notice);
    const bookTitle = anchor
      .closest(".book-card, .collection-section, .reader-dialog")
      ?.querySelector("h1, h2, h3, .reader-title-block h2")
      ?.textContent.trim();
    notice.querySelector(".download-support-title").textContent = bookTitle
      ? `${bookTitle} is downloading. No offering is required.`
      : "The file is downloading. No offering is required.";
    notice.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      notice.hidden = true;
    }, 12000);
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!isDownloadAction(anchor)) return;
      showNotice(anchor);
    },
    { capture: true },
  );
})();
