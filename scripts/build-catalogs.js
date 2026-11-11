/**
 * Встраивает карточки статей и мастерских в HTML из data/*.json.
 * Единый источник данных — JSON; после правок JSON запускайте эту команду.
 *
 *   node scripts/build-catalogs.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const SITE = "https://nadyarodionova.ru";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso) {
  const parts = iso.split("-");
  const months = [
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
  return (
    parseInt(parts[2], 10) +
    " " +
    months[parseInt(parts[1], 10) - 1] +
    " " +
    parts[0]
  );
}

function telegramUrl(text) {
  return (
    "https://t.me/nadya_rodionova?text=" +
    encodeURIComponent(text || "Здравствуйте! Хочу узнать о мастерских.")
  );
}

function scheduleLabel(status) {
  if (status === "ongoing") return "Идёт сейчас";
  if (status === "completed") return "Завершена";
  return "Запланирована";
}

function enrollmentMeta(w) {
  const enrollment = w.enrollment || "clarify";
  if (enrollment === "open") {
    return {
      className: "workshop-status--open",
      text: "Запись открыта",
      btnClass: "btn",
      btnText: "Записаться",
      href: telegramUrl(w.telegramText),
    };
  }
  if (enrollment === "closed") {
    const recording = w.recordingAvailable;
    if (recording === "yes") {
      return {
        className: "workshop-status--closed",
        text: "Запись закрыта",
        btnClass: "btn",
        btnText: "Узнать про запись",
        href: telegramUrl(w.telegramText),
      };
    }
    return {
      className: "workshop-status--closed",
      text: "Запись закрыта",
      btnClass: "btn btn-ghost",
      btnText: "Уточнить доступность",
      href: telegramUrl(
        w.telegramText ||
          "Здравствуйте! Хочу уточнить доступность материалов мастерской."
      ),
    };
  }
  return {
    className: "workshop-status--clarify",
    text: "Уточнить доступность",
    btnClass: "btn btn-ghost",
    btnText: "Уточнить доступность",
    href: telegramUrl(
      w.telegramText ||
        "Здравствуйте! Хочу уточнить доступность мастерской."
    ),
  };
}

function articleCard(a, href) {
  return (
    "<li><a class=\"article-preview\" href=\"" +
    escapeHtml(href) +
    "\">" +
    "<time datetime=\"" +
    escapeHtml(a.date) +
    "\">" +
    escapeHtml(formatDate(a.date)) +
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
}

function workshopCard(w, opts) {
  const compact = !!opts.compact;
  const pagePrefix = opts.pagePrefix || "";
  const enr = enrollmentMeta(w);
  const page = w.page ? String(w.page).trim() : "";
  const pageHref = page ? pagePrefix + page : "";
  const title = (w.emoji ? w.emoji + " " : "") + w.title;
  const titleHtml = pageHref
    ? '<a class="workshop-title-link" href="' +
      escapeHtml(pageHref) +
      '">' +
      escapeHtml(title) +
      "</a>"
    : escapeHtml(title);
  const durationLine = w.duration ? w.duration : w.format;
  const isMini = w.kind === "mini";
  const cardClass =
    "workshop-card" +
    (compact ? " workshop-card--compact" : "") +
    (pageHref ? " workshop-card--has-page" : "") +
    (isMini ? " workshop-card--mini" : "");
  const dataHref = pageHref
    ? ' data-page="' + escapeHtml(pageHref) + '"'
    : "";
  const miniBadge = isMini
    ? '<span class="workshop-badge workshop-badge--mini">Мини · 2 недели</span>'
    : "";
  const schedule =
    '<span class="workshop-schedule-pill">' +
    escapeHtml(scheduleLabel(w.scheduleStatus)) +
    "</span>";

  if (compact) {
    const compactBtn = pageHref
      ? '<a class="btn" href="' + escapeHtml(pageHref) + '">Подробнее</a>'
      : '<a class="' +
        enr.btnClass +
        '" href="' +
        escapeHtml(enr.href) +
        '" target="_blank" rel="noopener" data-track="telegram_click">' +
        escapeHtml(enr.btnText) +
        "</a>";
    return (
      "<li class=\"" +
      cardClass +
      "\"" +
      dataHref +
      ">" +
      '<div class="workshop-card-head">' +
      miniBadge +
      '<span class="workshop-status ' +
      enr.className +
      '">' +
      escapeHtml(enr.text) +
      "</span>" +
      schedule +
      "<h3>" +
      titleHtml +
      "</h3>" +
      "</div>" +
      '<p class="workshop-excerpt">' +
      escapeHtml(w.excerpt) +
      "</p>" +
      '<ul class="workshop-meta">' +
      "<li><strong>" +
      escapeHtml(w.dateLabel) +
      "</strong></li>" +
      "<li>" +
      escapeHtml(durationLine) +
      "</li>" +
      "</ul>" +
      compactBtn +
      "</li>"
    );
  }

  const actions = pageHref
    ? '<a class="btn" href="' +
      escapeHtml(pageHref) +
      '">Подробнее</a>' +
      '<a class="' +
      enr.btnClass +
      '" href="' +
      escapeHtml(enr.href) +
      '" target="_blank" rel="noopener" data-track="telegram_click">' +
      escapeHtml(enr.btnText) +
      "</a>"
    : '<a class="' +
      enr.btnClass +
      '" href="' +
      escapeHtml(enr.href) +
      '" target="_blank" rel="noopener" data-track="telegram_click">' +
      escapeHtml(enr.btnText) +
      "</a>" +
      '<a class="btn btn-ghost" href="https://t.me/nadya_rodionova" target="_blank" rel="noopener" data-track="telegram_click">Задать вопрос</a>';

  return (
    "<li class=\"" +
    cardClass +
    "\"" +
    dataHref +
    ">" +
    '<div class="workshop-card-head">' +
    miniBadge +
    '<span class="workshop-status ' +
    enr.className +
    '">' +
    escapeHtml(enr.text) +
    "</span>" +
    schedule +
    "<h3>" +
    titleHtml +
    "</h3>" +
    "</div>" +
    '<p class="workshop-excerpt">' +
    escapeHtml(w.excerpt) +
    "</p>" +
    '<ul class="workshop-meta">' +
    "<li><strong>Когда:</strong> " +
    escapeHtml(w.dateLabel) +
    "</li>" +
    "<li><strong>Статус программы:</strong> " +
    escapeHtml(scheduleLabel(w.scheduleStatus)) +
    "</li>" +
    "<li><strong>Длительность:</strong> " +
    escapeHtml(w.duration || "—") +
    "</li>" +
    "<li><strong>Формат:</strong> " +
    escapeHtml(w.format) +
    "</li>" +
    (w.price
      ? "<li><strong>Участие:</strong> " + escapeHtml(w.price) + "</li>"
      : "") +
    "</ul>" +
    '<div class="workshop-actions">' +
    actions +
    "</div>" +
    "</li>"
  );
}

function miniIntro(program) {
  if (!program || !program.paragraphs || !program.paragraphs.length) return "";
  const title = program.title
    ? '<h2 class="workshops-mini-intro-title">' +
      escapeHtml(program.title) +
      "</h2>"
    : "";
  const subtitle = program.subtitle
    ? '<p class="workshops-mini-intro-sub">' +
      escapeHtml(program.subtitle) +
      "</p>"
    : "";
  const body = program.paragraphs
    .map(function (p) {
      return "<p>" + escapeHtml(p) + "</p>";
    })
    .join("");
  return (
    '<li class="workshops-mini-intro">' +
    '<div class="workshops-mini-intro-inner">' +
    title +
    subtitle +
    body +
    "</div></li>"
  );
}

function sortWorkshops(items) {
  const rank = { open: 0, clarify: 1, closed: 2 };
  return items.slice().sort(function (a, b) {
    const ea = rank[a.enrollment] != null ? rank[a.enrollment] : 1;
    const eb = rank[b.enrollment] != null ? rank[b.enrollment] : 1;
    if (ea !== eb) return ea - eb;
    return a.date.localeCompare(b.date);
  });
}

function replaceListById(html, id, innerHtml) {
  const open = new RegExp('<ul\\b[^>]*\\sid="' + id + '"[^>]*>', 'i').exec(html);
  if (!open) throw new Error('Не найден <ul id="' + id + '">');
  const tags = /<\/?ul\b[^>]*>/gi;
  tags.lastIndex = open.index + open[0].length;
  let depth = 1;
  let tag;
  while ((tag = tags.exec(html))) {
    depth += /^<\//.test(tag[0]) ? -1 : 1;
    if (depth === 0) {
      return html.slice(0, open.index + open[0].length) +
        "\n" + innerHtml + "\n      " + html.slice(tag.index);
    }
  }
  throw new Error('Не закрыт <ul id="' + id + '">');
}

function replaceByIdContent(html, id, innerHtml) {
  const re = new RegExp('(<([a-z][a-z0-9]*)\\b[^>]*\\sid="' + id + '"[^>]*>)[\\s\\S]*?(</\\2\\s*>)', 'i');
  if (!re.test(html)) throw new Error('Не найден элемент id="' + id + '"');
  return html.replace(re, function (_, open, tag, close) {
    return open + "\n" + innerHtml + "\n      " + close;
  });
}

function rfc822(iso) {
  const d = new Date(iso + "T12:00:00+03:00");
  return d.toUTCString().replace("GMT", "+0000");
}

function buildRss(articles) {
  const sorted = articles.slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  const items = sorted
    .map(function (a) {
      const url = SITE + "/blog/" + a.slug + ".html";
      return (
        "    <item>\n" +
        "      <title>" +
        escapeHtml(a.title) +
        "</title>\n" +
        "      <link>" +
        url +
        "</link>\n" +
        '      <guid isPermaLink="true">' +
        url +
        "</guid>\n" +
        "      <pubDate>" +
        rfc822(a.date) +
        "</pubDate>\n" +
        "      <description>" +
        escapeHtml(a.excerpt) +
        "</description>\n" +
        "    </item>"
      );
    })
    .join("\n");
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    "  <channel>\n" +
    "    <title>Надя о балансе — статьи</title>\n" +
    "    <link>" +
    SITE +
    "/blog/</link>\n" +
    "    <description>Статьи о балансе, практиках, отношениях и заботе о себе. Надежда Родионова.</description>\n" +
    "    <language>ru</language>\n" +
    '    <atom:link href="' +
    SITE +
    '/rss.xml" rel="self" type="application/rss+xml"/>\n' +
    items +
    "\n  </channel>\n</rss>\n"
  );
}

function buildSitemap(articles, workshops) {
  const urls = [
    { loc: SITE + "/", changefreq: "weekly", priority: "1.0", lastmod: "2026-10-19" },
    { loc: SITE + "/about/", changefreq: "monthly", priority: "0.9", lastmod: "2026-10-19" },
    { loc: SITE + "/services/", changefreq: "monthly", priority: "0.9", lastmod: "2026-10-19" },
    { loc: SITE + "/workshops/", changefreq: "weekly", priority: "0.95", lastmod: "2026-10-19" },
  ];

  const workshopPages = new Set();
  workshops.forEach(function (w) {
    if (w.page) workshopPages.add(w.page);
  });
  Array.from(workshopPages)
    .sort()
    .forEach(function (page) {
      urls.push({
        loc: SITE + "/workshops/" + page,
        changefreq: "weekly",
        priority: "0.94",
      });
    });

  urls.push(
    { loc: SITE + "/interactive/rod-tree/", changefreq: "monthly", priority: "0.92", lastmod: "2026-10-07" },
    { loc: SITE + "/practice/", changefreq: "monthly", priority: "0.85" },
    { loc: SITE + "/practice/tri-voprosa-pered-snom.html", changefreq: "monthly", priority: "0.85" },
    { loc: SITE + "/blog/", changefreq: "weekly", priority: "0.9", lastmod: "2026-10-19" }
  );

  articles
    .slice()
    .sort(function (a, b) {
      return b.date.localeCompare(a.date);
    })
    .forEach(function (a) {
      urls.push({
        loc: SITE + "/blog/" + a.slug + ".html",
        lastmod: a.date,
        changefreq: "monthly",
        priority: "0.8",
      });
    });

  const body = urls
    .map(function (u) {
      let line =
        "  <url><loc>" +
        u.loc +
        "</loc>";
      if (u.lastmod) line += "<lastmod>" + u.lastmod + "</lastmod>";
      if (u.changefreq) line += "<changefreq>" + u.changefreq + "</changefreq>";
      if (u.priority) line += "<priority>" + u.priority + "</priority>";
      line += "</url>";
      return line;
    })
    .join("\n");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    "\n</urlset>\n"
  );
}

function main() {
  const articlesData = JSON.parse(
    fs.readFileSync(path.join(root, "data/articles.json"), "utf8")
  );
  const workshopsData = JSON.parse(
    fs.readFileSync(path.join(root, "data/workshops.json"), "utf8")
  );
  const articles = (articlesData.articles || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  const workshops = sortWorkshops(workshopsData.workshops || []);

  const blogArticles = articles
    .map(function (a) {
      return articleCard(a, a.slug + ".html");
    })
    .join("\n          ");

  const homeArticles = articles
    .slice(0, 3)
    .map(function (a) {
      return articleCard(a, "blog/" + a.slug + ".html");
    })
    .join("\n          ");

  let workshopsFull = "";
  let miniShown = false;
  workshops.forEach(function (w) {
    if (w.kind === "mini" && !miniShown && workshopsData.miniProgram) {
      workshopsFull += miniIntro(workshopsData.miniProgram) + "\n          ";
      miniShown = true;
    }
    workshopsFull += workshopCard(w, { pagePrefix: "" }) + "\n          ";
  });

  const homeWorkshops = workshops
    .filter(function (w) {
      return w.enrollment === "open" || w.scheduleStatus === "planned";
    })
    .slice(0, 2)
    .map(function (w) {
      return workshopCard(w, { compact: true, pagePrefix: "workshops/" });
    })
    .join("\n          ");

  const note =
    "<em>" +
    escapeHtml(
      workshopsData.scheduleNote ||
        "Даты мастерских могут незначительно сдвигаться."
    ) +
    "</em>";

  let indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  indexHtml = replaceListById(indexHtml, "home-articles", "          " + homeArticles);
  indexHtml = replaceListById(indexHtml, "home-workshops", "          " + homeWorkshops);
  fs.writeFileSync(path.join(root, "index.html"), indexHtml);

  let blogHtml = fs.readFileSync(path.join(root, "blog/index.html"), "utf8");
  blogHtml = replaceListById(blogHtml, "blog-articles", "          " + blogArticles);
  fs.writeFileSync(path.join(root, "blog/index.html"), blogHtml);

  let workshopsHtml = fs.readFileSync(
    path.join(root, "workshops/index.html"),
    "utf8"
  );
  workshopsHtml = replaceListById(
    workshopsHtml,
    "workshops-list",
    "          " + workshopsFull.trim()
  );
  workshopsHtml = replaceByIdContent(
    workshopsHtml,
    "workshops-schedule-note",
    "          " + note
  );
  fs.writeFileSync(path.join(root, "workshops/index.html"), workshopsHtml);

  fs.writeFileSync(path.join(root, "rss.xml"), buildRss(articles));
  fs.writeFileSync(
    path.join(root, "sitemap.xml"),
    buildSitemap(articles, workshopsData.workshops || [])
  );

  console.log("OK: catalogs, sitemap.xml, rss.xml обновлены");
}

main();
