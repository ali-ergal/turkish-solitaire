function updateCounters() {
    const highScoreDisplay = ` (${t("highScoreLabel", { n: 3 })}: ${highScore})`;
    document.getElementById("moveCounter").innerText = `${t("moveLabel", { n: 3 })}: ${moveCount}`;
    document.getElementById("scoreCounter").innerText = `${t("scoreLabel", { n: 3 })}: ${score}${highScoreDisplay}`;
}

function cardImageFile(card) {
    const rankMap = { 1: "ace", 11: "jack", 12: "queen", 13: "king" };
    const suitMap = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
    return `images/cards/standard/${rankMap[card.rank] || card.rank}_of_${suitMap[card.suit]}.png`;
}

function formatCard(card) {
    const names = { 1: "As", 11: "Vale", 12: "Kız", 13: "Papaz" };
    return `${names[card.rank] || card.rank}${card.suit}`;
}

function renderDeckStack() {
    const deckEl = document.getElementById("deck");
    deckEl.innerHTML = ""; // Clear existing stack

    const visibleCount = Math.min(deck.length - drawIndex, 5); // Max 5 cards visible in stack

    for (let i = 0; i < visibleCount; i++) {
        const img = document.createElement("img");
        img.src = "images/cards/standard/back.png"; // back side of the card
        img.className = "deck-card";
        img.style.position = "absolute";
        img.style.right = `${i * 2}px`; // Slight horizontal offset
        img.style.zIndex = i;
        deckEl.appendChild(img);
    }

    if (visibleCount === 0) {
        deckEl.classList.add("empty");
    } else {
        deckEl.classList.remove("empty");
    }
}

function updateJokerButtonState() {
    const btn = document.getElementById("useJoker");
    if (!btn) return;
    btn.disabled = jokerUsed || drawnCards.length > 0 || drawIndex >= deck.length;
  }

function updateUI() {
    updateJokerButtonState();

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

function updateTimer() {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
}