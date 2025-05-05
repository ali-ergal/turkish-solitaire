let soundEnabled = 0

function playSound(id) {
    if (!soundEnabled) return; // Ses kapalıysa hiçbir şey yapma

    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function playDropSound() {
    playSound("dropSound");
}

function playNewTurnSound() {
    playSound("newTurnSound");
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem("deckoSound", soundEnabled ? "1" : "0");
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.innerText = soundEnabled ? "🔊" : "🔇";
}

function initializeSoundToggle() {
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.innerText = soundEnabled ? "🔊" : "🔇";
}

document.addEventListener("DOMContentLoaded", () => {
    initializeSoundToggle();
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.addEventListener("click", toggleSound);
});