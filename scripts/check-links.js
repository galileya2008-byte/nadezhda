const fs = require("fs");
const path = require("path");

const pages = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "workshops/index.html",
  "blog/index.html",
  "blog/kak-vernut-balans-posle-vygoraniya.html",
  "blog/granitsy-bez-chuvstva-viny.html",
  "blog/tri-voprosa-pered-snom.html",
  "workshops/kontakt-s-rodom.html",
  "workshops/rod-i-sila-roda-mini.html",
  "workshops/otnosheniya-muzhskaya-zhenskaya.html",
  "workshops/zimnee-solntsestoyanie.html",
  "workshops/novogodnyaya-meditsiya-2026.html",
  "practice/index.html",
  "practice/tri-voprosa-pered-snom.html",
  "interactive/rod-tree/index.html",
];

const bad = [];

for (const p of pages) {
  if (!fs.existsSync(p)) {
    bad.push("MISSING " + p);
    continue;
  }
  const html = fs.readFileSync(p, "utf8");
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const h = m[1];
    if (
      h.startsWith("http") ||
      h.startsWith("mailto") ||
      h.startsWith("#") ||
      h.startsWith("tel:")
    ) {
      continue;
    }
    if (h.includes("blog/blog/")) bad.push(p + " -> " + h);
    let target;
    if (h.startsWith("/")) {
      target = path.normalize(path.join(".", h.split("#")[0]));
    } else {
      const base = path.dirname(p);
      target = path.normalize(path.join(base, h.split("#")[0]));
    }
    if (h.endsWith("/") || (!path.extname(target) && !h.includes("."))) {
      const idx = path.join(target, "index.html");
      if (!fs.existsSync(target) && !fs.existsSync(idx)) {
        bad.push(p + " 404 " + h);
      }
    } else if (!fs.existsSync(target)) {
      // корневые иконки могут отсутствовать локально — не блокируем проверку контента
      if (
        h === "/favicon.ico" ||
        h === "/apple-touch-icon.png" ||
        h === "/favicon.svg"
      ) {
        continue;
      }
      bad.push(p + " 404 " + h);
    }
  }
}

const blog = fs.readFileSync("blog/index.html", "utf8");
if (!blog.includes('href="kak-vernut-balans-posle-vygoraniya.html"')) {
  bad.push("blog catalog link missing");
}
if (blog.includes("blog/blog/")) bad.push("blog/blog still present");
if (blog.includes("укрепляет SEO")) bad.push("SEO phrase still on blog");

const home = fs.readFileSync("index.html", "utf8");
if (!home.includes('href="blog/kak-vernut-balans-posle-vygoraniya.html"')) {
  bad.push("home article link missing");
}
if (home.includes("everyday life")) bad.push("everyday life still on home");

const ws = fs.readFileSync("workshops/index.html", "utf8");
if (!ws.includes("workshop-card")) bad.push("workshops empty");
if (ws.includes("Идёт набор")) bad.push("old status text");

const pay = fs.readFileSync("workshops/rod-i-sila-roda-mini.html", "utf8");
if (!pay.includes("payform.ru/h2cCaGn")) bad.push("pay link step2 missing");
if (!pay.includes("payform.ru/e0cBnee")) bad.push("pay link step1 missing");

console.log(bad.length ? bad.join("\n") : "OK links+catalogs");
process.exit(bad.length ? 1 : 0);
