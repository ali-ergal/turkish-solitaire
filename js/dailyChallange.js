function seededShuffle(array, seed) {
    function xmur3(str) {
        for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
        return function () {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
    }

    function mulberry32(a) {
        return function () {
            var t = (a += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    let seedFn = xmur3(seed);
    let rand = mulberry32(seedFn());

    return array
        .map(a => [rand(), a])
        .sort((a, b) => a[0] - b[0])
        .map(a => a[1]);
}

function getTodaySeed() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

function hasPlayedDaily() {
    const today = getTodaySeed();
    return localStorage.getItem("dailyChallengeCompleted") === today;
}

function markDailyCompleted() {
    const today = getTodaySeed();
    localStorage.setItem("dailyChallengeCompleted", today);
    const btn = document.getElementById("dailyChallengeBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerText = t("dailyCompleted");
    }
}

function updateDailyButtonState() {
    const btn = document.getElementById("dailyChallengeBtn");
    if (!btn) return;
    if (hasPlayedDaily()) {
        btn.disabled = true;
        btn.style.opacity = 0.5;
        btn.innerText = t("dailyCompleted");
    } else {
        btn.disabled = false;
        btn.style.opacity = 1;
        btn.innerText = t("dailyChallenge");
    }
}

function startDailyChallenge() {
    if (hasPlayedDaily()) {
        alert(t("alreadyCompleted"));
        return;
    }

    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("settingsModal").style.display = "none";
    document.getElementById("deckArea").style.display = "flex";
    document.getElementById("undoWrapper").style.display = "flex";
    document.getElementById("jokerWrapper").style.display = "flex";
    document.getElementById("counters").style.display = "block";
    document.getElementById("gameArea").style.display = "flex";

    createDeck(true);
}

function createDeck(isDaily = false) {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";
    difficultyLevel = Number(document.getElementById("difficultySelect")?.value || 3);
    const baseDeck = suits.flatMap(suit => Array.from({ length: 13 }, (_, rank) => ({ suit, rank: rank + 1, faceUp: false })));
    deck = isDaily ? seededShuffle(baseDeck, getTodaySeed()) : shuffle(baseDeck);

    drawIndex = 0;
    drawnCards = [];
    table = Array.from({ length: 8 }, () => []);
    moveCount = score = 0;
    completedSuits = [];
    jokerUsed = false;
    document.getElementById("useJokerBtn").disabled = false;
    updateCounters();

    const toggle = document.getElementById("autoHintToggle");
    if (toggle) {
        autoHintEnabled = toggle.checked;
        localStorage.setItem("autoHint", autoHintEnabled ? "1" : "0");
    }

    updateUI();
    renderDeckStack();
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById("status").innerText = "";
}

window.addEventListener("DOMContentLoaded", updateDailyButtonState);