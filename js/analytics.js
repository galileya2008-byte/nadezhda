(function () {
  var COUNTER_ID = 112670594;

  function reachGoal(name, params) {
    if (typeof ym !== "function") return;
    try {
      ym(COUNTER_ID, "reachGoal", name, params || {});
    } catch (e) {
      /* счётчик ещё не готов */
    }
  }

  function pathContext() {
    var ctx = { page: window.location.pathname };
    var article = document.body.getAttribute("data-article");
    var service = document.body.getAttribute("data-service");
    var workshop = document.body.getAttribute("data-workshop");
    if (article) ctx.article = article;
    if (service) ctx.service = service;
    if (workshop) ctx.workshop = workshop;
    return ctx;
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest("a");
      if (!a || !a.href) return;

      var href = a.getAttribute("href") || "";
      var track = a.getAttribute("data-track");
      var ctx = pathContext();

      if (track) {
        reachGoal(track, ctx);
        return;
      }

      if (/t\.me\/nadya_rodionova/i.test(href)) {
        reachGoal("telegram_click", ctx);
        return;
      }

      if (a.hasAttribute("data-track-to-service") || /\/services\//i.test(href)) {
        if (document.body.getAttribute("data-article") || /\/blog\//i.test(window.location.pathname)) {
          reachGoal("article_to_service", ctx);
        }
      }

      if (a.hasAttribute("data-track-to-practice") || /\/practice\//i.test(href)) {
        if (document.body.getAttribute("data-article") || /\/blog\//i.test(window.location.pathname)) {
          reachGoal("article_to_practice", ctx);
        }
      }
    },
    true
  );
})();
