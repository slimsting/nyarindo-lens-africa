const apertureViewer = document.getElementById("apertureViewer");
const apertureViewerImage = document.getElementById("apertureViewerImage");
const apertureViewerStage = document.getElementById("apertureViewerStage");
const apertureZoomLabel = document.getElementById("apertureZoomLabel");
const apertureTrigger = document.querySelector("[data-aperture-artwork]");

if (apertureViewer && apertureViewerImage && apertureViewerStage && apertureTrigger) {
  let scale = 1;
  let fittedWidth = 0;
  let dragStart = null;
  let pinchStart = null;
  const pointers = new Map();

  function centerViewer() {
    apertureViewerStage.scrollLeft = Math.max(
      0,
      (apertureViewerStage.scrollWidth - apertureViewerStage.clientWidth) / 2,
    );
    apertureViewerStage.scrollTop = Math.max(
      0,
      (apertureViewerStage.scrollHeight - apertureViewerStage.clientHeight) / 2,
    );
  }

  function fitViewerImage() {
    if (!apertureViewer.open || !apertureViewerImage.naturalWidth) return;
    const availableWidth = Math.max(1, apertureViewerStage.clientWidth - 36);
    const availableHeight = Math.max(1, apertureViewerStage.clientHeight - 36);
    const ratio =
      apertureViewerImage.naturalWidth / apertureViewerImage.naturalHeight;
    fittedWidth = Math.min(availableWidth, availableHeight * ratio);
    apertureViewerImage.style.width = `${fittedWidth * scale}px`;
    apertureZoomLabel.textContent = `${Math.round(scale * 100)}%`;
    requestAnimationFrame(centerViewer);
  }

  function setViewerZoom(nextScale) {
    if (!fittedWidth) return;
    const centerXRatio =
      (apertureViewerStage.scrollLeft + apertureViewerStage.clientWidth / 2) /
      Math.max(1, apertureViewerStage.scrollWidth);
    const centerYRatio =
      (apertureViewerStage.scrollTop + apertureViewerStage.clientHeight / 2) /
      Math.max(1, apertureViewerStage.scrollHeight);
    scale = Math.min(6, Math.max(1, +nextScale.toFixed(2)));
    apertureViewerImage.style.width = `${fittedWidth * scale}px`;
    apertureZoomLabel.textContent = `${Math.round(scale * 100)}%`;
    requestAnimationFrame(() => {
      apertureViewerStage.scrollLeft =
        centerXRatio * apertureViewerStage.scrollWidth -
        apertureViewerStage.clientWidth / 2;
      apertureViewerStage.scrollTop =
        centerYRatio * apertureViewerStage.scrollHeight -
        apertureViewerStage.clientHeight / 2;
      if (scale === 1) centerViewer();
    });
  }

  function resetViewer() {
    scale = 1;
    apertureViewerImage.style.width = fittedWidth ? `${fittedWidth}px` : "";
    apertureZoomLabel.textContent = "100%";
    requestAnimationFrame(centerViewer);
  }

  function openViewer() {
    apertureViewerImage.src =
      apertureTrigger.querySelector("img")?.currentSrc ||
      apertureTrigger.querySelector("img")?.src ||
      "";
    apertureViewer.showModal();
    document.body.classList.add("viewer-open");
    scale = 1;
    fittedWidth = 0;
    apertureZoomLabel.textContent = "100%";
    if (apertureViewerImage.complete) {
      requestAnimationFrame(fitViewerImage);
    } else {
      apertureViewerImage.addEventListener(
        "load",
        () => requestAnimationFrame(fitViewerImage),
        { once: true },
      );
    }
    apertureViewerStage.focus({ preventScroll: true });
  }

  apertureTrigger.addEventListener("click", openViewer);
  apertureViewer.addEventListener("close", () => {
    document.body.classList.remove("viewer-open");
  });
  apertureViewer.addEventListener("click", (event) => {
    if (event.target === apertureViewer) apertureViewer.close();
  });
  apertureViewer.querySelector("[data-aperture-zoom-in]").addEventListener(
    "click",
    () => setViewerZoom(scale + 0.25),
  );
  apertureViewer.querySelector("[data-aperture-zoom-out]").addEventListener(
    "click",
    () => setViewerZoom(scale - 0.25),
  );
  apertureViewer.querySelector("[data-aperture-reset]").addEventListener(
    "click",
    resetViewer,
  );

  apertureViewerStage.addEventListener("dblclick", resetViewer);
  apertureViewerStage.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setViewerZoom(scale + (event.deltaY < 0 ? 0.2 : -0.2));
    },
    { passive: false },
  );

  apertureViewerStage.addEventListener("pointerdown", (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    apertureViewerStage.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      dragStart = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: apertureViewerStage.scrollLeft,
        scrollTop: apertureViewerStage.scrollTop,
      };
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
  });

  apertureViewerStage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1 && dragStart && scale > 1) {
      apertureViewerStage.classList.add("is-dragging");
      apertureViewerStage.scrollLeft =
        dragStart.scrollLeft - event.clientX + dragStart.x;
      apertureViewerStage.scrollTop =
        dragStart.scrollTop - event.clientY + dragStart.y;
    } else if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      setViewerZoom((pinchStart.scale * distance) / pinchStart.distance);
    }
  });

  function endPointer(event) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 1) {
      const pointer = [...pointers.values()][0];
      dragStart = {
        x: pointer.x,
        y: pointer.y,
        scrollLeft: apertureViewerStage.scrollLeft,
        scrollTop: apertureViewerStage.scrollTop,
      };
    } else if (!pointers.size) {
      dragStart = null;
      apertureViewerStage.classList.remove("is-dragging");
    }
  }

  apertureViewerStage.addEventListener("pointerup", endPointer);
  apertureViewerStage.addEventListener("pointercancel", endPointer);

  document.addEventListener("keydown", (event) => {
    if (!apertureViewer.open) return;
    if (event.key === "+" || event.key === "=") setViewerZoom(scale + 0.25);
    else if (event.key === "-") setViewerZoom(scale - 0.25);
    else if (event.key === "0") resetViewer();
    else if (event.key === "ArrowLeft") apertureViewerStage.scrollLeft -= 45;
    else if (event.key === "ArrowRight") apertureViewerStage.scrollLeft += 45;
    else if (event.key === "ArrowUp") apertureViewerStage.scrollTop -= 45;
    else if (event.key === "ArrowDown") apertureViewerStage.scrollTop += 45;
  });

  new ResizeObserver(() => {
    if (!apertureViewer.open || !apertureViewerImage.naturalWidth) return;
    const previousScale = scale;
    fittedWidth = 0;
    fitViewerImage();
    if (previousScale !== 1) setViewerZoom(previousScale);
  }).observe(apertureViewerStage);
}
