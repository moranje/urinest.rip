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
  var themeTokens = window.__BESLISMODEL_THEME_TOKENS__ || {};
  var tokenColors = themeTokens.themeColor || {};
  var metaColors = { light: "", dark: "" };

  Array.prototype.forEach.call(
    document.querySelectorAll('meta[name="theme-color"]'),
    function (meta) {
      var media = meta.getAttribute("media") || "";
      if (media.indexOf("dark") >= 0) metaColors.dark = meta.getAttribute("content") || "";
      if (media.indexOf("light") >= 0) metaColors.light = meta.getAttribute("content") || "";
    },
  );

  var colors = {
    dark: tokenColors.dark || metaColors.dark || tokenColors.light || metaColors.light,
    light: tokenColors.light || metaColors.light,
  };

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
