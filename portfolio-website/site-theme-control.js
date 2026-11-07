(() => {
  const PALETTE_STORAGE_KEY = "nyarindo-palette";
  const PALETTES = Object.freeze([
    { id: "forest", label: "Forest" },
    { id: "ocean", label: "Ocean" },
    { id: "amethyst", label: "Amethyst" },
    { id: "ember", label: "Ember" },
    { id: "rose", label: "Rose" },
    { id: "slate", label: "Slate" },
  ]);

  function ensureCloudscape() {
    if (
      document.querySelector(".library-atmosphere")
      || document.querySelector(".lens-cloudscape")
      || !document.body
    ) {
      return;
    }

    const layer = document.createElement("div");
    layer.className = "lens-cloudscape";
    layer.setAttribute("aria-hidden", "true");

    const group = document.createElement("div");
    group.className = "lens-cloud-group";

    [
      "lens-cloud",
      "lens-cloud",
      "lens-cloud",
    ].forEach((classes) => {
      const cloud = document.createElement("span");
      cloud.className = classes;
      group.append(cloud);
    });

    layer.append(group);
    document.body.append(layer);
  }

  function ensureSkyTraffic() {
    if (!document.body || document.querySelector(".nyarindo-sky-traffic")) {
      return;
    }
    const sky = document.createElement("div");
    sky.className = "nyarindo-sky-traffic";
    sky.setAttribute("aria-hidden", "true");

    [
      ["sky-plane", "plane-a"],
      ["sky-plane", "plane-b"],
      ["sky-helicopter", "helicopter-a"],
      ["sky-helicopter", "helicopter-b"],
      ["sky-satellite", "satellite-a"],
      ["sky-satellite", "satellite-b"],
      ["sky-satellite", "satellite-c"],
      ["sky-balloon", "balloon-a"],
      ["sky-balloon", "balloon-b"],
      ["sky-balloon", "balloon-c"],
    ].forEach(([type, variant]) => {
      const craft = document.createElement("span");
      craft.className = `${type} ${variant}`;
      const contrail = document.createElement("i");
      contrail.className = "aircraft-contrail";
      const body = document.createElement("i");
      body.className = "aircraft-body";
      const rotor = document.createElement("i");
      rotor.className = "aircraft-rotor";
      const light = document.createElement("i");
      light.className = "aircraft-light";
      craft.append(contrail, rotor, body, light);
      if (type === "sky-balloon") {
        const rigging = document.createElement("i");
        rigging.className = "balloon-rigging";
        craft.append(rigging);
      }
      sky.append(craft);
    });

    document.body.append(sky);
  }

  function paletteButtons() {
    return [...document.querySelectorAll("button[data-palette]")];
  }

  function syncPaletteButtons(palette, scope = document) {
    scope.querySelectorAll("button[data-palette]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.palette === palette),
      );
    });
  }

  function syncBrowserThemeColour() {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) return;
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg")
      .trim();
    if (resolved) metaTheme.content = resolved;
  }

  function closePaletteMenus(except = null) {
    document.querySelectorAll(".nyarindo-palette-nav[open]").forEach((details) => {
      if (details === except) return;
      details.open = false;
    });
  }

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.target.closest?.(".nyarindo-palette-nav")) return;
      closePaletteMenus();
    },
    { capture: true },
  );

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openMenu = document.querySelector(".nyarindo-palette-nav[open]");
    if (!openMenu) return;
    closePaletteMenus();
    openMenu.querySelector("summary")?.focus();
  });

  function applyPalette(palette, persist = true) {
    const valid = PALETTES.some((item) => item.id === palette)
      ? palette
      : "forest";
    document.documentElement.dataset.palette = valid;
    syncPaletteButtons(valid);
    syncBrowserThemeColour();
    if (persist) {
      try {
        localStorage.setItem(PALETTE_STORAGE_KEY, valid);
      } catch {}
    }
    window.dispatchEvent(
      new CustomEvent("nyarindo:palettechange", {
        detail: { palette: valid },
      }),
    );
  }

  function createSwatchGrid(className) {
    const grid = document.createElement("div");
    grid.className = className;
    PALETTES.forEach((palette) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.palette = palette.id;
      button.dataset.nyarindoPalette = "true";
      button.setAttribute("aria-label", `Use ${palette.label} colour world`);
      button.title = palette.label;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        applyPalette(palette.id);
        const details = button.closest("details");
        if (details) details.open = false;
      });
      grid.append(button);
    });
    return grid;
  }

  function createNavPaletteControl() {
    const control = document.createElement("details");
    control.className = "nyarindo-palette-nav";
    const summary = document.createElement("summary");
    summary.setAttribute("aria-label", "Choose a shared colour world");
    summary.title = "Shared colour world";
    const orbit = document.createElement("span");
    orbit.className = "nyarindo-palette-orbit";
    orbit.setAttribute("aria-hidden", "true");
    ["ember", "forest", "ocean", "amethyst"].forEach((palette) => {
      const dot = document.createElement("i");
      dot.dataset.paletteDot = palette;
      orbit.append(dot);
    });
    const label = document.createElement("span");
    label.className = "nyarindo-palette-label";
    label.textContent = "COLOUR";
    summary.append(orbit, label);

    const panel = document.createElement("div");
    panel.className = "nyarindo-palette-popover";
    const eyebrow = document.createElement("p");
    eyebrow.textContent = "SHARED COLOUR WORLD";
    panel.append(eyebrow, createSwatchGrid("nyarindo-palette-grid"));
    summary.setAttribute("aria-expanded", "false");
    control.addEventListener("toggle", () => {
      summary.setAttribute("aria-expanded", String(control.open));
    });
    control.append(summary, panel);
    return control;
  }

  function createFooterPaletteControl() {
    const wrapper = document.createElement("div");
    wrapper.className = "nyarindo-palette-footer";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-label", "Shared colour world");
    const label = document.createElement("span");
    label.className = "nyarindo-palette-footer-label";
    label.textContent = "COLOUR WORLD";
    wrapper.append(label, createSwatchGrid("nyarindo-palette-grid is-footer"));
    return wrapper;
  }

  function ensurePaletteControls() {
    const paletteStyles = document.querySelector(
      'link[data-nyarindo-palette-styles], link[href*="palette-themes.css"]',
    );
    if (paletteStyles) {
      paletteStyles.dataset.nyarindoPaletteStyles = "";
      document.head.append(paletteStyles);
      paletteStyles.addEventListener("load", syncBrowserThemeColour, { once: true });
    }

    const header = document.querySelector(
      "header, .topbar, .library-header",
    );
    const navHost = header?.querySelector(
      ".header-actions, .topbar-actions, .header-right, nav",
    ) || header;
    let navControl = document.querySelector(".nyarindo-palette-nav");
    let dock = document.querySelector(".nyarindo-palette-strip");
    if (!navControl && header && navHost) {
      navControl = createNavPaletteControl();
      if (!dock) {
        dock = document.createElement("div");
        dock.className = "nyarindo-palette-strip";
        dock.hidden = true;
        header.insertAdjacentElement("afterend", dock);
      }
      navHost.append(navControl);
    }

    function positionNavControl() {
      if (!navControl || !header) return;
      const dockControl = dock || document.querySelector(".nyarindo-palette-strip");
      const cramped =
        matchMedia("(max-width: 1100px)").matches ||
        header.scrollWidth > header.clientWidth + 2;
      if (cramped && dockControl) {
        dockControl.hidden = false;
        dockControl.append(navControl);
        navControl.classList.add("is-below-header");
      } else if (navHost) {
        if (dockControl) dockControl.hidden = true;
        navHost.append(navControl);
        navControl.classList.remove("is-below-header");
      }
    }

    requestAnimationFrame(positionNavControl);
    addEventListener("resize", positionNavControl, { passive: true });

    if (!document.querySelector(".nyarindo-palette-footer, .footer-themes")) {
      const footer = document.querySelector(
        ".nyarindo-thread-footer, .social-footer, footer",
      );
      if (footer) footer.append(createFooterPaletteControl());
    }

    paletteButtons().forEach((button) => {
      if (button.dataset.nyarindoBound === "true") return;
      button.dataset.nyarindoBound = "true";
      button.addEventListener("click", () => {
        applyPalette(button.dataset.palette);
      });
    });
  }

  function initThemeControl() {
    ensureCloudscape();
    ensureSkyTraffic();

    const root = document.documentElement;
    const header = document.querySelector("header, .topbar, .library-header");
    const allThemeButtons = [...new Set(document.querySelectorAll(
      "[data-theme-toggle], .site-theme-toggle, .theme-toggle, .theme-button, .library-theme, #themeToggle",
    ))];
    const buttons = header
      ? allThemeButtons.filter((button) => header.contains(button))
      : allThemeButtons;

    allThemeButtons
      .filter((button) => !buttons.includes(button))
      .forEach((button) => button.remove());

    if (
      header
      && !["fixed", "sticky"].includes(getComputedStyle(header).position)
    ) {
      header.classList.add("nyarindo-theme-header");
    }

    if (!buttons.length && !document.documentElement.dataset.palette) return;

    ensurePaletteControls();

    let initialPalette = "forest";
    try {
      initialPalette =
        localStorage.getItem(PALETTE_STORAGE_KEY)
        || document.documentElement.dataset.palette
        || "forest";
    } catch {
      initialPalette =
        document.documentElement.dataset.palette || "forest";
    }
    applyPalette(initialPalette, false);
    addEventListener("storage", (event) => {
      if (event.key === PALETTE_STORAGE_KEY && event.newValue) {
        applyPalette(event.newValue, false);
      }
    });
    window.NyarindoColourTheme = Object.freeze({
      current: () => document.documentElement.dataset.palette || "forest",
      set: (palette) => applyPalette(palette, true),
      options: PALETTES.map(({ id, label }) => ({ id, label })),
    });

    if (!buttons.length) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let transitionTimer;

    function buttonLabel(button) {
      return button.querySelector(
        ".theme-label, #themeLabel, [data-theme-label], span:last-child",
      );
    }

    function applyTheme(theme, animate, persist = true) {
      const light = theme === "light";
      if (animate && !reducedMotion) {
        root.classList.add("theme-transition");
        clearTimeout(transitionTimer);
        transitionTimer = setTimeout(
          () => root.classList.remove("theme-transition"),
          500,
        );
      }

      root.dataset.theme = light ? "light" : "dark";
      document.body?.classList.toggle("light", light);
      buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(!light));
        const action = light ? "Switch to night mode" : "Switch to day mode";
        button.setAttribute("aria-label", action);
        button.setAttribute("title", action);
        const icon = button.querySelector(".theme-icon");
        const label = buttonLabel(button);
        if (icon) icon.textContent = light ? "☼" : "☾";
        if (label) label.textContent = light ? "DAY" : "NIGHT";
      });

      if (persist) {
        try {
          localStorage.setItem("nyarindo-theme", light ? "light" : "dark");
        } catch {}
      }
      applyPalette(document.documentElement.dataset.palette || "forest", false);
      window.dispatchEvent(
        new CustomEvent("nyarindo:themechange", {
          detail: { theme: light ? "light" : "dark" },
        }),
      );
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(root.dataset.theme === "light" ? "dark" : "light", true);
      });
    });

    let savedTheme = "dark";
    try {
      savedTheme = localStorage.getItem("nyarindo-theme") || savedTheme;
    } catch {}
    const initialTheme = root.dataset.theme
      || (savedTheme === "light" ? "light" : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

    window.NyarindoTheme = Object.freeze({
      current: () => (root.dataset.theme === "light" ? "light" : "dark"),
      set: (theme) => applyTheme(theme, true),
      toggle: () => applyTheme(root.dataset.theme === "light" ? "dark" : "light", true),
    });

    applyTheme(initialTheme, false, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeControl, { once: true });
  } else {
    initThemeControl();
  }
})();
