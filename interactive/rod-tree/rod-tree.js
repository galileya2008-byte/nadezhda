(function () {
  var cfg = window.ROD_TREE_CONFIG;
  if (!cfg) return;

  var CATEGORY_ORDER = ["roots", "trunk", "branches", "crown"];
  var state = {
    screen: "intro",
    step: 0,
    answers: {},
  };

  var els = {
    intro: document.getElementById("rod-intro"),
    quiz: document.getElementById("rod-quiz"),
    result: document.getElementById("rod-result"),
    questionTitle: document.getElementById("rod-question-title"),
    options: document.getElementById("rod-options"),
    progress: document.getElementById("rod-progress"),
    progressLabel: document.getElementById("rod-progress-label"),
    nextBtn: document.getElementById("rod-next"),
    backBtn: document.getElementById("rod-back"),
    resultLive: document.getElementById("rod-result-live"),
    draft: document.getElementById("rod-draft"),
    telegram: document.getElementById("rod-telegram"),
    copyStatus: document.getElementById("rod-copy-status"),
    treeImg: document.getElementById("rod-tree-img"),
    glow: document.getElementById("rod-tree-glow"),
  };

  if (els.treeImg && cfg.imageSrc) {
    els.treeImg.src = cfg.imageSrc;
    els.treeImg.alt = "Иллюстрация: древо рода";
  }

  restoreState();
  bindUi();
  render();

  function bindUi() {
    document.getElementById("rod-start").addEventListener("click", function () {
      state.screen = "quiz";
      state.step = 0;
      track("rod_tree_start");
      persist();
      render();
      focusPanel();
    });

    els.nextBtn.addEventListener("click", function () {
      if (!state.answers[state.step]) return;
      flashZone(getCategoryForStep(state.step));
      if (state.step >= cfg.questions.length - 1) {
        finish();
        return;
      }
      state.step += 1;
      persist();
      render();
      focusPanel();
    });

    els.backBtn.addEventListener("click", function () {
      if (state.step === 0) {
        state.screen = "intro";
      } else {
        state.step -= 1;
      }
      persist();
      render();
      focusPanel();
    });

    document.getElementById("rod-restart").addEventListener("click", function () {
      clearState();
      state = { screen: "intro", step: 0, answers: {} };
      clearZones();
      render();
      focusPanel();
    });

    document.getElementById("rod-copy").addEventListener("click", copyDraft);
    document.getElementById("rod-share").addEventListener("click", shareInteractive);
  }

  function render() {
    showScreen(state.screen);
    if (state.screen === "quiz") renderQuiz();
    if (state.screen === "result") renderResult();
    updateZonesForState();
  }

  function showScreen(name) {
    els.intro.hidden = name !== "intro";
    els.quiz.hidden = name !== "quiz";
    els.result.hidden = name !== "result";
  }

  function renderQuiz() {
    var q = cfg.questions[state.step];
    var total = cfg.questions.length;
    els.questionTitle.textContent = q.text;
    els.progressLabel.textContent = "Вопрос " + (state.step + 1) + " из " + total;
    els.progressLabel.setAttribute("aria-valuenow", String(state.step + 1));
    els.progressLabel.setAttribute("aria-valuemax", String(total));

    els.progress.innerHTML = "";
    for (var i = 0; i < total; i++) {
      var span = document.createElement("span");
      if (i <= state.step) span.className = "is-on";
      els.progress.appendChild(span);
    }

    els.options.innerHTML = "";
    q.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rod-option";
      btn.textContent = opt.label;
      if (state.answers[state.step] === opt.category) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", function () {
        state.answers[state.step] = opt.category;
        flashZone(opt.category);
        persist();
        renderQuiz();
        updateZonesForState();
      });
      els.options.appendChild(btn);
    });

    els.nextBtn.disabled = !state.answers[state.step];
    els.nextBtn.textContent =
      state.step >= cfg.questions.length - 1 ? "Показать результат" : "Далее";
    els.backBtn.textContent = state.step === 0 ? "К началу" : "Назад";
  }

  function finish() {
    state.screen = "result";
    track("rod_tree_complete");
    persist();
    render();
    focusPanel();
  }

  function getLeaders() {
    var scores = { roots: 0, trunk: 0, branches: 0, crown: 0 };
    Object.keys(state.answers).forEach(function (key) {
      var cat = state.answers[key];
      if (scores[cat] !== undefined) scores[cat] += 1;
    });
    var max = 0;
    CATEGORY_ORDER.forEach(function (id) {
      if (scores[id] > max) max = scores[id];
    });
    var leaders = CATEGORY_ORDER.filter(function (id) {
      return scores[id] === max && max > 0;
    });
    return { scores: scores, leaders: leaders };
  }

  function renderResult() {
    var data = getLeaders();
    var html = "";
    data.leaders.forEach(function (id) {
      var cat = cfg.categories[id];
      var links = (cat.links || [])
        .map(function (l) {
          return '<a href="' + escapeAttr(l.href) + '">' + escapeHtml(l.label) + "</a>";
        })
        .join("");
      html +=
        '<article class="rod-result-card">' +
        "<h3>" +
        escapeHtml(cat.title) +
        "</h3>" +
        "<p>" +
        escapeHtml(cat.lead) +
        "</p>" +
        '<div class="rod-result-links">' +
        links +
        "</div></article>";
    });
    html +=
      '<p class="rod-note">Это направление для размышления на основе ваших ответов, а не диагностика.</p>';
    els.resultLive.innerHTML = html;

    var topics = data.leaders
      .map(function (id) {
        return cfg.categories[id].title;
      })
      .join("; ");
    var draft =
      "Надя, я прошла интерактив «Древо рода». Мой результат — " +
      topics +
      ". Хочу обсудить, с какой практики или мастерской начать.";
    els.draft.textContent = draft;

    var params = new URLSearchParams();
    params.set("text", draft);
    els.telegram.href = cfg.telegramUrl + "?" + params.toString();
    els.telegram.onclick = function () {
      track("rod_tree_cta_telegram");
    };

    highlightLeaders(data.leaders);
  }

  function getCategoryForStep(step) {
    return state.answers[step] || null;
  }

  function flashZone(category) {
    if (!category) return;
    document.querySelectorAll(".rod-zone").forEach(function (z) {
      z.classList.remove("is-active");
    });
    var el = document.querySelector('.rod-zone[data-zone="' + category + '"]');
    if (el) el.classList.add("is-active");
    if (els.glow) els.glow.classList.add("is-on");
  }

  function highlightLeaders(leaders) {
    clearZones();
    if (els.glow) els.glow.classList.add("is-on");
    leaders.forEach(function (id) {
      var el = document.querySelector('.rod-zone[data-zone="' + id + '"]');
      if (el) el.classList.add("is-active");
    });
  }

  function updateZonesForState() {
    if (state.screen === "result") {
      highlightLeaders(getLeaders().leaders);
      return;
    }
    if (state.screen === "quiz" && state.answers[state.step]) {
      flashZone(state.answers[state.step]);
    } else if (state.screen === "intro") {
      clearZones();
    }
  }

  function clearZones() {
    document.querySelectorAll(".rod-zone").forEach(function (z) {
      z.classList.remove("is-active");
    });
    if (els.glow) els.glow.classList.remove("is-on");
  }

  function copyDraft() {
    var text = els.draft.textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          els.copyStatus.textContent = "Сообщение скопировано.";
        },
        function () {
          fallbackCopy(text);
        }
      );
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      els.copyStatus.textContent = "Сообщение скопировано.";
    } catch (e) {
      els.copyStatus.textContent = "Скопируйте текст вручную из поля выше.";
    }
    ta.remove();
  }

  function shareInteractive() {
    var url = cfg.publicUrl;
    var title = "Древо рода — интерактив Нади о балансе";
    if (navigator.share) {
      navigator
        .share({ title: title, url: url, text: "Интерактив «Древо рода»" })
        .catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        els.copyStatus.textContent = "Ссылка на интерактив скопирована.";
      });
    } else {
      els.copyStatus.textContent = "Ссылка: " + url;
    }
  }

  function persist() {
    try {
      sessionStorage.setItem(
        cfg.storageKey,
        JSON.stringify({
          screen: state.screen,
          step: state.step,
          answers: state.answers,
        })
      );
    } catch (e) {}
  }

  function restoreState() {
    try {
      var raw = sessionStorage.getItem(cfg.storageKey);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;
      state.screen = saved.screen || "intro";
      state.step = typeof saved.step === "number" ? saved.step : 0;
      state.answers = saved.answers || {};
      if (state.screen === "quiz" && state.step >= cfg.questions.length) {
        state.step = cfg.questions.length - 1;
      }
    } catch (e) {}
  }

  function clearState() {
    try {
      sessionStorage.removeItem(cfg.storageKey);
    } catch (e) {}
  }

  function focusPanel() {
    var panel =
      state.screen === "intro"
        ? els.intro
        : state.screen === "quiz"
          ? els.quiz
          : els.result;
    if (!panel) return;
    panel.setAttribute("tabindex", "-1");
    panel.focus({ preventScroll: false });
  }

  function track(name) {
    try {
      if (typeof window.ym === "function") {
        window.ym(112670594, "reachGoal", name);
      }
    } catch (e) {}
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
})();
