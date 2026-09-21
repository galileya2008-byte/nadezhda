(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function telegramUrl(text) {
    return (
      "https://t.me/nadya_rodionova?text=" + encodeURIComponent(text || "Здравствуйте! Хочу узнать о мастерских.")
    );
  }

  function workshopPageHref(page) {
    if (!page) return "";
    var path = window.location.pathname.replace(/\\/g, "/");
    if (path.indexOf("/workshops/") !== -1) return page;
    return "workshops/" + page;
  }

  function resolveWorkshopsUrl() {
    var path = window.location.pathname.replace(/\\/g, "/");
    if (path.indexOf("/workshops/") !== -1 || path.indexOf("/blog/") !== -1 || path.indexOf("/practice/") !== -1 || path.indexOf("/about/") !== -1 || path.indexOf("/services/") !== -1) {
      return "../data/workshops.json";
    }
    return "data/workshops.json";
  }

  function renderWorkshopCard(w, compact) {
    var isOpen = w.status === "open";
    var statusClass = isOpen ? "workshop-status--open" : "workshop-status--closed";
    var statusText = isOpen ? "Идёт набор" : "Набор закрыт";
    var btnClass = isOpen ? "btn" : "btn btn-ghost";
    var btnText = isOpen ? "Записаться" : "Узнать";
    var href = telegramUrl(w.telegramText);
    var page = w.page ? String(w.page).trim() : "";
    var pageHref = workshopPageHref(page);
    var title = (w.emoji ? w.emoji + " " : "") + w.title;
    var titleHtml = pageHref
      ? '<a class="workshop-title-link" href="' + escapeHtml(pageHref) + '">' + escapeHtml(title) + "</a>"
      : escapeHtml(title);
    var durationLine = w.duration ? w.duration : w.format;
    var cardClass = "workshop-card" + (compact ? " workshop-card--compact" : "") + (pageHref ? " workshop-card--has-page" : "");
    var dataHref = pageHref ? ' data-page="' + escapeHtml(pageHref) + '"' : "";

    if (compact) {
      var compactBtn = pageHref
        ? '<a class="btn" href="' + escapeHtml(pageHref) + '">Подробнее</a>'
        : '<a class="' + btnClass + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + btnText + "</a>";
      return (
        "<li class=\"" + cardClass + "\"" + dataHref + ">" +
        '<div class="workshop-card-head">' +
        '<span class="workshop-status ' + statusClass + '">' + statusText + "</span>" +
        "<h3>" + titleHtml + "</h3>" +
        "</div>" +
        '<p class="workshop-excerpt">' + escapeHtml(w.excerpt) + "</p>" +
        '<ul class="workshop-meta">' +
        "<li><strong>" + escapeHtml(w.dateLabel) + "</strong></li>" +
        "<li>" + escapeHtml(durationLine) + "</li>" +
        "</ul>" +
        compactBtn +
        "</li>"
      );
    }

    var actions = pageHref
      ? '<a class="btn" href="' + escapeHtml(pageHref) + '">Подробнее</a>' +
        '<a class="' + btnClass + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + btnText + "</a>"
      : '<a class="' + btnClass + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + btnText + "</a>" +
        '<a class="btn btn-ghost" href="https://t.me/nadya_rodionova" target="_blank" rel="noopener">Задать вопрос</a>';

    return (
      "<li class=\"" + cardClass + "\"" + dataHref + ">" +
      '<div class="workshop-card-head">' +
      '<span class="workshop-status ' + statusClass + '">' + statusText + "</span>" +
      "<h3>" + titleHtml + "</h3>" +
      "</div>" +
      '<p class="workshop-excerpt">' + escapeHtml(w.excerpt) + "</p>" +
      '<ul class="workshop-meta">' +
      "<li><strong>Когда:</strong> " + escapeHtml(w.dateLabel) + "</li>" +
      "<li><strong>Длительность:</strong> " + escapeHtml(w.duration || "—") + "</li>" +
      "<li><strong>Формат:</strong> " + escapeHtml(w.format) + "</li>" +
      (w.price ? "<li><strong>Участие:</strong> " + escapeHtml(w.price) + "</li>" : "") +
      "</ul>" +
      '<div class="workshop-actions">' +
      actions +
      "</div>" +
      "</li>"
    );
  }

  function loadWorkshops() {
    var listEl = document.getElementById("workshops-list");
    var homeEl = document.getElementById("home-workshops");
    if (!listEl && !homeEl) return;

    fetch(resolveWorkshopsUrl())
      .then(function (r) {
        if (!r.ok) throw new Error("no workshops");
        return r.json();
      })
      .then(function (data) {
        var items = (data.workshops || []).slice().sort(function (a, b) {
          if (a.status !== b.status) return a.status === "open" ? -1 : 1;
          return a.date.localeCompare(b.date);
        });
        if (listEl) {
          listEl.innerHTML = items.length
            ? items.map(function (w) { return renderWorkshopCard(w, false); }).join("")
            : "<li><p>Пока нет запланированных мастерских.</p></li>";
          bindWorkshopCardClicks(listEl);
          var noteEl = document.getElementById("workshops-schedule-note");
          if (noteEl && data.scheduleNote) {
            noteEl.innerHTML = "<em>" + escapeHtml(data.scheduleNote) + "</em>";
          }
        }
        if (homeEl) {
          var preview = items.slice(0, 2);
          homeEl.innerHTML = preview.length
            ? preview.map(function (w) { return renderWorkshopCard(w, true); }).join("")
            : "";
          bindWorkshopCardClicks(homeEl);
        }
      })
      .catch(function () {
        var msg = "<li><p>Не удалось загрузить мастерские. Откройте сайт через локальный сервер или проверьте data/workshops.json.</p></li>";
        if (listEl) listEl.innerHTML = msg;
      });
  }

  function bindWorkshopCardClicks(root) {
    root.querySelectorAll("[data-page]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        window.location.href = card.getAttribute("data-page");
      });
    });
  }

  loadWorkshops();
})();
