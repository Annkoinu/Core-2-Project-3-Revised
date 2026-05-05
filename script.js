const screens = Array.from(document.querySelectorAll("[data-screen]"));
const historyStack = ["lang"];
let currentScreen = "lang";
let translationTyped = "";
let savedSignVideos = JSON.parse(
  localStorage.getItem("crosssignSavedSignVideosV2") || "[]",
);

function normalizeDemoPhrase(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function isDemoPhraseReady() {
  return normalizeDemoPhrase(translationTyped) === "where is the bathroom";
}
function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}

function saveSavedSignVideos() {
  localStorage.setItem(
    "crosssignSavedSignVideosV2",
    JSON.stringify(savedSignVideos),
  );
}

function getCurrentSaveItem(button) {
  const assistCard = button.closest(".assist-card");
  if (assistCard) {
    const title =
      document.getElementById("assist-title")?.textContent.trim() ||
      "Saved sign";
    return {
      id: `assist-${title.toLowerCase()}`,
      title,
      subtitle: "ASL sign assist",
    };
  }

  const outputCard = button.closest(".output-card");
  if (outputCard) {
    const outputText =
      document.getElementById("translation-output")?.textContent.trim() || "";
    const label =
      document.getElementById("output-label")?.textContent.trim() ||
      "SIGN OUTPUT · ASL";
    const language = label.split("·").pop()?.trim() || "ASL";
    const title = outputText.includes("WHERE BATHROOM")
      ? "Where is the bathroom?"
      : "Saved sign output";
    return {
      id: `translator-${language}-${title.toLowerCase()}`,
      title,
      subtitle: `${language} sign video`,
    };
  }

  return {
    id: "saved-sign",
    title: "Saved sign video",
    subtitle: "ASL sign video",
  };
}

function renderSavedVideos() {
  const list = document.getElementById("saved-videos-list");
  if (!list) return;

  if (!savedSignVideos.length) {
    list.innerHTML = `
      <div class="profile-settings-row saved-empty-row">
        <div class="profile-row-left">
          <div class="profile-row-icon"><span class="material-symbols-rounded">bookmark</span></div>
          <div class="profile-row-text"><strong>No saved signs yet</strong></div>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = savedSignVideos
    .map(
      (item) => `
    <button class="profile-settings-row saved-video-row saved-video-button" type="button" data-assist="${escapeHTML(item.title)}">
      <div class="profile-row-left">
        <div class="profile-row-icon"><span class="material-symbols-rounded">bookmark</span></div>
        <div class="profile-row-text"><strong>${escapeHTML(item.title)}</strong></div>
      </div>
      <div class="profile-row-right"><span class="material-symbols-rounded profile-row-arrow">play_circle</span></div>
    </button>
  `,
    )
    .join("");
}

function syncSaveButtons() {
  document
    .querySelectorAll('[data-toggle-control="save"]')
    .forEach((button) => {
      const item = getCurrentSaveItem(button);
      const isSaved = savedSignVideos.some((saved) => saved.id === item.id);
      button.classList.toggle("is-selected", isSaved);
      button.setAttribute("aria-pressed", isSaved ? "true" : "false");
    });
}

function toggleSavedSign(button) {
  const item = getCurrentSaveItem(button);
  const existingIndex = savedSignVideos.findIndex(
    (saved) => saved.id === item.id,
  );
  if (existingIndex >= 0) {
    savedSignVideos.splice(existingIndex, 1);
  } else {
    savedSignVideos.unshift(item);
  }
  saveSavedSignVideos();
  renderSavedVideos();
  syncSaveButtons();
}

function closeAllDropdowns() {
  ["from", "to"].forEach(closeDropdown);
}

function showScreen(id, push = true) {
  const target = document.getElementById(id);
  if (!target) return;
  screens.forEach((screen) => {
    screen.hidden = screen.id !== id;
  });
  closeAllDropdowns();
  if (push && historyStack[historyStack.length - 1] !== id)
    historyStack.push(id);
  currentScreen = id;
  if (id === "profile") renderSavedVideos();
  syncSaveButtons();
}

function goBack() {
  if (historyStack.length > 1) {
    historyStack.pop();
    showScreen(historyStack[historyStack.length - 1], false);
  } else {
    showScreen("home");
  }
}

function setActiveChoice(groupSelector, button) {
  document.querySelectorAll(groupSelector).forEach((btn) => {
    btn.classList.remove("active");
    const check = btn.querySelector(".check");
    if (check) check.textContent = "";
  });
  button.classList.add("active");
  const check = button.querySelector(".check");
  if (check)
    check.innerHTML = '<span class="material-symbols-rounded">check</span>';
}

function openAssist(word) {
  const popover = document.getElementById("assist-popover");
  const safeWord = (word || "").trim();
  document.getElementById("assist-title").textContent =
    safeWord || "Nothing here yet";
  document.getElementById("assist-video").textContent = safeWord
    ? `ASL — ${safeWord.toUpperCase()}`
    : "No preview yet";
  popover.hidden = false;
  syncSaveButtons();
}

function closeAssist() {
  document.getElementById("assist-popover").hidden = true;
}

function getDropdownElements(target) {
  return {
    trigger: document.getElementById(`translate-${target}-trigger`),
    value: document.getElementById(`translate-${target}-value`),
    menu: document.getElementById(`translate-${target}-menu`),
    options: Array.from(
      document.querySelectorAll(`.dropdown-option[data-target="${target}"]`),
    ),
  };
}

function closeDropdown(target) {
  const { trigger, menu } = getDropdownElements(target);
  if (!trigger || !menu) return;
  trigger.classList.remove("is-open");
  trigger.setAttribute("aria-expanded", "false");
  menu.hidden = true;
}

function toggleDropdown(target) {
  const { trigger, menu } = getDropdownElements(target);
  if (!trigger || !menu) return;
  const shouldOpen = menu.hidden;
  closeAllDropdowns();
  if (shouldOpen) {
    trigger.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    menu.hidden = false;
  }
}

function translatorLanguageMeta(value) {
  const [code, mode] = value.split(" · ");
  const flagMap = {
    EN: "circleflags/America.png",
    ZH: "circleflags/China.png",
    JA: "circleflags/Japan.png",
    ES: "circleflags/Spain.png",
    ASL: "circleflags/America.png",
    CSL: "circleflags/China.png",
    JSL: "circleflags/Japan.png",
  };
  const labelMap = {
    EN: "English",
    ZH: "Chinese",
    JA: "Japanese",
    ES: "Spanish",
    ASL: "ASL",
    CSL: "CSL",
    JSL: "JSL",
  };
  return {
    code,
    mode,
    flag: flagMap[code] || flagMap.EN,
    label: labelMap[code] || code,
    modeIcon: mode === "Sign" ? "sign_language" : "text_fields",
  };
}

function translationLabelHTML(value, compact = false) {
  const meta = translatorLanguageMeta(value);
  return `
    <span class="lang-value-wrap${compact ? " compact" : ""}">
      <img class="lang-flag" src="${meta.flag}" alt="${meta.label} flag" />
      <span class="lang-name">${meta.label}</span>
      <span class="lang-mode-text">${meta.mode}</span>
      <span class="material-symbols-rounded lang-mode-icon">${meta.modeIcon}</span>
    </span>
  `;
}

function decorateTranslationDropdowns() {
  ["from", "to"].forEach((target) => {
    const { value, options } = getDropdownElements(target);
    const activeOption =
      options.find((option) => option.classList.contains("active")) ||
      options[0];
    options.forEach((option) => {
      const optionValue = option.dataset.value;
      const isActive = option.classList.contains("active");
      option.innerHTML = `<span class="checkmark material-symbols-rounded">check</span>${translationLabelHTML(optionValue)}`;
      option.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    if (value && activeOption) {
      setDropdownValue(target, activeOption.dataset.value);
    }
  });
}

function getTranslationValue(target) {
  const { value } = getDropdownElements(target);
  return value ? value.dataset.value || value.textContent.trim() : "";
}

function setDropdownValue(target, nextValue) {
  const { value, options } = getDropdownElements(target);
  if (!value) return;
  value.dataset.value = nextValue;
  value.innerHTML = translationLabelHTML(nextValue, true);
  options.forEach((option) => {
    const isActive = option.dataset.value === nextValue;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function languageShort(value) {
  return value.split(" · ")[0];
}

function isSignLanguage(value) {
  return value.includes("Sign");
}

function textInputHTML(fromShort) {
  const safeValue = translationTyped
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `
    <div class="input-card text-input-card demo-input-card">
      <small id="input-label" class="brand-sub">TEXT INPUT · ${fromShort}</small>
      <input id="translation-demo-input" class="translation-demo-input" type="text" value="${safeValue}" placeholder="Type in “Where is the bathroom”" autocomplete="off" />
    </div>
  `;
}

function signInputHTML(fromShort) {
  return `
    <div class="input-card sign-input-card">
      <small id="input-label" class="brand-sub">SIGN INPUT · ${fromShort}</small>
      <div class="sign-video translator-video input-sign-video">
        <button class="play-button camera-button" type="button" aria-label="Record or preview sign input"><span class="material-symbols-rounded play-triangle">radio_button_checked</span></button>
        <span class="translation-caption">${fromShort} — INPUT SIGN</span>
      </div>
      <div class="chip-row translator-actions"><span class="pill"><span class="material-symbols-rounded pill-icon">photo_camera</span><span>Camera</span></span><span class="pill"><span class="material-symbols-rounded pill-icon">replay</span><span>Retake</span></span><span class="pill"><span class="material-symbols-rounded pill-icon">upload</span><span>Upload</span></span></div>
    </div>
  `;
}

function textOutputHTML(toShort) {
  const ready = isDemoPhraseReady();
  return `
    <div class="text-output-card ${ready ? "is-ready" : "is-pending"}">
      <small id="output-label" class="brand-sub">TEXT OUTPUT · ${toShort}</small>
      <div class="translated-text" id="translation-output">${ready ? "Where is the bathroom?" : "Oops, no output yet ;-;"}</div>
      <div class="chip-row translator-actions"><span class="pill">Copy</span><span class="pill">Speak</span><span class="pill">Save</span></div>
    </div>
  `;
}

function signOutputHTML(toShort) {
  const ready = isDemoPhraseReady();
  return `
    <div class="output-card ${ready ? "is-ready" : "is-pending"}">
      <small id="output-label" class="brand-sub">SIGN OUTPUT · ${toShort}</small>
      <div class="sign-video translator-video">
        ${ready ? `<button class="play-button" type="button" aria-label="Play sign output"><span class="material-symbols-rounded play-triangle">play_arrow</span></button><span id="translation-output" class="translation-caption">${toShort} — WHERE BATHROOM</span>` : `<span id="translation-output" class="translation-pending">Oops, no output yet ;-;</span>`}
      </div>
      <div class="chip-row translator-actions"><button class="pill" type="button" data-toggle-control="slow"><span class="material-symbols-rounded pill-icon">slow_motion_video</span><span>Slow</span></button><button class="pill" type="button" data-toggle-control="loop"><span class="material-symbols-rounded pill-icon">repeat</span><span>Loop</span></button><button class="pill" type="button" data-toggle-control="save"><span class="material-symbols-rounded pill-icon">bookmark</span><span>Save</span></button></div>
    </div>
  `;
}

function updateTranslationLabels() {
  const fromValue = getTranslationValue("from");
  const toValue = getTranslationValue("to");
  if (!fromValue || !toValue) return;

  const fromShort = languageShort(fromValue);
  const toShort = languageShort(toValue);
  const fromIsSign = isSignLanguage(fromValue);
  const toIsSign = isSignLanguage(toValue);
  const inputArea = document.getElementById("translation-input-area");
  const outputArea = document.getElementById("translation-output-area");
  if (!inputArea || !outputArea) return;

  inputArea.innerHTML = fromIsSign
    ? signInputHTML(fromShort)
    : textInputHTML(fromShort);
  outputArea.innerHTML = toIsSign
    ? signOutputHTML(toShort)
    : textOutputHTML(toShort);
  syncSaveButtons();
}

document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) {
    showScreen(goButton.dataset.go);
    return;
  }

  if (event.target.closest("[data-back]")) {
    goBack();
    return;
  }

  const lang = event.target.closest("[data-lang]");
  if (lang) {
    setActiveChoice("[data-lang]", lang);
    return;
  }

  const comm = event.target.closest("[data-comm]");
  if (comm) {
    setActiveChoice("[data-comm]", comm);
    return;
  }

  const signSupport = event.target.closest("[data-signsupport]");
  if (signSupport) {
    setActiveChoice("[data-signsupport]", signSupport);
    return;
  }

  const learnByTrigger = event.target.closest(".learn-by-trigger");
  if (learnByTrigger) {
    const menu = document.querySelector(".learn-by-menu");
    const trigger = document.querySelector(".learn-by-trigger");
    if (menu && trigger) {
      const shouldOpen = menu.hidden;
      menu.hidden = !shouldOpen;
      trigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    }
    return;
  }

  const learnByOption = event.target.closest(".learn-by-option");
  if (learnByOption) {
    const trigger = document.querySelector(".learn-by-trigger");
    const menu = document.querySelector(".learn-by-menu");
    if (trigger) {
      trigger.querySelector("img").src = learnByOption.dataset.flag;
      trigger.querySelector("img").alt = `${learnByOption.dataset.by} flag`;
      const label = trigger.querySelector(".learn-language-label");
      const modeIcon = trigger.querySelector(".learn-mode-icon");
      if (label) label.textContent = learnByOption.dataset.by;
      if (modeIcon)
        modeIcon.textContent = learnByOption.dataset.icon || "text_fields";
    }
    document
      .querySelectorAll(".learn-by-option")
      .forEach((option) =>
        option.classList.toggle("active", option === learnByOption),
      );
    if (menu) menu.hidden = true;
    return;
  }

  const helperFilter = event.target.closest("[data-helper-filter]");
  if (helperFilter) {
    helperFilter.classList.toggle("is-selected");
    const checkIcon = helperFilter.querySelector(".helper-filter-check");
    if (checkIcon)
      checkIcon.textContent = helperFilter.classList.contains("is-selected")
        ? "check_box"
        : "check_box_outline_blank";
    const selectedFilters = Array.from(
      document.querySelectorAll("[data-helper-filter].is-selected"),
    ).map((btn) => btn.dataset.helperFilter);
    document.querySelectorAll(".helper-row").forEach((row) => {
      const languages = (row.dataset.helperLanguages || "").split(" ");
      const shouldShow =
        selectedFilters.length === 0 ||
        selectedFilters.every((filter) => languages.includes(filter));
      row.classList.toggle("is-hidden", !shouldShow);
    });
    const helperEmptyRow = document.querySelector(".helper-empty-row");
    if (helperEmptyRow) {
      const hasVisibleHelper = Array.from(document.querySelectorAll(".helper-row")).some(
        (row) => !row.classList.contains("is-hidden"),
      );
      helperEmptyRow.hidden = hasVisibleHelper;
    }
    return;
  }

  const dropdownTrigger = event.target.closest(".dropdown-trigger");
  if (dropdownTrigger) {
    const wrapper = dropdownTrigger.closest(".custom-dropdown");
    if (wrapper) toggleDropdown(wrapper.dataset.dropdown);
    return;
  }

  const dropdownOption = event.target.closest(".dropdown-option");
  if (dropdownOption) {
    setDropdownValue(
      dropdownOption.dataset.target,
      dropdownOption.dataset.value,
    );
    closeDropdown(dropdownOption.dataset.target);
    decorateTranslationDropdowns();
    updateTranslationLabels();
    renderSavedVideos();
    syncSaveButtons();
    return;
  }

  const swap = event.target.closest("#swap-languages");
  if (swap) {
    const oldFrom = getTranslationValue("from");
    const oldTo = getTranslationValue("to");
    setDropdownValue("from", oldTo);
    setDropdownValue("to", oldFrom);
    updateTranslationLabels();
    closeAllDropdowns();
    return;
  }

  const toggleControl = event.target.closest("[data-toggle-control]");
  if (toggleControl) {
    if (toggleControl.dataset.toggleControl === "save") {
      toggleSavedSign(toggleControl);
    } else {
      toggleControl.classList.toggle("is-selected");
      toggleControl.setAttribute(
        "aria-pressed",
        toggleControl.classList.contains("is-selected") ? "true" : "false",
      );
    }
    return;
  }

  const assist = event.target.closest("[data-assist]");
  if (assist) {
    openAssist(assist.dataset.assist);
    return;
  }

  if (
    event.target.closest(".assist-close") ||
    event.target.id === "assist-popover"
  ) {
    closeAssist();
    return;
  }

  if (!event.target.closest(".custom-dropdown")) {
    closeAllDropdowns();
  }
});

document.addEventListener("input", (event) => {
  if (!event.target.matches("#translation-demo-input")) return;
  translationTyped = event.target.value;
  updateTranslationLabels();
  const input = document.getElementById("translation-demo-input");
  if (input) {
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAssist();
    closeAllDropdowns();
  }
});

decorateTranslationDropdowns();
updateTranslationLabels();

document.addEventListener("click", (event) => {
  const learnTrigger = event.target.closest(".learn-sign-trigger");
  const learnMenu = document.querySelector(".learn-sign-menu");
  if (learnTrigger && learnMenu) {
    const willOpen = learnMenu.hidden;
    learnMenu.hidden = !willOpen;
    learnTrigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    return;
  }

  const learnOption = event.target.closest(".learn-sign-option");
  if (learnOption) {
    const trigger = document.querySelector(".learn-sign-trigger");
    const menu = document.querySelector(".learn-sign-menu");
    if (trigger) {
      const img = trigger.querySelector("img");
      const text = trigger.querySelector(".learn-language-label");
      if (img) {
        img.src = learnOption.dataset.flag;
        img.alt = `${learnOption.dataset.sign} flag`;
      }
      if (text) text.textContent = learnOption.dataset.sign;
      trigger.setAttribute("aria-expanded", "false");
    }
    document
      .querySelectorAll(".learn-sign-option")
      .forEach((option) =>
        option.classList.toggle("active", option === learnOption),
      );
    if (menu) menu.hidden = true;
    return;
  }

  if (!event.target.closest("[data-learn-sign-dropdown]")) {
    const menu = document.querySelector(".learn-sign-menu");
    const trigger = document.querySelector(".learn-sign-trigger");
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }
  if (!event.target.closest("[data-learn-by-dropdown]")) {
    const menu = document.querySelector(".learn-by-menu");
    const trigger = document.querySelector(".learn-by-trigger");
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }
});
