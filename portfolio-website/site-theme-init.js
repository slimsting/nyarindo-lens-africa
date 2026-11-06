(() => {
  const root = document.documentElement;
  const currentScript = document.currentScript;
  try {
    if (
      currentScript?.src
      && !document.querySelector('link[data-nyarindo-palette-styles]')
    ) {
      const paletteStyles = document.createElement("link");
      paletteStyles.rel = "stylesheet";
      paletteStyles.href = new URL("palette-themes.css?v=palette-themes-5", currentScript.src).href;
      paletteStyles.dataset.nyarindoPaletteStyles = "";
      document.head.append(paletteStyles);
    }
  } catch {}
  let theme = "dark";
  let palette = "forest";
  try {
    const saved = localStorage.getItem("nyarindo-theme");
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (matchMedia("(prefers-color-scheme: light)").matches) {
      theme = "light";
    }
    const savedPalette = localStorage.getItem("nyarindo-palette");
    if (["forest", "ocean", "amethyst", "ember", "rose", "slate"].includes(savedPalette)) {
      palette = savedPalette;
    }
  } catch {}
  root.dataset.theme = theme;
  root.dataset.palette = palette;
})();
