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
  var mode = stored === "light" || stored === "dark" ? stored : "system";
  var colors = { light: "#16a34a", dark: "#005a2b" };

  document.documentElement.setAttribute("data-theme", theme);
  Array.prototype.forEach.call(
    document.querySelectorAll('meta[name="theme-color"]'),
    function (meta) {
      if (mode === "system") {
        var media = meta.getAttribute("media") || "";
        meta.setAttribute("content", media.indexOf("dark") >= 0 ? colors.dark : colors.light);
      } else {
        meta.setAttribute("content", colors[theme]);
      }
    },
  );
})();
