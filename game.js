const debug = false;
const suits = ["♠", "♥", "♣", "♦"];
let deck = [], drawIndex = 0, drawnCards = [], table = [], turdaYerlesenKartSayisi = 0;
let moveCount = 0, score = 0, comboCount = 0, lastPlaceTime = 0, highScore = Number(localStorage.getItem("highScore")) || 0;
let startTime, timerInterval, selectedCard = null, completedSuits = [], lastDrawCount = 0, undoEnabled = false;
let difficultyLevel = 3, hintTimeout = null, autoHintEnabled = Number(localStorage.getItem("autoHint")), jokerUsed = false, soundEnabled = true;

const seriesInfo = [
    { suit: "♥", direction: "asc", label: "As ♥", card_image: "ace_of_hearts.png" },
    { suit: "♣", direction: "asc", label: "As ♣", card_image: "ace_of_spades.png" },
    { suit: "♦", direction: "asc", label: "As ♦", card_image: "ace_of_diamonds.png" },
    { suit: "♠", direction: "asc", label: "As ♠", card_image: "ace_of_clubs.png" },
    { suit: "♥", direction: "desc", label: "Papaz ♥", card_image: "king_of_hearts.png" },
    { suit: "♣", direction: "desc", label: "Papaz ♣", card_image: "king_of_spades.png" },
    { suit: "♦", direction: "desc", label: "Papaz ♦", card_image: "ace_of_diamonds.png" },
    { suit: "♠", direction: "desc", label: "Papaz ♠", card_image: "ace_of_clubs.png" },
];

const toggleDebugPanel = () => {
    const debugPanel = document.getElementById("debugPanel");
    debugPanel.style.display = debug ? "block" : "none";
};

toggleDebugPanel();

function createDeck() {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";
    difficultyLevel = Number(document.getElementById("difficultySelect").value);
    deck = suits.flatMap(suit => Array.from({ length: 13 }, (_, rank) => ({ suit, rank: rank + 1, faceUp: false })));
    deck = shuffle(deck);
    drawIndex = 0;
    drawnCards = [];
    table = Array.from({ length: 8 }, () => []);
    moveCount = score = 0;
    completedSuits = [];
    jokerUsed = false;
    updateCounters();

    const toggle = document.getElementById("autoHintToggle");
    if (toggle) {
        autoHintEnabled = toggle.checked;
        localStorage.setItem("autoHint", autoHintEnabled ? "1" : "0");
    }

    updateUI();
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
    document.getElementById("status").innerText = "";
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function updateCounters() {
    const highScoreDisplay = ` (Rekor: ${highScore})`;
    document.getElementById("moveCounter").innerText = `Hamle: ${moveCount}`;
    document.getElementById("scoreCounter").innerText = `Skor: ${score}${highScoreDisplay}`;
}

function updateTimer() {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    document.getElementById("timer").innerText = `Süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

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

function highlightCard(el) {
    removeHighlight();
    el.classList.add("selected");
}

function removeHighlight() {
    document.querySelectorAll(".card-img.selected").forEach(el => el.classList.remove("selected"));
}

function cardImageFile(card) {
    const rankMap = { 1: "ace", 11: "jack", 12: "queen", 13: "king" };
    const suitMap = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
    return `cards/${rankMap[card.rank] || card.rank}_of_${suitMap[card.suit]}.png`;
}

function formatCard(card) {
    const names = { 1: "As", 11: "Vale", 12: "Kız", 13: "Papaz" };
    return `${names[card.rank] || card.rank}${card.suit}`;
}

function drawThree() {
    comboCount = 0;
    document.getElementById("status").innerText = "";
    if (drawIndex >= deck.length) {
        if (turdaYerlesenKartSayisi === 0 && jokerUsed === true) {
            document.getElementById("status").innerHTML = `
              💀 Oyun bitti! Hiç kart yerleştiremedin.
              <br><button onclick="openSettingsFromLoss()">🔁 Tekrar Dene</button>
            `;
            return;
        }

        drawIndex = 0;
        turdaYerlesenKartSayisi = 0;
        drawnCards = [];
        selectedCard = null;
        removeHighlight();

        playNewTurnSound();

        const deckEl = document.getElementById("deck");
        deckEl.classList.add("flash");
        setTimeout(() => deckEl.classList.remove("flash"), 500);
        

        updateUI();
        return;
    }

    const remaining = deck.length - drawIndex;
    const drawCount = Math.min(difficultyLevel, remaining);
    lastDrawCount = drawCount;
    undoEnabled = true;

    if (hintTimeout) clearTimeout(hintTimeout);

    if (autoHintEnabled) {
        hintTimeout = setTimeout(() => {
            showHint();
        }, 3000);
    }

    for (let i = 0; i < drawCount; i++) {
        let card = deck[drawIndex];
        card.faceUp = true;
        drawnCards.push(card);
        drawIndex++;
    }

    updateUI();
}

function useJoker() {
    if (jokerUsed) {
        document.getElementById("status").innerText = "❌ Joker zaten kullanıldı."
      return;
    }
  
    if (drawIndex >= deck.length) {
      document.getElementById("status").innerText = "⛔ Joker kullanılacak kart kalmadı.";
      return;
    }
  
    // Joker mantığı: sıradaki kartı sona taşı
    const card = deck.splice(drawIndex, 1)[0];
    deck.push(card);
  
    jokerUsed = true;
    document.getElementById("useJoker").disabled = true;
    document.getElementById("status").innerText = `🃏 Joker kullanıldı! Kart sona taşındı.`;
    updateUI();
}

function canPlaceCardOnSeries(seriesIndex, card) {
    const { suit, direction } = seriesInfo[seriesIndex];
    const pile = table[seriesIndex];
    const top = pile[pile.length - 1];

    if (card.suit !== suit) return false;

    if (!top) {
        return direction === "asc" ? card.rank === 1 : card.rank === 13;
    } else {
        return direction === "asc"
            ? card.rank === top.rank + 1
            : card.rank === top.rank - 1;
    }
}

function placeCardOnSeries(index) {
    if (drawnCards.length === 0) return;

    if (hintTimeout) clearTimeout(hintTimeout);

    const card = drawnCards[drawnCards.length - 1];

    if (canPlaceCardOnSeries(index, card)) {
        playDropSound();

        table[index].push(card);
        undoEnabled = false;

        if (table[index].length === 13) {
            score += 100;
            document.getElementById("status").innerText = `🎉 ${index + 1}. seri tamamlandı! +100 puan`;
        }
        drawnCards.pop();

        const cardIndexInDeck = deck.findIndex(
            c => c.suit === card.suit && c.rank === card.rank
        );
        if (cardIndexInDeck !== -1) {
            deck.splice(cardIndexInDeck, 1);
            drawIndex--;
        }

        turdaYerlesenKartSayisi++;

        comboCount++;
        const comboBonus = (comboCount - 1) * 5;
        score += 10 + comboBonus;
        moveCount++;
        updateCounters();

        checkSuitCompletion(card.suit);

        updateUI();

        if (table.flat().length === 52) {
            score += 500;
            updateCounters();
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            saveScoreHistory(score, moveCount);
            let finalMessage = `Oyunu kazandınız!\nHamle: ${moveCount}, Skor: ${score}, Süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (score > highScore) {
                localStorage.setItem("highScore", score);
                highScore = score;
                finalMessage += `\n🎉 Yeni rekor!`;
            }
            updateCounters();
            clearInterval(timerInterval);
            document.getElementById("status").innerText = "";

            document.querySelectorAll(".card-img").forEach((img, i) => {
                setTimeout(() => {
                    img.classList.add("win-fly");
                }, i * 50);
            });

            setTimeout(() => {
                const modal = document.getElementById("winModal");
                const winStats = document.getElementById("winStats");
                winStats.innerText = finalMessage.replaceAll("\n", "\n");
                triggerWinCelebration();
                modal.style.display = "flex";

            }, 1000);
        }
    } else {
        document.getElementById("status").innerText = "⛔ Bu kart bu seriye konulamaz.";
    }
}

function undoDraw() {
    if (!undoEnabled) {
        document.getElementById("status").innerText = "🚫 Geri alma devre dışı (kart yerleştirildi).";
        return;
    }

    if (lastDrawCount === 0 || drawnCards.length < lastDrawCount) {
        document.getElementById("status").innerText = "⛔ Geri alınacak çekilmiş kart yok.";
        return;
    }

    const deckEl = document.getElementById("deck");
    const deckRect = deckEl.getBoundingClientRect();
    const drawnDiv = document.getElementById("drawnCards");

    const cardsToReturn = drawnCards.slice(-lastDrawCount);

    drawnCards.splice(-lastDrawCount, lastDrawCount);

    cardsToReturn.forEach((card, i) => {
        const img = drawnDiv.querySelector("img");
        const fromRect = img ? img.getBoundingClientRect() : { left: 0, top: 0 };

        const flying = document.createElement("img");
        flying.src = cardImageFile(card);
        flying.className = "flying-card";
        flying.style.left = `${fromRect.left}px`;
        flying.style.top = `${fromRect.top}px`;
        document.body.appendChild(flying);

        requestAnimationFrame(() => {
            const dx = deckRect.left - fromRect.left;
            const dy = deckRect.top - fromRect.top;
            flying.style.transform = `translate(${dx}px, ${dy}px)`;
            flying.style.opacity = "0.5";
        });

        setTimeout(() => {
            card.faceUp = true;

            const exists = deck.some(c => c.suit === card.suit && c.rank === card.rank);
            if (!exists) {
                deck.splice(drawIndex - lastDrawCount + i, 0, card);
            }

            flying.remove();

            if (i === cardsToReturn.length - 1) {
                drawIndex -= lastDrawCount;
                updateUI();
                document.getElementById("status").innerText = "↩️ Açılan kartlar geri alındı.";
                lastDrawCount = 0;
                undoEnabled = false;
                selectedCard = null;
                removeHighlight();
            }
        }, 500 + i * 100);
    });
}

function updateUI() {
    const deckEl = document.getElementById("deck");
    if (drawIndex >= deck.length) {
        deckEl.classList.add("empty");
    } else {
        deckEl.classList.remove("empty");
    }

    const drawnDiv = document.getElementById("drawnCards");
    drawnDiv.innerHTML = "";

    if (drawnCards.length > 0) {
        const drawCount = Math.min(difficultyLevel, drawnCards.length);
        const start = drawnCards.length - drawCount;
        const visibleCards = drawnCards.slice(start);

        visibleCards.forEach((card, i) => {
            const img = document.createElement("img");
            img.src = cardImageFile(card);
            img.alt = formatCard(card);
            img.className = "card-img";
            img.style.zIndex = i + 1;

            if (i === visibleCards.length - 1) {
                img.setAttribute("draggable", "true");
                img.addEventListener("click", () => {
                    selectedCard = card;
                    highlightCard(img);
                });
                img.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("text/plain", JSON.stringify(card));
                });
                img.addEventListener("dblclick", () => {
                    tryAutoPlaceCard(card);
                });
            }

            drawnDiv.appendChild(img);
        });
    }

    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "";

    table.forEach((pile, index) => {
        const container = document.createElement("div");
        container.className = "series-container";

        container.ondragover = (e) => e.preventDefault();
        container.ondrop = (e) => {
            e.preventDefault();
            const cardData = JSON.parse(e.dataTransfer.getData("text/plain"));
            handleDropCard(index, cardData);
        };

        container.onclick = () => {
            if (selectedCard) {
                handleDropCard(index, selectedCard);
                selectedCard = null;
                removeHighlight();
            } else {
                placeCardOnSeries(index);
            }
        };

        const top = pile[pile.length - 1];
        if (top) {
            const img = document.createElement("img");
            img.src = cardImageFile(top);
            img.alt = formatCard(top);
            img.className = "card-img";
            container.appendChild(img);
            container.classList.remove("empty");
            container.removeAttribute("data-label");
        } else {
            container.classList.add("empty");

            const { suit, direction } = seriesInfo[index];
            const base = direction === "asc" ? "as" : "king";
            const suitMap = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
            container.classList.add(`${base}-${suitMap[suit]}`);
        }

        tableDiv.appendChild(container);
    });

    if (debug) {
        const remainingDiv = document.getElementById("remainingCards");
        remainingDiv.innerHTML = "";

        deck.slice(drawIndex).forEach(card => {
            const span = document.createElement("span");
            span.textContent = formatCard(card) + " ";
            remainingDiv.appendChild(span);
        });
    }
}

function handleDropCard(seriesIndex, droppedCard) {
    const top = drawnCards[drawnCards.length - 1];
    if (!top || top.suit !== droppedCard.suit || top.rank !== droppedCard.rank) {
        document.getElementById("status").innerText = "❌ Bu kart geçersiz.";
        return;
    }

    if (canPlaceCardOnSeries(seriesIndex, top)) {
        playDropSound();
        placeCardOnSeries(seriesIndex);
    } else {
        document.getElementById("status").innerText = "⛔ Bu seriye bu kart konamaz.";
    }
}

function tryAutoPlaceCard(card) {
    let targetIndex = -1;
    for (let i = 0; i < table.length; i++) {
        if (canPlaceCardOnSeries(i, card)) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex === -1) {
        document.getElementById("status").innerText = "❌ Bu kart için uygun bir seri yok.";
        return;
    }

    animateCardToSeries(card, targetIndex);
}

function animateCardToSeries(card, seriesIndex) {
    const cardImg = document.querySelector('#drawnCards img');
    const targetBox = document.querySelectorAll('.series-container')[seriesIndex];

    const rectFrom = cardImg.getBoundingClientRect();
    const rectTo = targetBox.getBoundingClientRect();

    const flying = document.createElement("img");
    flying.src = cardImageFile(card);
    flying.className = "flying-card";
    flying.style.left = rectFrom.left + "px";
    flying.style.top = rectFrom.top + "px";
    document.body.appendChild(flying);

    requestAnimationFrame(() => {
        const dx = rectTo.left - rectFrom.left;
        const dy = rectTo.top - rectFrom.top;
        flying.style.transform = `translate(${dx}px, ${dy}px)`;
        flying.style.opacity = "0.7";
    });

    setTimeout(() => {
        placeCardOnSeries(seriesIndex);
        flying.remove();
    }, 500);
}

function checkSuitCompletion(suit) {
    if (completedSuits.includes(suit)) return;

    const relatedSeriesIndexes = seriesInfo
        .map((s, i) => (s.suit === suit ? i : -1))
        .filter(i => i !== -1);

    const totalCards = relatedSeriesIndexes.reduce((sum, i) => sum + table[i].length, 0);

    if (totalCards === 13) {
        completedSuits.push(suit);
        score += 100;
        updateCounters();
        document.getElementById("status").innerText = `🎉 ${suit} serisi tamamlandı! +100 puan`;
    }
}

function showHint() {
    if (drawnCards.length === 0) {
        return;
    }

    const topCard = drawnCards[drawnCards.length - 1];
    let targetIndex = -1;

    for (let i = 0; i < table.length; i++) {
        if (canPlaceCardOnSeries(i, topCard)) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex !== -1) {
        const seriesEl = document.querySelectorAll(".series-container")[targetIndex];
        seriesEl.classList.add("hint");

        setTimeout(() => {
            seriesEl.classList.remove("hint");
        }, 1000);
    }
}

function saveScoreHistory(score, moves) {
    let history = JSON.parse(localStorage.getItem("scoreHistory")) || [];
    const duration = Math.floor((Date.now() - startTime) / 1000); // saniye cinsinden süre
    history.push({
        score,
        moves,
        duration, // yeni eklenen alan
        date: new Date().toLocaleString()
    });
    localStorage.setItem("scoreHistory", JSON.stringify(history));
}

function showScoreHistory() {
    const modal = document.getElementById("scoreHistoryModal");
    const tableDiv = document.getElementById("scoreHistoryTable");
    const history = JSON.parse(localStorage.getItem("scoreHistory")) || [];

    if (history.length === 0) {
        tableDiv.innerHTML = "<p>Henüz skor kaydı yok.</p>";
    } else {
        // Önce sıralama
        history.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score; // Skora göre azalan
            } else {
                return a.duration - b.duration; // Süreye göre artan
            }
        });

        // 🔥 İlk 10 skoru al
        history = history.slice(0, 10);

        let html = "<table><tr><th>#</th><th>Skor</th><th>Hamle</th><th>Süre</th><th>Tarih</th></tr>";
        history.forEach((h, index) => {
            const minutes = Math.floor(h.duration / 60);
            const seconds = h.duration % 60;
            const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            html += `<tr>
                        <td>${index + 1}</td>
                        <td>${h.score}</td>
                        <td>${h.moves}</td>
                        <td>${timeFormatted}</td>
                        <td>${h.date}</td>
                    </tr>`;
        });
        html += "</table>";
        tableDiv.innerHTML = html;
    }

    modal.style.display = "flex";
}

function closeScoreHistory() {
    document.getElementById("scoreHistoryModal").style.display = "none";
}

function clearScoreHistory() {
    localStorage.removeItem("scoreHistory");
    showScoreHistory();
}

function openHelp() {
    document.getElementById("helpModal").style.display = "flex";
}

function closeHelp() {
    document.getElementById("helpModal").style.display = "none";
}

function triggerWinCelebration() {
    if (window.confetti) {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }

    playSound("winSound");

    setTimeout(() => {
        const c = document.querySelector('canvas');
        if (c) c.style.zIndex = "3000";
    }, 50);
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

document.getElementById("deck").addEventListener("click", drawThree);
document.getElementById("undoBtn").addEventListener("click", undoDraw);
document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
});
document.getElementById("homeBtn").addEventListener("click", backToMainMenu);
document.getElementById("soundToggleBtn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    document.getElementById("soundToggleBtn").innerText = soundEnabled ? "🔊" : "🔇";
});

createDeck();