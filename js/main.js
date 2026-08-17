(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var listEl = document.getElementById("home-articles");
  var blogListEl = document.getElementById("blog-articles");
  var target = listEl || blogListEl;
  if (!target) return;

  fetch(resolveArticlesUrl())
    .then(function (r) {
      if (!r.ok) throw new Error("no articles");
      return r.json();
    })
    .then(function (data) {
      var articles = (data.articles || []).slice().sort(function (a, b) {
        return b.date.localeCompare(a.date);
      });
      if (listEl) {
        var homeBase = resolveArticlesUrl() === "data/articles.json" ? "" : "../";
        renderPreviews(listEl, articles.slice(0, 3), homeBase);
      }
      if (blogListEl) {
        renderPreviews(blogListEl, articles, "");
      }
    })
    .catch(function () {
      if (target) {
        target.innerHTML =
          '<li><p class="center">Не удалось загрузить список статей. Откройте сайт через локальный сервер или проверьте файл data/articles.json.</p></li>';
      }
    });

  function resolveArticlesUrl() {
    var path = window.location.pathname.replace(/\\/g, "/");
    if (path.indexOf("/blog/") !== -1 || path.indexOf("/practice/") !== -1 || path.indexOf("/workshops/") !== -1 || path.indexOf("/about/") !== -1 || path.indexOf("/services/") !== -1) {
      return "../data/articles.json";
    }
    return "data/articles.json";
  }

  function renderPreviews(container, articles, base) {
    if (!articles.length) {
      container.innerHTML = "<li><p>Пока нет опубликованных статей.</p></li>";
      return;
    }
    container.innerHTML = articles
      .map(function (a) {
        var href = base + "blog/" + a.slug + ".html";
        var date = formatDate(a.date);
        return (
          '<li><a class="article-preview" href="' +
          escapeAttr(href) +
          '">' +
          '<time datetime="' +
          escapeAttr(a.date) +
          '">' +
          escapeHtml(date) +
          "</time>" +
          "<div>" +
          "<h3>" +
          escapeHtml(a.title) +
          "</h3>" +
          "<p>" +
          escapeHtml(a.excerpt) +
          "</p>" +
          "</div></a></li>"
        );
      })
      .join("");
  }

  function formatDate(iso) {
    var parts = iso.split("-");
    var months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    var d = parseInt(parts[2], 10);
    var m = months[parseInt(parts[1], 10) - 1];
    var y = parts[0];
    return d + " " + m + " " + y;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  /* Motion: hero stagger + scroll reveal (frontend-design skill) */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".hero-copy > *").forEach(function (el, i) {
      el.style.animationDelay = 0.08 * i + "s";
      el.classList.add("hero-in");
    });
  }

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObs.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
