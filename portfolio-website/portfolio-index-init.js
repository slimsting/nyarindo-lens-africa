(() => {
  const root = document.documentElement;
  try {
    const savedTheme = localStorage.getItem("nyarindo-theme");
    root.dataset.theme = savedTheme === "light" ? "light" : "dark";

    const savedPalette = localStorage.getItem("nyarindo-palette");
    const palettes = ["forest", "ocean", "amethyst", "ember", "rose", "slate"];
    root.dataset.palette = palettes.includes(savedPalette) ? savedPalette : "forest";
  } catch {
    root.dataset.theme = "dark";
    root.dataset.palette = "forest";
  }
})();
