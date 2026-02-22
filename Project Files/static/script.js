/**
 * AI-Powered Multi-Language Translator
 * Premium Interactive JavaScript
 * — Canvas background, typewriter effect, history, dark/light mode
 */

// ═══════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════
const $ = (sel) => document.querySelector(sel);
const sourceText    = $("#sourceText");
const targetText    = $("#targetText");
const sourceLang    = $("#sourceLang");
const targetLang    = $("#targetLang");
const translateBtn  = $("#translateBtn");
const swapBtn       = $("#swapBtn");
const clearBtn      = $("#clearBtn");
const copySourceBtn = $("#copySourceBtn");
const copyTargetBtn = $("#copyTargetBtn");
const detectBtn     = $("#detectBtn");
const alternativesBtn   = $("#alternativesBtn");
const alternativesCard  = $("#alternativesCard");
const alternativesContent = $("#alternativesContent");
const contextSelect = $("#contextSelect");
const charCount     = $("#charCount");
const charRing      = $("#charRing");
const loadingIndicator = $("#loadingIndicator");
const toast         = $("#toast");
const toastMsg      = $("#toastMsg");
const themeToggle   = $("#themeToggle");
const themeIcon     = $("#themeIcon");
const historyBtn    = $("#historyBtn");
const historyDrawer = $("#historyDrawer");
const drawerOverlay = $("#drawerOverlay");
const drawerCloseBtn = $("#drawerCloseBtn");
const historyList   = $("#historyList");
const historyBadge  = $("#historyBadge");
const clearHistoryBtn = $("#clearHistoryBtn");
const bgCanvas      = $("#bgCanvas");

// ═══════════════════════════════════════════
// Animated Canvas Background
// ═══════════════════════════════════════════
const ctx = bgCanvas.getContext("2d");
let orbs = [];
let animFrameId;

function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}

function createOrbs() {
    const count = Math.min(Math.floor(window.innerWidth / 120), 8);
    orbs = [];
    for (let i = 0; i < count; i++) {
        const isDark = document.documentElement.dataset.theme === "dark";
        orbs.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            radius: 80 + Math.random() * 200,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            hue: 250 + Math.random() * 60,        // purple → teal range
            alpha: isDark ? 0.06 + Math.random() * 0.06 : 0.04 + Math.random() * 0.04,
        });
    }
}

function drawOrbs() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (const orb of orbs) {
        orb.x += orb.dx;
        orb.y += orb.dy;
        if (orb.x < -orb.radius) orb.x = bgCanvas.width + orb.radius;
        if (orb.x > bgCanvas.width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = bgCanvas.height + orb.radius;
        if (orb.y > bgCanvas.height + orb.radius) orb.y = -orb.radius;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, `hsla(${orb.hue}, 70%, 60%, ${orb.alpha})`);
        gradient.addColorStop(1, `hsla(${orb.hue}, 70%, 60%, 0)`);
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    animFrameId = requestAnimationFrame(drawOrbs);
}

window.addEventListener("resize", () => {
    resizeCanvas();
    createOrbs();
});

resizeCanvas();
createOrbs();
drawOrbs();

// ═══════════════════════════════════════════
// Theme Toggle
// ═══════════════════════════════════════════
function loadTheme() {
    const saved = localStorage.getItem("translator-theme") || "dark";
    document.documentElement.dataset.theme = saved;
    themeIcon.className = saved === "dark" ? "fas fa-moon" : "fas fa-sun";
}

function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("translator-theme", next);
    themeIcon.className = next === "dark" ? "fas fa-moon" : "fas fa-sun";
    createOrbs(); // re-create with correct alpha
}

loadTheme();
themeToggle.addEventListener("click", toggleTheme);

// ═══════════════════════════════════════════
// Translation
// ═══════════════════════════════════════════
let isTranslating = false;

async function translateText() {
    const text = sourceText.value.trim();
    if (!text) {
        showToast("Please enter text to translate.", "warning");
        return;
    }
    if (isTranslating) return;
    isTranslating = true;

    setLoading(true);
    translateBtn.disabled = true;

    try {
        const response = await fetch("/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                source_lang: sourceLang.value,
                target_lang: targetLang.value,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            typewriterEffect(data.translated_text);
            showToast("Translation complete!", "success");
            saveToHistory(text, data.translated_text, sourceLang.value, targetLang.value);
        } else {
            targetText.innerHTML = `<p style="color:var(--accent-3);">${data.error}</p>`;
            showToast("Translation failed.", "error");
        }
    } catch (error) {
        targetText.innerHTML = `<p style="color:var(--accent-3);">Network error. Please try again.</p>`;
        showToast("Network error.", "error");
    } finally {
        setLoading(false);
        translateBtn.disabled = false;
        isTranslating = false;
    }
}

// ═══════════════════════════════════════════
// Typewriter Effect
// ═══════════════════════════════════════════
let typewriterInterval;

function typewriterEffect(text) {
    clearInterval(typewriterInterval);
    targetText.innerHTML = "";
    const cursor = document.createElement("span");
    cursor.className = "typewriter-cursor";

    let i = 0;
    const speed = Math.max(8, Math.min(30, 1200 / text.length)); // adaptive speed

    typewriterInterval = setInterval(() => {
        if (i < text.length) {
            // Add character
            const char = text[i];
            if (char === "\n") {
                targetText.appendChild(document.createElement("br"));
            } else {
                targetText.appendChild(document.createTextNode(char));
            }
            // Append cursor at the end
            if (cursor.parentNode) cursor.remove();
            targetText.appendChild(cursor);
            i++;
        } else {
            clearInterval(typewriterInterval);
            setTimeout(() => cursor.remove(), 1500);
        }
    }, speed);
}

// ═══════════════════════════════════════════
// Language Detection
// ═══════════════════════════════════════════
async function detectLanguage() {
    const text = sourceText.value.trim();
    if (!text) {
        showToast("Enter text first to detect language.", "warning");
        return;
    }

    detectBtn.disabled = true;
    try {
        const response = await fetch("/detect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.language_code !== "unknown") {
                sourceLang.value = data.language_code;
            }
            showToast(`Detected: ${data.detected_language}`, "success");
        } else {
            showToast("Detection failed.", "error");
        }
    } catch (error) {
        showToast("Network error.", "error");
    } finally {
        detectBtn.disabled = false;
    }
}

// ═══════════════════════════════════════════
// Alternatives
// ═══════════════════════════════════════════
async function getAlternatives() {
    const text = sourceText.value.trim();
    if (!text) {
        showToast("Enter text first.", "warning");
        return;
    }

    alternativesCard.style.display = "block";
    alternativesContent.innerHTML =
        '<div class="loading-indicator active"><div class="typing-dots"><span></span><span></span><span></span></div><span>Generating alternatives...</span></div>';

    try {
        const response = await fetch("/improve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                target_lang: targetLang.value,
                context: contextSelect.value,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alternativesContent.textContent = data.alternatives;
        } else {
            alternativesContent.innerHTML = `<p style="color:var(--accent-3);">${data.error}</p>`;
        }
    } catch (error) {
        alternativesContent.innerHTML = `<p style="color:var(--accent-3);">Network error.</p>`;
    }
}

// ═══════════════════════════════════════════
// Swap Languages
// ═══════════════════════════════════════════
function swapLanguages() {
    if (sourceLang.value === "auto") {
        showToast("Cannot swap when source is Auto Detect.", "warning");
        return;
    }

    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;

    // Swap text if translation exists
    const translated = targetText.textContent;
    if (translated && translated !== "Translation will appear here...") {
        targetText.textContent = sourceText.value;
        sourceText.value = translated;
        updateCharCount();
    }

    showToast("Languages swapped!", "success");
}

// ═══════════════════════════════════════════
// Clipboard
// ═══════════════════════════════════════════
async function copyToClipboard(text, label) {
    if (!text || text.includes("Translation will appear here")) {
        showToast("Nothing to copy.", "warning");
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied!`, "success");
    } catch {
        showToast("Copy failed.", "error");
    }
}

// ═══════════════════════════════════════════
// Clear
// ═══════════════════════════════════════════
function clearAll() {
    sourceText.value = "";
    clearInterval(typewriterInterval);
    targetText.innerHTML = '<p class="placeholder-text"><i class="fas fa-sparkles"></i> Translation will appear here...</p>';
    alternativesCard.style.display = "none";
    alternativesContent.innerHTML = "";
    updateCharCount();
    showToast("Cleared.", "success");
}

// ═══════════════════════════════════════════
// Character Counter with Ring
// ═══════════════════════════════════════════
function updateCharCount() {
    const len = sourceText.value.length;
    const pct = (len / 5000) * 100;
    charCount.textContent = `${len.toLocaleString()} / 5,000`;

    // Update ring
    const offset = 100 - pct;
    charRing.style.strokeDashoffset = offset;
    charRing.classList.remove("warning", "danger");
    if (pct > 90) {
        charRing.classList.add("danger");
    } else if (pct > 70) {
        charRing.classList.add("warning");
    }
}

// ═══════════════════════════════════════════
// Loading State
// ═══════════════════════════════════════════
function setLoading(loading) {
    if (loading) {
        loadingIndicator.classList.add("active");
        targetText.innerHTML = "";
    } else {
        loadingIndicator.classList.remove("active");
    }
}

// ═══════════════════════════════════════════
// Toast Notification
// ═══════════════════════════════════════════
let toastTimeout;
function showToast(message, type = "info") {
    const iconEl = toast.querySelector(".toast-icon");
    const icons = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info",
    };
    iconEl.className = `fas ${icons[type] || icons.info} toast-icon`;

    // Color the icon
    const colors = {
        success: "var(--accent-2)",
        error: "var(--accent-3)",
        warning: "#fdcb6e",
        info: "var(--accent-1)",
    };
    iconEl.style.color = colors[type] || colors.info;

    toastMsg.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ═══════════════════════════════════════════
// Translation History (localStorage)
// ═══════════════════════════════════════════
const HISTORY_KEY = "translator-history";
const MAX_HISTORY = 30;

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

function saveToHistory(source, translated, srcLang, tgtLang) {
    const history = getHistory();
    history.unshift({
        source: source.substring(0, 200),
        translated: translated.substring(0, 200),
        srcLang,
        tgtLang,
        time: Date.now(),
    });
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    updateHistoryBadge();
}

function renderHistory() {
    const history = getHistory();
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history"><i class="fas fa-inbox"></i><p>No translations yet</p></div>';
        return;
    }

    historyList.innerHTML = history
        .map((item, idx) => {
            const srcName = sourceLang.querySelector(`option[value="${item.srcLang}"]`)?.textContent || item.srcLang;
            const tgtName = targetLang.querySelector(`option[value="${item.tgtLang}"]`)?.textContent || item.tgtLang;
            const timeAgo = formatTimeAgo(item.time);
            return `
                <div class="history-item" data-idx="${idx}">
                    <div class="history-item-langs">${srcName} → ${tgtName}</div>
                    <div class="history-item-source">${escapeHtml(item.source)}</div>
                    <div class="history-item-target">${escapeHtml(item.translated)}</div>
                    <div class="history-item-time">${timeAgo}</div>
                </div>`;
        })
        .join("");

    // Click to restore
    historyList.querySelectorAll(".history-item").forEach((el) => {
        el.addEventListener("click", () => {
            const idx = parseInt(el.dataset.idx);
            const item = history[idx];
            if (item) {
                sourceText.value = item.source;
                if (item.srcLang !== "auto") sourceLang.value = item.srcLang;
                targetLang.value = item.tgtLang;
                targetText.textContent = item.translated;
                updateCharCount();
                closeDrawer();
                showToast("Restored from history.", "info");
            }
        });
    });
}

function updateHistoryBadge() {
    const count = getHistory().length;
    if (count > 0) {
        historyBadge.style.display = "flex";
        historyBadge.textContent = count;
    } else {
        historyBadge.style.display = "none";
    }
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    updateHistoryBadge();
    showToast("History cleared.", "success");
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Drawer open/close
function openDrawer() {
    renderHistory();
    historyDrawer.classList.add("open");
    drawerOverlay.classList.add("open");
}

function closeDrawer() {
    historyDrawer.classList.remove("open");
    drawerOverlay.classList.remove("open");
}

historyBtn.addEventListener("click", openDrawer);
drawerCloseBtn.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
clearHistoryBtn.addEventListener("click", clearHistory);

// Initial badge update
updateHistoryBadge();

// ═══════════════════════════════════════════
// Auto-translate with Debounce
// ═══════════════════════════════════════════
let debounceTimer;
function debounceTranslate() {
    clearTimeout(debounceTimer);
    const text = sourceText.value.trim();
    if (text.length >= 3) {
        debounceTimer = setTimeout(() => {
            translateText();
        }, 800);
    }
}

// ═══════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════
translateBtn.addEventListener("click", translateText);
swapBtn.addEventListener("click", swapLanguages);
clearBtn.addEventListener("click", clearAll);
detectBtn.addEventListener("click", detectLanguage);
alternativesBtn.addEventListener("click", getAlternatives);

copySourceBtn.addEventListener("click", () =>
    copyToClipboard(sourceText.value, "Source text")
);
copyTargetBtn.addEventListener("click", () =>
    copyToClipboard(targetText.textContent, "Translation")
);

sourceText.addEventListener("input", () => {
    updateCharCount();
    debounceTranslate();
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    // Ctrl+Enter — translate
    if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        clearTimeout(debounceTimer);
        translateText();
    }
    // Escape — clear
    if (e.key === "Escape") {
        if (historyDrawer.classList.contains("open")) {
            closeDrawer();
        } else {
            clearAll();
        }
    }
    // Alt+S — swap
    if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        swapLanguages();
    }
});

// Context change re-fetches alternatives
contextSelect.addEventListener("change", () => {
    if (alternativesCard.style.display !== "none" && sourceText.value.trim()) {
        getAlternatives();
    }
});
