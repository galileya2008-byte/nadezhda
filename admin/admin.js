(function () {
  var REPO = "galileya2008-byte/nadezhda";
  var BRANCH = "main";
  var SITE_BASE = "https://nadyarodionova.ru";
  var TOKEN_KEY = "nadya_admin_github_token";

  var state = {
    mode: "github",
    token: "",
    workshopsSha: null,
    articlesSha: null,
    sitemapSha: null,
    rssSha: null,
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

  document.getElementById("btn-mode-editor").addEventListener("click", enterEditorMode);
  document.getElementById("btn-mode-github").addEventListener("click", showGithubLogin);
  document.getElementById("btn-login").addEventListener("click", login);
  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("btn-add-workshop").addEventListener("click", addWorkshop);
  document.getElementById("btn-add-article").addEventListener("click", addArticle);
  document.getElementById("btn-save-workshops").addEventListener("click", onSaveWorkshopsClick);
  document.getElementById("btn-save-articles").addEventListener("click", saveArticles);
  document.getElementById("btn-export-all").addEventListener("click", exportPublicationZip);

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

  function showGithubLogin() {
    document.getElementById("github-login-block").hidden = false;
    setStatus(loginStatus, "");
  }

  function enterEditorMode() {
    state.mode = "editor";
    setStatus(loginStatus, "Загружаем данные с сайта…");
    loadPublicData()
      .then(function () {
        openApp();
        setStatus(loginStatus, "");
      })
      .catch(function (err) {
        setStatus(loginStatus, err.message || "Не удалось загрузить. Откройте админку через локальный сервер или с GitHub Pages.", "error");
      });
  }

  function login() {
    var token = document.getElementById("github-token").value.trim();
    if (!token) {
      setStatus(loginStatus, "Введите токен GitHub.", "error");
      return;
    }
    state.mode = "github";
    state.token = token;
    setStatus(loginStatus, "Проверяем доступ…");
    Promise.all([loadWorkshopsData(), loadArticlesData(), loadSeoFilesFromGithub()])
      .then(function () {
        localStorage.setItem(TOKEN_KEY, token);
        openApp();
        setStatus(loginStatus, "");
      })
      .catch(function (err) {
        setStatus(loginStatus, err.message || "Не удалось войти.", "error");
      });
  }

  function openApp() {
    loginPanel.hidden = true;
    app.hidden = false;
    document.getElementById("btn-logout").hidden = false;
    setupUiForMode();
    renderWorkshops();
    renderArticles();
  }

  function setupUiForMode() {
    var isEditor = state.mode === "editor";
    var banner = document.getElementById("mode-banner");
    banner.hidden = !isEditor;
    banner.textContent = isEditor
      ? "Режим подготовки контента: после правок скачайте архив и передайте для публикации. В архиве будут sitemap.xml и rss.xml для индексации статей в Яндексе."
      : "";
    document.getElementById("btn-export-all").hidden = !isEditor;
    document.getElementById("btn-save-articles").hidden = isEditor;
    document.getElementById("btn-save-workshops").textContent = isEditor
      ? "Скачать JSON мастерских"
      : "Сохранить на сайте";
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    state.token = "";
    state.mode = "github";
    loginPanel.hidden = false;
    app.hidden = true;
    document.getElementById("btn-logout").hidden = true;
    document.getElementById("github-login-block").hidden = true;
    document.getElementById("github-token").value = "";
  }

  function loadPublicData() {
    return fetch("../data/workshops.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Не найден data/workshops.json");
        return r.json();
      })
      .then(function (data) {
        state.scheduleNote = data.scheduleNote || "";
        state.workshops = data.workshops || [];
        document.getElementById("schedule-note").value = state.scheduleNote;
        return fetch("../data/articles.json");
      })
      .then(function (r) {
        if (!r.ok) throw new Error("Не найден data/articles.json");
        return r.json();
      })
      .then(function (data) {
        state.articles = data.articles || [];
        state.articleBodies = {};
        state.articleHtmlShas = {};
        var loads = state.articles.map(function (article) {
          return fetch("../blog/" + article.slug + ".html")
            .then(function (r) {
              if (!r.ok) return "";
              return r.text();
            })
            .then(function (html) {
              state.articleBodies[article.slug] = html
                ? extractArticleContent(html)
                : { body: "", ctaText: "" };
            });
        });
        return Promise.all(loads);
      });
  }

  function loadSeoFilesFromGithub() {
    return githubFetch("sitemap.xml")
      .then(function (file) {
        state.sitemapSha = file.sha;
      })
      .catch(function () {
        state.sitemapSha = null;
      })
      .then(function () {
        return githubFetch("rss.xml")
          .then(function (file) {
            state.rssSha = file.sha;
          })
          .catch(function () {
            state.rssSha = null;
          });
      });
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
      kind: "program",
      format: "Онлайн · программа",
      duration: "",
      date: new Date().toISOString().slice(0, 10),
      dateLabel: "",
      status: "open",
      spots: "набор открыт",
      price: "уточняется при записи",
      page: "",
      telegramText: "Здравствуйте! Хочу записаться на мастерскую «…».",
    });
    renderWorkshops();
  }

  function onSaveWorkshopsClick() {
    if (state.mode === "editor") {
      exportWorkshopsJson();
    } else {
      saveWorkshops();
    }
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

    var sitemapContent = buildSitemapXml(state.articles);
    var rssContent = buildRssXml(state.articles);
    saves.push(
      putFile("sitemap.xml", sitemapContent, state.sitemapSha, "Обновить sitemap для поисковиков"),
      putFile("rss.xml", rssContent, state.rssSha, "Обновить RSS ленту статей")
    );

    Promise.all(saves)
      .then(function (results) {
        state.articlesSha = results[0].content.sha;
        state.articles.forEach(function (a, i) {
          state.articleHtmlShas[a.slug] = results[i + 1].content.sha;
        });
        state.sitemapSha = results[results.length - 2].content.sha;
        state.rssSha = results[results.length - 1].content.sha;
        setStatus(
          articlesStatus,
          "Статьи, sitemap и RSS сохранены. Через 1–2 минуты проверьте URL в Яндекс.Вебмастере (переобход).",
          "ok"
        );
      })
      .catch(function (err) {
        setStatus(articlesStatus, err.message, "error");
      });
  }

  function buildWorkshopsPayload() {
    collectWorkshopsFromDom();
    return {
      scheduleNote: state.scheduleNote || "Даты мастерских могут незначительно сдвигаться.",
      workshops: state.workshops,
    };
  }

  function buildArticlesPayload() {
    collectArticlesFromDom();
    return { articles: state.articles };
  }

  function buildSitemapXml(articles) {
    var sorted = (articles || []).slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
    var staticUrls = [
      { loc: SITE_BASE + "/", changefreq: "weekly", priority: "1.0" },
      { loc: SITE_BASE + "/about/", changefreq: "monthly", priority: "0.9" },
      { loc: SITE_BASE + "/services/", changefreq: "monthly", priority: "0.9" },
      { loc: SITE_BASE + "/workshops/", changefreq: "weekly", priority: "0.95" },
      { loc: SITE_BASE + "/workshops/kontakt-s-rodom.html", changefreq: "weekly", priority: "0.95" },
      { loc: SITE_BASE + "/practice/", changefreq: "monthly", priority: "0.85" },
      { loc: SITE_BASE + "/blog/", changefreq: "weekly", priority: "0.9" },
      { loc: SITE_BASE + "/practice/tri-voprosa-pered-snom.html", changefreq: "monthly", priority: "0.85" },
    ];
    var lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    staticUrls.forEach(function (u) {
      lines.push("  <url><loc>" + escapeXml(u.loc) + "</loc><changefreq>" + u.changefreq + "</changefreq><priority>" + u.priority + "</priority></url>");
    });
    sorted.forEach(function (a) {
      lines.push(
        "  <url><loc>" +
          escapeXml(SITE_BASE + "/blog/" + a.slug + ".html") +
          "</loc><lastmod>" +
          escapeXml(a.date) +
          "</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>"
      );
    });
    lines.push("</urlset>", "");
    return lines.join("\n");
  }

  function buildRssXml(articles) {
    var sorted = (articles || []).slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
    var lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
      "  <channel>",
      "    <title>Надя о балансе — статьи</title>",
      "    <link>" + escapeXml(SITE_BASE + "/blog/") + "</link>",
      "    <description>Статьи о балансе, практиках, отношениях и заботе о себе. Надежда Родионова.</description>",
      "    <language>ru</language>",
      '    <atom:link href="' + escapeXml(SITE_BASE + "/rss.xml") + '" rel="self" type="application/rss+xml"/>',
    ];
    sorted.forEach(function (a) {
      var link = SITE_BASE + "/blog/" + a.slug + ".html";
      lines.push("    <item>");
      lines.push("      <title>" + escapeXml(a.title) + "</title>");
      lines.push("      <link>" + escapeXml(link) + "</link>");
      lines.push('      <guid isPermaLink="true">' + escapeXml(link) + "</guid>");
      lines.push("      <pubDate>" + isoToRfc822(a.date) + "</pubDate>");
      lines.push("      <description>" + escapeXml(a.excerpt) + "</description>");
      lines.push("    </item>");
    });
    lines.push("  </channel>", "</rss>", "");
    return lines.join("\n");
  }

  function isoToRfc822(iso) {
    var parts = iso.split("-");
    var d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 9, 0, 0));
    return d.toUTCString().replace("GMT", "+0000");
  }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function exportWorkshopsJson() {
    try {
      collectWorkshopsFromDom();
      state.workshops.forEach(function (w) {
        validateSlug(w.slug, w.title || "Мастерская");
      });
    } catch (err) {
      setStatus(workshopsStatus, err.message, "error");
      return;
    }
    var content = JSON.stringify(buildWorkshopsPayload(), null, 2) + "\n";
    downloadBlob("workshops.json", content, "application/json");
    setStatus(workshopsStatus, "Файл workshops.json скачан. Положите его в data/ на GitHub.", "ok");
  }

  function exportPublicationZip() {
    setStatus(articlesStatus, "Собираем архив…");
    try {
      collectWorkshopsFromDom();
      collectArticlesFromDom();
      validateAllWorkshops();
      validateAllArticles();
    } catch (err) {
      setStatus(articlesStatus, err.message, "error");
      return;
    }
    if (!window.JSZip) {
      setStatus(articlesStatus, "Не загрузилась библиотека JSZip. Обновите страницу.", "error");
      return;
    }
    var zip = new window.JSZip();
    zip.file("data/workshops.json", JSON.stringify(buildWorkshopsPayload(), null, 2) + "\n");
    zip.file("data/articles.json", JSON.stringify(buildArticlesPayload(), null, 2) + "\n");
    zip.file("sitemap.xml", buildSitemapXml(state.articles));
    zip.file("rss.xml", buildRssXml(state.articles));
    zip.file(
      "KAK-OPLIKOVAT.txt",
      "1. Распакуйте архив.\n2. Загрузите файлы в репозиторий nadezhda (ветка main), сохраняя пути.\n3. В Яндекс.Вебмастере: Индексирование → Переобход страниц → URL новой статьи.\n4. Sitemap: https://nadyarodionova.ru/sitemap.xml\n"
    );
    state.articles.forEach(function (a) {
      var meta = state.articleBodies[a.slug];
      zip.file("blog/" + a.slug + ".html", buildArticleHtml(a, meta.body, meta.ctaText));
    });
    zip.generateAsync({ type: "blob" }).then(function (blob) {
      downloadBlob("nadya-site-publish.zip", blob, "application/zip");
      setStatus(articlesStatus, "Архив скачан. Передайте для публикации на GitHub.", "ok");
    });
  }

  function validateAllWorkshops() {
    state.workshops.forEach(function (w) {
      validateSlug(w.slug, w.title || "Мастерская");
      if (!w.title || !w.excerpt || !w.dateLabel || !w.telegramText) {
        throw new Error("Заполните поля мастерской «" + (w.title || w.slug) + "».");
      }
    });
  }

  function validateAllArticles() {
    var slugs = {};
    state.articles.forEach(function (a) {
      validateSlug(a.slug, a.title || "Статья");
      if (!a.title || !a.excerpt || !a.date) {
        throw new Error("Заполните поля статьи «" + (a.title || a.slug) + "».");
      }
      if (slugs[a.slug]) throw new Error("Дублируется slug: " + a.slug);
      slugs[a.slug] = true;
      if (!state.articleBodies[a.slug] || !state.articleBodies[a.slug].body) {
        throw new Error("Добавьте текст статьи «" + a.title + "».");
      }
    });
  }

  function downloadBlob(filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
    var ogTitle = escapeAttr(article.title + " — Надя о балансе");

    return (
      '<!DOCTYPE html>\n<html lang="ru">\n<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '  <meta name="yandex-verification" content="7c4ee8d470948ff7">\n' +
      '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n' +
      '  <link rel="icon" href="/favicon.ico" sizes="any">\n' +
      '  <link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
      "  <title>" +
      escapeHtml(article.title) +
      " — Надя о балансе</title>\n" +
      '  <meta name="description" content="' +
      desc +
      '">' +
      keywords +
      "\n" +
      '  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">\n' +
      '  <meta property="og:type" content="article">\n' +
      '  <meta property="og:locale" content="ru_RU">\n' +
      '  <meta property="og:site_name" content="Надя о балансе">\n' +
      '  <meta property="og:title" content="' +
      ogTitle +
      '">\n' +
      '  <meta property="og:description" content="' +
      desc +
      '">\n' +
      '  <meta property="og:url" content="' +
      canonical +
      '">\n' +
      '  <link rel="canonical" href="' +
      canonical +
      '">\n' +
      '  <link rel="alternate" type="application/rss+xml" title="Статьи — Надя о балансе" href="' +
      SITE_BASE +
      '/rss.xml">\n' +
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
      '    "dateModified": "' +
      article.date +
      '",\n' +
      '    "mainEntityOfPage": { "@type": "WebPage", "@id": "' +
      escapeJson(canonical) +
      '" },\n' +
      '    "author": { "@type": "Person", "name": "Надежда Родионова", "alternateName": "Надя Родионова" },\n' +
      '    "publisher": { "@type": "Organization", "name": "Надя о балансе" },\n' +
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
      '      <p class="footer-note">Родионова Надежда Владимировна<br>ИНН 771671582715</p>\n' +
      "    </div>\n" +
      "  </footer>\n" +
      '  <script src="../js/main.js"></script>\n' +
      '<!-- Yandex.Metrika counter -->\n' +
      '<script type="text/javascript">\n' +
      "    (function(m,e,t,r,i,k,a){\n" +
      "        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};\n" +
      "        m[i].l=1*new Date();\n" +
      "        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}\n" +
      "        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)\n" +
      "    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=112670594', 'ym');\n" +
      "\n" +
      '    ym(112670594, \'init\', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});\n' +
      "</script>\n" +
      '<noscript><div><img src="https://mc.yandex.ru/watch/112670594" style="position:absolute; left:-9999px;" alt="" /></div></noscript>\n' +
      "<!-- /Yandex.Metrika counter -->\n" +
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
