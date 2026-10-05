(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolveUrl() {
    var path = window.location.pathname.replace(/\\/g, "/");
    if (
      path.indexOf("/workshops/") !== -1 ||
      path.indexOf("/blog/") !== -1 ||
      path.indexOf("/practice/") !== -1 ||
      path.indexOf("/about/") !== -1 ||
      path.indexOf("/services/") !== -1
    ) {
      return "../data/testimonials.json";
    }
    return "data/testimonials.json";
  }

  function renderQuote(q) {
    return (
      '<blockquote class="case-quote">' +
      "<p>" +
      escapeHtml(q.text) +
      "</p>" +
      "</blockquote>"
    );
  }

  function renderCase(c) {
    var quotes = (c.quotes || []).map(renderQuote).join("");
    return (
      '<article class="case-card">' +
      '<div class="case-card-head">' +
      '<span class="case-tag">' +
      escapeHtml(c.tag || "Кейс") +
      "</span>" +
      "<h3>" +
      escapeHtml(c.workshop) +
      "</h3>" +
      "</div>" +
      '<div class="case-quotes">' +
      quotes +
      "</div>" +
      "</article>"
    );
  }

  function load() {
    var listEl = document.getElementById("workshop-cases");
    var homeEl = document.getElementById("home-cases");
    if (!listEl && !homeEl) return;

    fetch(resolveUrl())
      .then(function (r) {
        if (!r.ok) throw new Error("no cases");
        return r.json();
      })
      .then(function (data) {
        var cases = data.cases || [];
        if (listEl) {
          listEl.innerHTML = cases.length
            ? cases.map(renderCase).join("")
            : "";
        }
        if (homeEl) {
          homeEl.innerHTML = cases.length
            ? cases
                .slice(0, 1)
                .map(function (c) {
                  var quotes = (c.quotes || []).slice(0, 2).map(renderQuote).join("");
                  return (
                    '<article class="case-card case-card--home">' +
                    '<div class="case-card-head">' +
                    '<span class="case-tag">' +
                    escapeHtml(c.tag || "Кейс") +
                    "</span>" +
                    "<h3>" +
                    escapeHtml(c.workshop) +
                    "</h3>" +
                    "</div>" +
                    '<div class="case-quotes">' +
                    quotes +
                    "</div>" +
                    "</article>"
                  );
                })
                .join("")
            : "";
        }
      })
      .catch(function () {
        if (listEl) listEl.innerHTML = "";
      });
  }

  load();
})();
