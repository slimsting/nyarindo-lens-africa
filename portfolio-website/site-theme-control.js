(() => {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll(".site-theme-toggle")];
  if (!buttons.length) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let transitionTimer;

  function applyTheme(theme, animate) {
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
      button.setAttribute("aria-pressed", String(light));
      button.setAttribute(
        "aria-label",
        `Switch to ${light ? "dark" : "light"} mode`,
      );
      const icon = button.querySelector(".theme-icon");
      const label = button.querySelector(".theme-label");
      if (icon) icon.textContent = light ? "☾" : "☼";
      if (label) label.textContent = light ? "LIGHT" : "DARK";
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = light
        ? buttons[0].dataset.themeLight || "#eef0e7"
        : buttons[0].dataset.themeDark || "#10110f";
    }

    try {
      localStorage.setItem("nyarindo-theme", light ? "light" : "dark");
    } catch {}
    dispatchEvent(
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

  applyTheme(root.dataset.theme === "light" ? "light" : "dark", false);
})();
