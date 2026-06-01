(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("urinest-theme");
  } catch (_) {
    stored = null;
  }

  var prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", theme);
})();
