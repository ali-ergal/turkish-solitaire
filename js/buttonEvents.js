document.getElementById("deck").addEventListener("click", drawThree);
document.getElementById("undoBtn").addEventListener("click", undoDraw);
document.getElementById("useJokerBtn").addEventListener("click", useJoker);

document.getElementById("showScoreHistoryBtn").addEventListener("click", showScoreHistory);

document.getElementById("homeBtn").addEventListener("click", backToMainMenu);
document.getElementById("openHelpBtn").addEventListener("click", openHelp);
document.getElementById("openNewGameBtn").addEventListener("click", openSettingsModal);
document.getElementById("newGameBtn").addEventListener("click", startGameFromModal);
document.getElementById("tryAgainBtn").addEventListener("click", openSettingsFromWin);

document.getElementById("closeScoreHistoryBtn").addEventListener("click", closeScoreHistory);
document.getElementById("closeHelpSpn").addEventListener("click", closeHelp);
document.getElementById("closeHelpBtn").addEventListener("click", closeHelp);

document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
});

document.getElementById("dailyChallengeBtn").addEventListener("click", startDailyChallenge);