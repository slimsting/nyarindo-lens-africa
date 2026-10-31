(() => {
  const root = document.documentElement;
  let theme = "dark";
  try {
    const saved = localStorage.getItem("nyarindo-theme");
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (matchMedia("(prefers-color-scheme: light)").matches) {
      theme = "light";
    }
  } catch {}
  root.dataset.theme = theme;
})();
