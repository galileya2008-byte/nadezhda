(function () {
  /* Карточки мастерских встраиваются скриптом scripts/build-catalogs.js.
     Здесь только клик по карточке с data-page (кроме кликов по ссылкам). */
  function bindWorkshopCardClicks(root) {
    if (!root) return;
    root.querySelectorAll("[data-page]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        window.location.href = card.getAttribute("data-page");
      });
    });
  }

  bindWorkshopCardClicks(document.getElementById("workshops-list"));
  bindWorkshopCardClicks(document.getElementById("home-workshops"));
})();
