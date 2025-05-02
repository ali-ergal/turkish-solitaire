const translations = {
    tr: {
      newGame: "🎮 Yeni Oyun",
      dailyChallenge: "🗓 Günlük Görev",
      dailyCompleted: "✅ Günlük Görev Tamamlandı",
      scoreHistory: "📊 Skor Geçmişi",
      help: "❓ Yardım",
      alreadyCompleted: "✅ Bugünün görevi zaten tamamlandı!",
      settingsTitle: "🎮 Yeni Oyun Ayarları",
      difficultyEasy: "🟢 Kolay (1 kart)",
      difficultyMedium: "🟡 Orta (2 kart)",
      difficultyHard: "🔴 Zor (3 kart)",
      autoHint: "💡 Otomatik İpucu",
      start: "✅ Başla",
      winTitle: "🏆 Tebrikler!",
      playAgain: "🔁 Tekrar Oyna",
      historyTitle: "📊 Skor Geçmişi",
      helpTitle: "❓ Oyun Kuralları",
      helpOk: "✅ Anladım",
      nicknamePrompt: "👤 Enter your Nickname",
      nicknameSave: "Kaydet",
      moveLabel: "Hamle",
      scoreLabel: "Skor",
      noScores: "Henüz skor kaydı yok.",
      statusSeriesComplete: "🎉 {n}. seri tamamlandı! +100 puan",
      statusGameOver: "💀 Oyun bitti! Hiç kart yerleştiremedin.",
      statusCardNotAllowed: "⛔ Bu kart bu seriye konulamaz.",
      statusUndoBlocked: "🚫 Geri alma devre dışı (kart yerleştirildi).",
      statusUndoNone: "⛔ Geri alınacak çekilmiş kart yok.",
      statusUndoDone: "↩️ Açılan kartlar geri alındı.",
      statusJokerUsed: "🃏 Joker kullanıldı! Kart sona taşındı.",
      statusJokerAlready: "❌ Joker zaten kullanıldı.",
      statusJokerEmpty: "⛔ Joker kullanılacak kart kalmadı.",
      statusCardInvalid: "❌ Bu kart geçersiz.",
      statusCardNoTarget: "❌ Bu kart için uygun bir seri yok."
    },
    en: {
      newGame: "🎮 New Game",
      dailyChallenge: "🗓 Daily Challenge",
      dailyCompleted: "✅ Challenge Completed",
      scoreHistory: "📊 Score History",
      help: "❓ Help",
      alreadyCompleted: "✅ Today's challenge already completed!",
      settingsTitle: "🎮 Game Settings",
      difficultyEasy: "🟢 Easy (1 card)",
      difficultyMedium: "🟡 Medium (2 cards)",
      difficultyHard: "🔴 Hard (3 cards)",
      autoHint: "💡 Auto Hint",
      start: "✅ Start",
      winTitle: "🏆 Congratulations!",
      playAgain: "🔁 Play Again",
      historyTitle: "📊 Score History",
      helpTitle: "❓ Game Rules",
      helpOk: "✅ Got it",
      nicknamePrompt: "👤 Enter your Nickname",
      nicknameSave: "Save",
      moveLabel: "Moves",
      scoreLabel: "Score",
      noScores: "No score records yet.",
      statusSeriesComplete: "🎉 {n}th series complete! +100 pts",
      statusGameOver: "💀 Game over! You couldn't place any cards.",
      statusCardNotAllowed: "⛔ This card can't be placed here.",
      statusUndoBlocked: "🚫 Undo disabled (a card was placed).",
      statusUndoNone: "⛔ No drawn cards to undo.",
      statusUndoDone: "↩️ Drawn cards returned.",
      statusJokerUsed: "🃏 Joker used! Card sent to the end.",
      statusJokerAlready: "❌ Joker already used.",
      statusJokerEmpty: "⛔ No card to use Joker on.",
      statusCardInvalid: "❌ Invalid card.",
      statusCardNoTarget: "❌ No valid series for this card."
    }
  };
  
  let currentLanguage = localStorage.getItem("deckoLang") || "tr";
  
  function t(key, params = {}) {
    let text = translations[currentLanguage][key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
    return text;
  }
  
  function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem("deckoLang", lang);
    updateLanguageTexts();
  }
  
  function updateLanguageTexts() {
    const $ = id => document.getElementById(id);
  
    $("dailyChallengeBtn").innerText = hasPlayedDaily() ? t("dailyCompleted") : t("dailyChallenge");
    document.querySelector("button[onclick='openSettingsModal()']").innerText = t("newGame");
    document.querySelector("button[onclick='showScoreHistory()']").innerText = t("scoreHistory");
    document.querySelector("button[onclick='openHelp()']").innerText = t("help");
    const selector = $("languageSelect");
    if (selector) selector.value = currentLanguage;
  
    $("settingsModal").querySelector("h2").innerText = t("settingsTitle");
    const options = $("difficultySelect").options;
    if (options.length >= 3) {
      options[0].text = t("difficultyEasy");
      options[1].text = t("difficultyMedium");
      options[2].text = t("difficultyHard");
    }
    const label = $("autoHintToggle").parentNode;
    if (label) label.lastChild.textContent = t("autoHint");
    $("settingsModal").querySelector("button[onclick='startGameFromModal()']").innerText = t("start");
  
    $("winModal").querySelector("h2").innerText = t("winTitle");
    $("winModal").querySelector("button").innerText = t("playAgain");
  
    $("scoreHistoryModal").querySelector("h2").innerText = t("historyTitle");
  
    $("helpModal").querySelector("h2").innerText = t("helpTitle");
    $("helpModal").querySelector("button").innerText = t("helpOk");
  
    $("nicknameModal").querySelector("h2").innerText = t("nicknamePrompt");
    $("nicknameModal").querySelector("button").innerText = t("nicknameSave");
  
    $("moveCounter").innerText = `${t("moveLabel")}: ${moveCount}`;
    $("scoreCounter").innerText = `${t("scoreLabel")}: ${score}`;
  }  
  
  window.addEventListener("DOMContentLoaded", updateLanguageTexts);
  