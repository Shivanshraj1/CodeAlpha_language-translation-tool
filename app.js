const sourceLanguage = document.querySelector("#sourceLanguage");
const targetLanguage = document.querySelector("#targetLanguage");
const inputText = document.querySelector("#inputText");
const outputText = document.querySelector("#outputText");
const translateButton = document.querySelector("#translateButton");
const sampleButton = document.querySelector("#sampleButton");
const copyButton = document.querySelector("#copyButton");
const speakButton = document.querySelector("#speakButton");
const swapButton = document.querySelector("#swapButton");
const statusMessage = document.querySelector("#statusMessage");
const statusTextEl = document.querySelector(".status-text");
const charCountEl = document.querySelector("#charCount");
const themeBtns = document.querySelectorAll("[data-theme-btn]");

const MAX_CHARS = 500;
const myMemoryApiUrl = "https://api.mymemory.translated.net/get";
const googlePublicApiUrl = "https://translate.googleapis.com/translate_a/single";
const sampleText = "Artificial Intelligence helps people communicate across different languages.";

const speechLanguageMap = {
  ar: "ar-SA",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  hi: "hi-IN",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  pt: "pt-PT",
  ru: "ru-RU",
};

const speechLanguageAliases = {
  hi: ["hi-IN", "hi"],
};

let autoTranslateTimer;
let translationRequestId = 0;

function closeLanguagePickers(exceptPicker) {
  document.querySelectorAll(".language-picker.open").forEach((picker) => {
    if (picker !== exceptPicker) {
      picker.classList.remove("open");
      picker.querySelector(".language-select-button")?.setAttribute("aria-expanded", "false");
    }
  });
}

function syncLanguagePicker(select) {
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function setupLanguagePicker(select) {
  const field = select.parentElement;
  field.classList.add("language-field");
  select.classList.add("native-select");

  const picker = document.createElement("div");
  picker.className = "language-picker";

  const button = document.createElement("button");
  button.className = "language-select-button";
  button.type = "button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "language-menu";
  menu.setAttribute("role", "listbox");

  function updateButtonText() {
    button.textContent = select.options[select.selectedIndex]?.textContent || "Select language";
  }

  Array.from(select.options).forEach((option) => {
    const item = document.createElement("button");
    item.className = "language-option";
    item.type = "button";
    item.textContent = option.textContent;
    item.dataset.value = option.value;
    item.setAttribute("role", "option");

    item.addEventListener("click", () => {
      select.value = option.value;
      updateButtonText();

      menu.querySelectorAll(".language-option").forEach((current) => {
        const isActive = current.dataset.value === select.value;
        current.classList.toggle("active", isActive);
        current.setAttribute("aria-selected", String(isActive));
      });

      picker.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    menu.appendChild(item);
  });

  button.addEventListener("click", () => {
    const shouldOpen = !picker.classList.contains("open");
    closeLanguagePickers(picker);
    picker.classList.toggle("open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
  });

  picker.append(button, menu);
  select.insertAdjacentElement("afterend", picker);
  updateButtonText();

  select.addEventListener("change", () => {
    updateButtonText();
    menu.querySelectorAll(".language-option").forEach((current) => {
      const isActive = current.dataset.value === select.value;
      current.classList.toggle("active", isActive);
      current.setAttribute("aria-selected", String(isActive));
    });
  });

  select.dispatchEvent(new Event("change"));
}

setupLanguagePicker(sourceLanguage);
setupLanguagePicker(targetLanguage);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".language-picker")) {
    closeLanguagePickers();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLanguagePickers();
  }
});

window.addEventListener("scroll", () => closeLanguagePickers(), { passive: true });
inputText.addEventListener("focus", () => closeLanguagePickers());
outputText.addEventListener("focus", () => closeLanguagePickers());

function applyTheme(theme) {
  const resolvedTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.dataset.themePref = theme;

  themeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.themeBtn === theme);
  });

  localStorage.setItem("theme", theme);
}

applyTheme(localStorage.getItem("theme") || "system");

themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.themeBtn));
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if ((localStorage.getItem("theme") || "system") === "system") {
    applyTheme("system");
  }
});

function setStatus(message, isError = false) {
  statusTextEl.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function updateCharCount() {
  const length = inputText.value.length;
  charCountEl.textContent = `${length} / ${MAX_CHARS}`;
  charCountEl.classList.toggle("warn", length > MAX_CHARS * 0.88);
}

function scheduleAutoTranslate() {
  closeLanguagePickers();
  clearTimeout(autoTranslateTimer);
  updateCharCount();

  if (!inputText.value.trim()) {
    outputText.value = "";
    setStatus("");
    return;
  }

  autoTranslateTimer = setTimeout(() => {
    translateText(true);
  }, 800);
}

inputText.addEventListener("input", scheduleAutoTranslate);
updateCharCount();

function getLanguagePair() {
  const source = sourceLanguage.value === "auto" ? "en" : sourceLanguage.value;
  return `${source}|${targetLanguage.value}`;
}

function decodeHtmlEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

async function translateWithGooglePublic(text) {
  const url = new URL(googlePublicApiUrl);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", sourceLanguage.value === "auto" ? "auto" : sourceLanguage.value);
  url.searchParams.set("tl", targetLanguage.value);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Google public API failed.");
  }

  const data = await response.json();
  const translated = data?.[0]?.map((item) => item?.[0] || "").join("").trim();

  if (!translated) {
    throw new Error("No text returned from Google.");
  }

  return translated;
}

async function translateWithMyMemory(text) {
  const url = new URL(myMemoryApiUrl);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", getLanguagePair());

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("MyMemory API failed.");
  }

  const data = await response.json();
  const translated = data?.responseData?.translatedText;

  if (!translated) {
    throw new Error("MyMemory returned no translation.");
  }

  return decodeHtmlEntities(translated).trim();
}

async function getBestTranslation(text) {
  const source = sourceLanguage.value;
  const target = targetLanguage.value;
  const preferGoogle = target === "hi" && (source === "en" || source === "auto");

  if (preferGoogle) {
    try {
      return {
        text: await translateWithGooglePublic(text),
        provider: "Hindi translation provider",
      };
    } catch {
      return {
        text: await translateWithMyMemory(text),
        provider: "fallback translation API",
      };
    }
  }

  return {
    text: await translateWithMyMemory(text),
    provider: "translation API",
  };
}

async function translateText(isAutomatic = false) {
  closeLanguagePickers();

  if (!isAutomatic) {
    clearTimeout(autoTranslateTimer);
  }

  const requestId = ++translationRequestId;
  const text = inputText.value.trim();

  if (!text) {
    outputText.value = "";
    setStatus(isAutomatic ? "" : "Please enter some text first.", !isAutomatic);

    if (!isAutomatic) {
      inputText.focus();
    }

    return;
  }

  if (text.length > MAX_CHARS) {
    setStatus(`Text is too long. Keep it under ${MAX_CHARS} characters.`, true);
    return;
  }

  translateButton.disabled = true;
  translateButton.classList.add("loading");
  setStatus(isAutomatic ? "Auto translating..." : "Translating...");
  outputText.value = "";

  try {
    const result = await getBestTranslation(text);

    if (requestId !== translationRequestId || text !== inputText.value.trim()) {
      return;
    }

    outputText.value = result.text;
    setStatus(`Translated using ${result.provider}.`);
  } catch {
    if (requestId !== translationRequestId) {
      return;
    }

    setStatus("Translation failed. Check your internet connection and try again.", true);
  } finally {
    if (requestId === translationRequestId) {
      translateButton.disabled = false;
      translateButton.classList.remove("loading");
    }
  }
}

const COPY_ICON_HTML = `
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
  Copy`;

async function copyTranslation() {
  closeLanguagePickers();

  const text = outputText.value.trim();

  if (!text) {
    setStatus("Nothing to copy yet.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard.");
    copyButton.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
      Copied`;
    copyButton.disabled = true;

    setTimeout(() => {
      copyButton.innerHTML = COPY_ICON_HTML;
      copyButton.disabled = false;
    }, 1600);
  } catch {
    setStatus("Could not copy. Select the text and copy manually.", true);
  }
}

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    return Promise.resolve(voices);
  }

  return new Promise((resolve) => {
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 900);
  });
}

function findVoiceForLanguage(voices, language) {
  const code = speechLanguageMap[language] || language;
  const codes = (speechLanguageAliases[language] || [code, language]).map((item) => item.toLowerCase());

  return voices.find((voice) => codes.includes(voice.lang.toLowerCase()))
    || voices.find((voice) => codes.some((item) => voice.lang.toLowerCase().startsWith(item)))
    || voices.find((voice) => voice.lang.toLowerCase().startsWith(language));
}

let isSpeaking = false;

async function speakTranslation() {
  closeLanguagePickers();

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speakButton.classList.remove("speaking");
    setStatus("Speech stopped.");
    return;
  }

  const text = outputText.value.trim();

  if (!text) {
    setStatus("Nothing to speak yet.", true);
    return;
  }

  const langCode = speechLanguageMap[targetLanguage.value] || targetLanguage.value;
  const voices = await loadVoices();
  const matchVoice = findVoiceForLanguage(voices, targetLanguage.value);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  if (matchVoice) {
    utterance.voice = matchVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
    speakButton.classList.add("speaking");
  };

  utterance.onend = utterance.onerror = () => {
    isSpeaking = false;
    speakButton.classList.remove("speaking");
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  if (targetLanguage.value === "hi" && !matchVoice) {
    setStatus("Hindi text is ready, but no Hindi voice was found in this browser.", true);
    return;
  }

  setStatus(matchVoice
    ? `Playing in ${matchVoice.lang}. Click Speak again to stop.`
    : `Playing text. A ${langCode} voice may not be installed.`);
}

function swapLanguages() {
  closeLanguagePickers();

  const nextSource = targetLanguage.value;
  const nextTarget = sourceLanguage.value === "auto" ? "en" : sourceLanguage.value;

  sourceLanguage.value = nextSource;
  targetLanguage.value = nextTarget;
  [inputText.value, outputText.value] = [outputText.value, inputText.value];
  syncLanguagePicker(sourceLanguage);
  syncLanguagePicker(targetLanguage);
  updateCharCount();
  setStatus("Languages swapped.");
  scheduleAutoTranslate();
}

function addSampleText() {
  closeLanguagePickers();

  sourceLanguage.value = "en";
  targetLanguage.value = "hi";
  inputText.value = sampleText;
  outputText.value = "";
  syncLanguagePicker(sourceLanguage);
  syncLanguagePicker(targetLanguage);
  setStatus("Sample loaded. Translating automatically.");
  scheduleAutoTranslate();
}

translateButton.addEventListener("click", translateText);
sampleButton.addEventListener("click", addSampleText);
copyButton.addEventListener("click", copyTranslation);
speakButton.addEventListener("click", speakTranslation);
swapButton.addEventListener("click", swapLanguages);
sourceLanguage.addEventListener("change", scheduleAutoTranslate);
targetLanguage.addEventListener("change", scheduleAutoTranslate);

inputText.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    translateText();
  }
});
