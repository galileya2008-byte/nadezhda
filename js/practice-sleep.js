(function () {
  var STORAGE_KEY = "nadya-sleep-practice-draft";
  var panels = document.querySelectorAll(".practice-panel");
  var progressFill = document.getElementById("progress-fill");
  var stepLabel = document.getElementById("step-label");
  var summaryEl = document.getElementById("summary");
  var copyBtn = document.getElementById("copy-summary");
  var copyStatus = document.getElementById("copy-status");
  var restartBtn = document.getElementById("restart");

  var questions = [
    "1. Что сегодня было по-настоящему моим?",
    "2. Где я сегодня отдал(а) больше, чем хотел(а)?",
    "3. Чему я говорю «спасибо» перед сном?",
  ];

  function getAnswers() {
    return [
      (document.getElementById("answer-1") || {}).value || "",
      (document.getElementById("answer-2") || {}).value || "",
      (document.getElementById("answer-3") || {}).value || "",
    ];
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers: getAnswers(), savedAt: new Date().toISOString() })
      );
    } catch (e) {
      /* private mode */
    }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data.answers || data.answers.length !== 3) return;
      var d = new Date(data.savedAt);
      var today = new Date();
      if (
        d.getFullYear() !== today.getFullYear() ||
        d.getMonth() !== today.getMonth() ||
        d.getDate() !== today.getDate()
      ) {
        return;
      }
      document.getElementById("answer-1").value = data.answers[0];
      document.getElementById("answer-2").value = data.answers[1];
      document.getElementById("answer-3").value = data.answers[2];
    } catch (e) {
      /* ignore */
    }
  }

  function showPanel(name) {
    panels.forEach(function (panel) {
      var active = panel.getAttribute("data-panel") === name;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });

    var stepMap = { intro: 0, 1: 1, 2: 2, 3: 3, done: 3 };
    var step = stepMap[name] !== undefined ? stepMap[name] : 0;
    var pct = name === "done" ? 100 : (step / 3) * 100;
    if (progressFill) progressFill.style.width = pct + "%";
    if (stepLabel) {
      if (name === "intro") stepLabel.textContent = "Перед началом";
      else if (name === "done") stepLabel.textContent = "Завершено";
      else stepLabel.textContent = "Вопрос " + name + " из 3";
    }

    if (name === "done") buildSummary();
    saveDraft();
  }

  function buildSummary() {
    var answers = getAnswers();
    var dateStr = new Date().toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    var lines = ["Три вопроса перед сном — " + dateStr, ""];
    for (var i = 0; i < 3; i++) {
      lines.push(questions[i]);
      lines.push(answers[i].trim() ? answers[i].trim() : "— (пропущено)");
      lines.push("");
    }
    lines.push("— Практика «Надя о балансе»");
    if (summaryEl) summaryEl.textContent = lines.join("\n");
  }

  document.querySelectorAll("[data-go]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showPanel(btn.getAttribute("data-go"));
    });
  });

  ["answer-1", "answer-2", "answer-3"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", saveDraft);
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = summaryEl ? summaryEl.textContent : "";
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }

  function fallbackCopy() {
    if (!summaryEl) return;
    var range = document.createRange();
    range.selectNodeContents(summaryEl);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    try {
      document.execCommand("copy");
      showCopied();
    } catch (e) {
      if (copyStatus) copyStatus.textContent = "Выделите текст и скопируйте вручную.";
    }
    sel.removeAllRanges();
  }

  function showCopied() {
    if (copyStatus) {
      copyStatus.textContent = "Скопировано в буфер обмена.";
      setTimeout(function () {
        copyStatus.textContent = "";
      }, 3000);
    }
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      ["answer-1", "answer-2", "answer-3"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
      });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      showPanel("intro");
    });
  }

  loadDraft();
  showPanel("intro");
})();
