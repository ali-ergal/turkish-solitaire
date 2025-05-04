const debug = false;
const suits = ["♠", "♥", "♣", "♦"];
let deck = [], drawIndex = 0, drawnCards = [], table = [], currentRoundPlacedCards = 0;
let moveCount = 0, score = 0, comboCount = 0, lastPlaceTime = 0, highScore = Number(localStorage.getItem("highScore")) || 0;
let startTime, timerInterval, selectedCard = null, completedSuits = [], lastDrawCount = 0, undoEnabled = false;
let difficultyLevel = 3, hintTimeout = null, autoHintEnabled = Number(localStorage.getItem("autoHint")), jokerUsed = false, soundEnabled = 0;

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
    document.getElementById("useJoker").disabled = false;
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

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function drawThree() {
    comboCount = 0;
    document.getElementById("status").innerText = "";

    if (drawIndex >= deck.length) {
        if (currentRoundPlacedCards === 0 && jokerUsed === true) {
            document.getElementById("status").innerText = t("statusGameOver", { n: 3 });
            return;
        }

        drawIndex = 0;
        currentRoundPlacedCards = 0;
        drawnCards = [];
        selectedCard = null;
        playNewTurnSound();
        updateUI();
        return;
    }

    moveCount++;
    updateCounters();

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

    // Instead of drawing all at once, we'll animate them one by one!
    let drawAnimations = [];

    for (let i = 0; i < drawCount; i++) {
        const card = deck[drawIndex];
        card.faceUp = true;
        drawnCards.push(card);
        drawIndex++;

        // We'll delay UI update slightly
        drawAnimations.push(card);
    }

    // Now show drawn cards with animation
    updateDrawnCardsAnimated(drawAnimations);

    renderDeckStack();
}

function useJoker() {
    if (jokerUsed) {
        document.getElementById("status").innerText = t("statusJokerAlready", { n: 3 });
        return;
    }

    if (drawIndex >= deck.length) {
        document.getElementById("status").innerText = t("statusJokerEmpty", { n: 3 });
        return;
    }

    // Joker mantığı: sıradaki kartı sona taşı
    const card = deck.splice(drawIndex, 1)[0];
    deck.push(card);

    jokerUsed = true;
    document.getElementById("useJoker").disabled = true;
    document.getElementById("status").innerText = t("statusJokerUsed", { n: 3 });
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
            document.getElementById("status").innerText = t("statusSeriesComplete", { n: 3 });
        }
        drawnCards.pop();

        const cardIndexInDeck = deck.findIndex(
            c => c.suit === card.suit && c.rank === card.rank
        );
        if (cardIndexInDeck !== -1) {
            deck.splice(cardIndexInDeck, 1);
            drawIndex--;
        }

        currentRoundPlacedCards++;

        comboCount++;
        const comboBonus = (comboCount - 1) * 5;
        score += 10 + comboBonus;
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
            let finalMessage = `${t("statusWin", { n: 3 })}\n${t("moveLabel", { n: 3 })}: ${moveCount}, ${t("scoreLabel", { n: 3 })}: ${score}, ${t("durationLabel", { n: 3 })}: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            markDailyCompleted(); // 👈 after a win
            if (score > highScore) {
                localStorage.setItem("highScore", score);
                highScore = score;
                finalMessage += `\n${t("statusNewRecord", { n: 3 })}`;
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
        document.getElementById("status").innerText = t("statusCardNotAllowed", { n: 3 });
    }
}

function undoDraw() {
    if (!undoEnabled) {
        document.getElementById("status").innerText = t("statusUndoBlocked", { n: 3 });
        return;
    }

    if (lastDrawCount === 0 || drawnCards.length < lastDrawCount) {
        document.getElementById("status").innerText = t("statusUndoNone", { n: 3 });
        return;
    }

    const deckEl = document.getElementById("deck");
    const deckRect = deckEl.getBoundingClientRect();
    const drawnDiv = document.getElementById("drawnCards");

    const cardsToReturn = drawnCards.slice(-lastDrawCount);
    drawnCards.splice(-lastDrawCount, lastDrawCount);

    const existingCards = [...drawnDiv.querySelectorAll("img")];
    const flyingBackCards = [];

    let animationsCompleted = 0;

    cardsToReturn.forEach((card, i) => {
        const img = existingCards[i];
        const fromRect = img.getBoundingClientRect();

        const flying = document.createElement("img");
        flying.src = cardImageFile(card);
        flying.className = "flying-card";
        flying.style.position = "fixed";
        flying.style.left = fromRect.left + "px";
        flying.style.top = fromRect.top + "px";
        flying.style.width = "80px";
        flying.style.height = "120px";
        flying.style.zIndex = 100 + i;
        document.body.appendChild(flying);

        const dx = (deckRect.left + deckRect.width / 2 - 35) - fromRect.left;
        const dy = (deckRect.top + deckRect.height / 2 - 55) - fromRect.top;

        anime({
            targets: flying,
            translateX: dx,
            translateY: dy,
            opacity: 0.5,
            duration: 500,
            delay: i * 150,
            easing: "easeOutExpo",
            complete: () => {
                flyingBackCards.push(flying);
                animationsCompleted++;

                // ✅ When all cards are back to deck
                if (animationsCompleted === cardsToReturn.length) {
                    flyingBackCards.forEach(card => card.remove());

                    // Clean up drawn area
                    drawnDiv.innerHTML = "";

                    drawIndex -= lastDrawCount;
                    updateUI();

                    document.getElementById("status").innerText = t("statusUndoDone", { n: 3 });
                    lastDrawCount = 0;
                    undoEnabled = false;
                    selectedCard = null;
                }
            }
        });
    });
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
        document.getElementById("status").innerText = t("statusCardNoTarget", { n: 3 });
        return;
    }

    animateCardToSeries(card, targetIndex);
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
    if (drawnCards.length === 0) return;

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
        anime({
            targets: seriesEl,
            boxShadow: [
                "0 0 0px rgba(255, 255, 0, 0)",
                "0 0 20px 5px gold",
                "0 0 0px rgba(255, 255, 0, 0)"
            ],
            duration: 1000,
            easing: "easeInOutQuad"
        });
    }
}

window.addEventListener("DOMContentLoaded", createDeck);
document.getElementById("deck").addEventListener("click", drawThree);
document.getElementById("undoBtn").addEventListener("click", undoDraw);
