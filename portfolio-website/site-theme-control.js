(() => {
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

    [
      "lens-cloud lens-cloud-a",
      "lens-cloud lens-cloud-b",
      "lens-cloud lens-cloud-c",
      "lens-cloud lens-cloud-d",
    ].forEach((classes) => {
      const cloud = document.createElement("span");
      cloud.className = classes;
      layer.append(cloud);
    });

    document.body.append(layer);
  }

  function initThemeControl() {
    ensureCloudscape();

    const root = document.documentElement;
    const buttons = [...new Set(document.querySelectorAll(
      "[data-theme-toggle], .site-theme-toggle, .theme-toggle, .theme-button, .library-theme, #themeToggle",
    ))];
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

      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.content = light
          ? buttons[0].dataset.themeLight || "#eef0e7"
          : buttons[0].dataset.themeDark || "#10110f";
      }

      if (persist) {
        try {
          localStorage.setItem("nyarindo-theme", light ? "light" : "dark");
        } catch {}
      }
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
