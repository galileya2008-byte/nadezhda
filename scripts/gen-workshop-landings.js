const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "admin/admin.js"), "utf8");
const start = code.indexOf("function buildWorkshopLandingHtml");
const end = code.indexOf("function putFile(path");
if (start === -1 || end === -1) {
  console.error("buildWorkshopLandingHtml not found");
  process.exit(1);
}
const fnCode = code.slice(start, end);

const sandbox = {
  SITE_BASE: "https://nadyarodionova.ru",
  state: { scheduleNote: "Даты мастерских могут незначительно сдвигаться." },
  escapeHtml: (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;"),
  escapeAttr: (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;"),
  escapeJson: (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'),
  linesFromTextarea: (t) =>
    String(t || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  YANDEX_METRIKA: "",
};

vm.createContext(sandbox);
vm.runInContext(fnCode, sandbox);

const data = JSON.parse(fs.readFileSync(path.join(root, "data/workshops.json"), "utf8"));
data.workshops
  .filter((w) => !w.landingManual)
  .forEach((w) => {
    const html = sandbox.buildWorkshopLandingHtml(w);
    const out = path.join(root, "workshops", w.slug + ".html");
    fs.writeFileSync(out, html);
    console.log("wrote", out);
  });
