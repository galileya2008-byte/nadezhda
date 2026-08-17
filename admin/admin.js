(function () {
  var REPO = "galileya2008-byte/nadezhda";
  var BRANCH = "main";
  var SITE_BASE = "https://galileya2008-byte.github.io/nadezhda";
  var TOKEN_KEY = "nadya_admin_github_token";

  var state = {
    token: "",
    workshopsSha: null,
    articlesSha: null,
    articleHtmlShas: {},
    scheduleNote: "",
    workshops: [],
    articles: [],
    articleBodies: {},
  };

  var loginPanel = document.getElementById("login-panel");
  var app = document.getElementById("app");
  var loginStatus = document.getElementById("login-status");
  var workshopsStatus = document.getElementById("workshops-status");
  var articlesStatus = document.getElementById("articles-status");

  document.getElementById("btn-login").addEventListener("click", login);
  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("btn-add-workshop").addEventListener("click", addWorkshop);
  document.getElementById("btn-add-article").addEventListener("click", addArticle);
  document.getElementById("btn-save-workshops").addEventListener("click", saveWorkshops);
  document.getElementById("btn-save-articles").addEventListener("click", saveArticles);

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      switchTab(tab.getAttribute("data-tab"));
    });
  });

  var savedToken = localStorage.getItem(TOKEN_KEY);
  if (savedToken) {
    document.getElementById("github-token").value = savedToken;
  }

  function setStatus(el, text, type) {
    el.textContent = text || "";
    el.className = "status" + (type ? " is-" + type : "");
  }

  function switchTab(name) {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-tab") === name);
    });
    document.querySelectorAll(".tab-panel").forEach(function (p) {
      var active = p.id === "tab-" + name;
      p.classList.toggle("is-active", active);
      p.hidden = !active;
    });
  }

  function apiUrl(path) {
    return "https://api.github.com/repos/" + REPO + "/contents/" + path + "?ref=" + BRANCH;
  }

  function githubFetch(path, options) {
    options = options || {};
    options.headers = Object.assign(
      {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + state.token,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      options.headers || {}
    );
    return fetch(apiUrl(path), options).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.message || "Ошибка GitHub API");
        });
      }
      return res.json();
    });
  }

  function decodeBase64Utf8(b64) {
    var binary = atob(b64.replace(/\n/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function encodeBase64Utf8(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = "";
    bytes.forEach(function (b) {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  function login() {
    var token = document.getElementById("github-token").value.trim();
    if (!token) {
      setStatus(loginStatus, "Введите токен GitHub.", "error");
      return;
    }
    state.token = token;
    setStatus(loginStatus, "Проверяем доступ…");
    Promise.all([loadWorkshopsData(), loadArticlesData()])
      .then(function () {
        localStorage.setItem(TOKEN_KEY, token);
        loginPanel.hidden = true;
        app.hidden = false;
        document.getElementById("btn-logout").hidden = false;
        setStatus(loginStatus, "");
        renderWorkshops();
        renderArticles();
      })
      .catch(function (err) {
        setStatus(loginStatus, err.message || "Не удалось войти.", "error");
      });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    state.token = "";
    loginPanel.hidden = false;
    app.hidden = true;
    document.getElementById("btn-logout").hidden = true;
    document.getElementById("github-token").value = "";
  }

  function loadWorkshopsData() {
    return githubFetch("data/workshops.json").then(function (file) {
      state.workshopsSha = file.sha;
      var data = JSON.parse(decodeBase64Utf8(file.content));
      state.scheduleNote = data.scheduleNote || "";
      state.workshops = data.workshops || [];
      document.getElementById("schedule-note").value = state.scheduleNote;
    });
  }

  function loadArticlesData() {
    return githubFetch("data/articles.json").then(function (file) {
      state.articlesSha = file.sha;
      var data = JSON.parse(decodeBase64Utf8(file.content));
      state.articles = data.articles || [];
      state.articleBodies = {};
      state.articleHtmlShas = {};
      var loads = state.articles.map(function (article) {
        return loadArticleBody(article.slug);
      });
      return Promise.all(loads);
    });
  }

  function loadArticleBody(slug) {
    var path = "blog/" + slug + ".html";
    return githubFetch(path)
      .then(function (file) {
        state.articleHtmlShas[slug] = file.sha;
        var html = decodeBase64Utf8(file.content);
        state.articleBodies[slug] = extractArticleContent(html);
      })
      .catch(function () {
        state.articleBodies[slug] = { body: "", ctaText: "" };
      });
  }

  function extractArticleContent(html) {
    var bodyMatch = html.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<aside class="article-cta">/);
    var ctaMatch = html.match(/<aside class="article-cta">\s*<p>([\s\S]*?)<\/p>/);
    return {
      body: bodyMatch ? htmlToPlainText(bodyMatch[1].trim()) : "",
      ctaText: ctaMatch ? ctaMatch[1].replace(/<[^>]+>/g, "").trim() : "",
    };
  }

  function htmlToPlainText(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var lines = [];
    div.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var t = node.textContent.trim();
        if (t) lines.push(t);
      } else if (node.nodeName === "P") {
        lines.push(node.textContent.trim());
        lines.push("");
      } else if (node.nodeName === "H2") {
        lines.push("## " + node.textContent.trim());
        lines.push("");
      } else if (node.nodeName === "H3") {
        lines.push("### " + node.textContent.trim());
        lines.push("");
      } else if (node.nodeName === "UL" || node.nodeName === "OL") {
        node.querySelectorAll("li").forEach(function (li) {
          lines.push("- " + li.textContent.trim());
        });
        lines.push("");
      }
    });
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function renderWorkshops() {
    var container = document.getElementById("workshops-list");
    container.innerHTML = "";
    state.workshops.forEach(function (w, index) {
      container.appendChild(createWorkshopCard(w, index));
    });
  }

  function renderArticles() {
    var container = document.getElementById("articles-list");
    container.innerHTML = "";
    state.articles.forEach(function (a, index) {
      var stored = state.articleBodies[a.slug] || {};
      var copy = Object.assign({}, a, {
        body: stored.body || a.body || "",
        ctaText: stored.ctaText || a.ctaText || "",
      });
      container.appendChild(createArticleCard(copy, index));
    });
  }

  function createWorkshopCard(data, index) {
    var tpl = document.getElementById("workshop-template");
    var node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".card-title").textContent = data.title || "Новая мастерская";
    fillFields(node, data);
    node.querySelector(".btn-delete").addEventListener("click", function () {
      if (confirm("Удалить эту мастерскую?")) {
        collectWorkshopsFromDom();
        state.workshops.splice(index, 1);
        renderWorkshops();
      }
    });
    node.querySelectorAll("input[data-field='title']").forEach(function (input) {
      input.addEventListener("input", function () {
        node.querySelector(".card-title").textContent = input.value || "Новая мастерская";
      });
    });
    return node;
  }

  function createArticleCard(data, index) {
    var tpl = document.getElementById("article-template");
    var node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".card-title").textContent = data.title || "Новая статья";
    fillFields(node, data);
    node.querySelector(".btn-delete").addEventListener("click", function () {
      if (confirm("Удалить эту статью? HTML-файл на сайте останется — его можно удалить вручную на GitHub.")) {
        collectArticlesFromDom();
        state.articles.splice(index, 1);
        renderArticles();
      }
    });
    node.querySelectorAll("input[data-field='title']").forEach(function (input) {
      input.addEventListener("input", function () {
        node.querySelector(".card-title").textContent = input.value || "Новая статья";
      });
    });
    return node;
  }

  function fillFields(node, data) {
    node.querySelectorAll("[data-field]").forEach(function (el) {
      var key = el.getAttribute("data-field");
      if (data[key] !== undefined && data[key] !== null) {
        el.value = data[key];
      }
    });
  }

  function readFields(node) {
    var obj = {};
    node.querySelectorAll("[data-field]").forEach(function (el) {
      obj[el.getAttribute("data-field")] = el.value.trim();
    });
    return obj;
  }

  function addWorkshop() {
    collectWorkshopsFromDom();
    state.workshops.unshift({
      slug: "",
      emoji: "🤍",
      title: "",
      excerpt: "",
      format: "Онлайн · программа",
      duration: "",
      date: new Date().toISOString().slice(0, 10),
      dateLabel: "",
      status: "open",
      spots: "набор открыт",
      price: "уточняется при записи",
      telegramText: "Здравствуйте! Хочу записаться на мастерскую «…».",
    });
    renderWorkshops();
  }

  function addArticle() {
    collectArticlesFromDom();
    state.articles.unshift({
      slug: "",
      title: "",
      excerpt: "",
      date: new Date().toISOString().slice(0, 10),
      category: "Баланс с собой",
      keywords: "",
      body: "Вступление — о чём статья и кому она полезна.\n\n## Подзаголовок\n\nОсновной текст абзацами.",
      ctaText: "Хотите обсудить тему на сессии?",
    });
    renderArticles();
  }

  function collectWorkshopsFromDom() {
    var cards = document.querySelectorAll("#workshops-list .card");
    state.scheduleNote = document.getElementById("schedule-note").value.trim();
    state.workshops = Array.prototype.map.call(cards, readFields);
  }

  function collectArticlesFromDom() {
    var cards = document.querySelectorAll("#articles-list .card");
    state.articles = [];
    state.articleBodies = {};
    Array.prototype.forEach.call(cards, function (card) {
      var data = readFields(card);
      var body = data.body;
      var ctaText = data.ctaText;
      delete data.body;
      delete data.ctaText;
      state.articles.push(data);
      if (data.slug) {
        state.articleBodies[data.slug] = { body: body, ctaText: ctaText };
      }
    });
  }

  function validateSlug(slug, label) {
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(label + ": slug — только латиница, цифры и дефис (например: moya-statya).");
    }
  }

  function saveWorkshops() {
    collectWorkshopsFromDom();
    setStatus(workshopsStatus, "Сохраняем…");
    try {
      state.workshops.forEach(function (w) {
        validateSlug(w.slug, w.title || "Мастерская");
        if (!w.title || !w.excerpt || !w.dateLabel || !w.telegramText) {
          throw new Error("Заполните все обязательные поля мастерской «" + (w.title || w.slug) + "».");
        }
      });
    } catch (err) {
      setStatus(workshopsStatus, err.message, "error");
      return;
    }

    var payload = {
      scheduleNote: state.scheduleNote || "Даты мастерских могут незначительно сдвигаться.",
      workshops: state.workshops,
    };
    var content = JSON.stringify(payload, null, 2) + "\n";

    putFile("data/workshops.json", content, state.workshopsSha, "Обновить мастерские через админку")
      .then(function (res) {
        state.workshopsSha = res.content.sha;
        setStatus(workshopsStatus, "Мастерские сохранены. Сайт обновится через 1–2 минуты.", "ok");
      })
      .catch(function (err) {
        setStatus(workshopsStatus, err.message, "error");
      });
  }

  function saveArticles() {
    collectArticlesFromDom();
    setStatus(articlesStatus, "Сохраняем…");
    try {
      var slugs = {};
      state.articles.forEach(function (a) {
        validateSlug(a.slug, a.title || "Статья");
        if (!a.title || !a.excerpt || !a.date) {
          throw new Error("Заполните все обязательные поля статьи «" + (a.title || a.slug) + "».");
        }
        if (slugs[a.slug]) throw new Error("Дублируется slug: " + a.slug);
        slugs[a.slug] = true;
        if (!state.articleBodies[a.slug] || !state.articleBodies[a.slug].body) {
          throw new Error("Добавьте текст статьи «" + a.title + "».");
        }
      });
    } catch (err) {
      setStatus(articlesStatus, err.message, "error");
      return;
    }

    var jsonContent = JSON.stringify({ articles: state.articles }, null, 2) + "\n";
    var saves = [
      putFile("data/articles.json", jsonContent, state.articlesSha, "Обновить каталог статей через админку"),
    ];

    state.articles.forEach(function (a) {
      var meta = state.articleBodies[a.slug];
      var html = buildArticleHtml(a, meta.body, meta.ctaText);
      var path = "blog/" + a.slug + ".html";
      saves.push(
        putFile(path, html, state.articleHtmlShas[a.slug] || null, "Статья: " + a.title)
      );
    });

    Promise.all(saves)
      .then(function (results) {
        state.articlesSha = results[0].content.sha;
        state.articles.forEach(function (a, i) {
          state.articleHtmlShas[a.slug] = results[i + 1].content.sha;
        });
        setStatus(articlesStatus, "Статьи сохранены. Сайт обновится через 1–2 минуты.", "ok");
      })
      .catch(function (err) {
        setStatus(articlesStatus, err.message, "error");
      });
  }

  function putFile(path, content, sha, message) {
    var body = {
      message: message,
      content: encodeBase64Utf8(content),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;
    return fetch(apiUrl(path), {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + state.token,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.message || "Не удалось сохранить " + path);
        });
      }
      return res.json();
    });
  }

  function buildArticleHtml(article, bodySource, ctaText) {
    var bodyHtml = markdownToArticleHtml(bodySource);
    var displayDate = formatDateRu(article.date);
    var canonical = SITE_BASE + "/blog/" + article.slug + ".html";
    var desc = escapeHtml(article.excerpt);
    var keywords = article.keywords
      ? '\n  <meta name="keywords" content="' + escapeAttr(article.keywords) + '">'
      : "";

    return (
      '<!DOCTYPE html>\n<html lang="ru">\n<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      "  <title>" +
      escapeHtml(article.title) +
      " — Надя о балансе</title>\n" +
      '  <meta name="description" content="' +
      desc +
      '">' +
      keywords +
      "\n" +
      '  <link rel="canonical" href="' +
      canonical +
      '">\n' +
      '<link rel="stylesheet" href="../css/main.css">\n' +
      '  <script type="application/ld+json">\n' +
      "  {\n" +
      '    "@context": "https://schema.org",\n' +
      '    "@type": "Article",\n' +
      '    "headline": "' +
      escapeJson(article.title) +
      '",\n' +
      '    "datePublished": "' +
      article.date +
      '",\n' +
      '    "author": { "@type": "Person", "name": "Надежда Родионова", "alternateName": "Надя Родионова" },\n' +
      '    "description": "' +
      escapeJson(article.excerpt) +
      '"\n' +
      "  }\n" +
      "  </script>\n" +
      "</head>\n<body>\n" +
      '  <a class="skip-link" href="#main">К содержанию</a>\n' +
      '  <header class="site-header">\n' +
      '    <div class="container header-inner">\n' +
      '      <a class="logo" href="../index.html">Надя о балансе <span class="logo-mark" aria-hidden="true">🦋</span></a>\n' +
      '      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Меню</button>\n' +
      '      <nav id="site-nav" class="site-nav">\n' +
      '        <a href="../about/index.html">Обо мне</a>\n' +
      '        <a href="../services/index.html">С чем приходят</a>\n' +
      '        <a href="../workshops/index.html">Мастерские</a>\n' +
      '        <a href="../practice/index.html">Практика</a>\n' +
      '        <a href="index.html">Статьи</a>\n' +
      '        <a class="btn btn-sm" href="https://t.me/nadya_rodionova" target="_blank" rel="noopener">Записаться</a>\n' +
      "      </nav>\n" +
      "    </div>\n" +
      "  </header>\n\n" +
      '  <main id="main" class="article-layout">\n' +
      '    <article class="article-container">\n' +
      '      <header class="article-header">\n' +
      '        <p class="breadcrumb"><a href="../index.html">Главная</a> / <a href="index.html">Статьи</a></p>\n' +
      "        <h1>" +
      escapeHtml(article.title) +
      "</h1>\n" +
      '        <div class="article-meta">\n' +
      '          <time datetime="' +
      escapeAttr(article.date) +
      '">' +
      escapeHtml(displayDate) +
      "</time>\n" +
      '          <span class="tag">' +
      escapeHtml(article.category || "Статьи") +
      "</span>\n" +
      "        </div>\n" +
      "      </header>\n" +
      '      <div class="article-body">\n' +
      bodyHtml +
      "\n" +
      "      </div>\n" +
      '      <aside class="article-cta">\n' +
      "        <p>" +
      escapeHtml(ctaText || "Хотите обсудить тему на сессии?") +
      "</p>\n" +
      '        <a class="btn" href="https://t.me/nadya_rodionova" target="_blank" rel="noopener">Записаться на сессию</a>\n' +
      "      </aside>\n" +
      "    </article>\n" +
      "  </main>\n\n" +
      '  <footer class="site-footer">\n' +
      '    <div class="container footer-inner">\n' +
      '      <p class="footer-brand">Надя о балансе 🦋</p>\n' +
      '      <nav class="footer-nav">\n' +
      '        <a href="https://t.me/nadya_o_balanse" target="_blank" rel="noopener">Канал</a>\n' +
      '        <a href="https://t.me/nadya_rodionova" target="_blank" rel="noopener">Запись на сессию</a>\n' +
      '        <a href="index.html">Статьи</a>\n' +
      "      </nav>\n" +
      "    </div>\n" +
      "  </footer>\n" +
      '  <script src="../js/main.js"></script>\n' +
      "</body>\n</html>\n"
    );
  }

  function markdownToArticleHtml(source) {
    if (window.marked && window.marked.parse) {
      var raw = window.marked.parse(source, { breaks: true });
      return sanitizeArticleHtml(raw);
    }
    return source
      .split(/\n\n+/)
      .map(function (block) {
        block = block.trim();
        if (!block) return "";
        if (block.indexOf("## ") === 0) return "<h2>" + escapeHtml(block.slice(3)) + "</h2>";
        if (block.indexOf("### ") === 0) return "<h3>" + escapeHtml(block.slice(4)) + "</h3>";
        return "<p>" + escapeHtml(block).replace(/\n/g, "<br>") + "</p>";
      })
      .join("\n        ");
  }

  function sanitizeArticleHtml(html) {
    var allowed = ["P", "H2", "H3", "UL", "OL", "LI", "STRONG", "EM", "A", "BR"];
    var div = document.createElement("div");
    div.innerHTML = html;
    walkSanitize(div, allowed);
    return div.innerHTML
      .split("\n")
      .map(function (line) {
        return "        " + line;
      })
      .join("\n");
  }

  function walkSanitize(node, allowed) {
    var children = Array.prototype.slice.call(node.childNodes);
    children.forEach(function (child) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (allowed.indexOf(child.nodeName) === -1) {
          var text = document.createTextNode(child.textContent);
          node.replaceChild(text, child);
        } else {
          if (child.nodeName === "A") {
            child.setAttribute("target", "_blank");
            child.setAttribute("rel", "noopener");
          }
          walkSanitize(child, allowed);
        }
      }
    });
  }

  function formatDateRu(iso) {
    var parts = iso.split("-");
    var months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ];
    return parseInt(parts[2], 10) + " " + months[parseInt(parts[1], 10) - 1] + " " + parts[0];
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

  function escapeJson(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
})();
