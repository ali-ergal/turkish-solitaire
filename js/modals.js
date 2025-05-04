function openHelp() {
    const modal = document.getElementById("helpModal");
    const helpContent = modal.querySelector(".help-content");
    const helpTitle = modal.querySelector("h2");
    const helpButton = modal.querySelector("button");

    const helpTexts = {
        tr: `
        <p>🃏 8 Serili oyunda amaç, tüm kartları 8 farklı seriye doğru şekilde dizmektir.</p>
        <ul style="text-align: left; padding-left: 20px;">
          <li>4 seri küçükten büyüğe (As ➡️ Papaz)</li>
          <li>4 seri büyükten küçüğe (Papaz ➡️ As)</li>
          <li>Aynı seri içinde sadece aynı tür (örneğin sadece ♥) kartlar yerleştirilebilir.</li>
          <li>Her çekimde 1, 2 veya 3 kart çekebilirsin (zorluk seçimine göre).</li>
          <li>Doğru seriye kart koyarsan puan kazanırsın.</li>
          <li>Her kart yerleştirmede 10 puan, seri tamamladığında ekstra 100 puan kazanırsın.</li>
          <li>Bir turda hiç kart yerleştiremezsen yeni deste açılır.</li>
          <li>Bir kere joker hakkın var! Çıkmayan kartı sona atabilirsin.</li>
          <li>En yüksek skoru ve en kısa sürede bitirmeye çalış!</li>
        </ul>
      `,
        en: `
        <p>🃏 The goal is to place all cards into 8 correct series.</p>
        <ul style="text-align: left; padding-left: 20px;">
          <li>4 series go ascending (Ace ➡️ King)</li>
          <li>4 series go descending (King ➡️ Ace)</li>
          <li>Only same-suit cards can be placed in a series.</li>
          <li>Each draw gives 1, 2, or 3 cards based on difficulty.</li>
          <li>Placing a card earns you points.</li>
          <li>+10 points per card placed, +100 for completing a series.</li>
          <li>If you can’t place any cards in a turn, a new draw starts.</li>
          <li>You can use one Joker to move a stuck card to the end.</li>
          <li>Try to score the most points in the shortest time!</li>
        </ul>
      `
    };

    const helpTitles = {
        tr: "❓ Oyun Kuralları",
        en: "❓ Game Rules"
    };

    const helpButtons = {
        tr: "✅ Anladım",
        en: "✅ Got it"
    };

    helpTitle.innerText = helpTitles[currentLanguage] || helpTitles.tr;
    helpContent.innerHTML = helpTexts[currentLanguage] || helpTexts.tr;
    helpButton.innerText = helpButtons[currentLanguage] || helpButtons.tr;

    modal.style.display = "flex";
}

function closeHelp() {
    document.getElementById("helpModal").style.display = "none";
}

function openSettingsModal() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("settingsModal").style.display = "flex";
}

function backToMainMenu() {
    document.getElementById("mainMenu").style.display = "flex";
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("undoWrapper").style.display = "none";
    document.getElementById("jokerWrapper").style.display = "none";
    document.getElementById("counters").style.display = "none";
    document.getElementById("settingsModal").style.display = "none";
}

function startGameFromModal() {
    document.getElementById("deckArea").style.display = "flex";
    document.getElementById("undoWrapper").style.display = "flex";
    document.getElementById("jokerWrapper").style.display = "flex";
    document.getElementById("counters").style.display = "block";
    document.getElementById("gameArea").style.display = "flex";
    const modal = document.getElementById("settingsModal");
    if (modal) modal.style.display = "none";
    createDeck();
}

function openSettingsFromWin() {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";

    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.style.display = "flex";
}

function openSettingsFromLoss() {
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.style.display = "flex";
}

document.getElementById("homeBtn").addEventListener("click", backToMainMenu);

document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
});