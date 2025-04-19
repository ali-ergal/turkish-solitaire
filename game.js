const debug = false;
const suits = ["♠", "♥", "♣", "♦"];
let deck = [];
let drawIndex = 0;
let drawnCards = [];
let table = [];
let turdaYerlesenKartSayisi = 0;
let moveCount = 0;
let score = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let startTime;
let timerInterval;

let selectedCard = null; // mobil seçim için

let completedSuits = []; // ["♥", "♠", ...] buraya ekleyeceğiz
let lastDrawCount = 0; // en son kaç kart çekildi (1, 2, 3 olabilir)
let undoEnabled = false;
let difficultyLevel = 3;

let hintTimeout = null;

let autoHintEnabled = true;

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

if (debug) {
    document.getElementById("debugPanel").style.display = "block";
} else {
    document.getElementById("debugPanel").style.display = "none";
}

function createDeck() {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";
    difficultyLevel = Number(document.getElementById("difficultySelect").value);
    deck = [];
    completedSuits = [];
    for (let suit of suits) {
        for (let rank = 1; rank <= 13; rank++) {
            deck.push({ suit, rank, faceUp: false });
        }
    }
    deck = shuffle(deck);
    drawIndex = 0;
    drawnCards = [];
    table = Array.from({ length: 8 }, () => []);

    moveCount = 0;
    score = 0;
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

function drawThree() {
    // Eğer deste bitti ve hiç kart yerleştirilememişse: kaybettin
    if (drawIndex >= deck.length) {
        if (turdaYerlesenKartSayisi === 0) {
            document.getElementById("status").innerHTML = `
              💀 Oyun bitti! Hiç kart yerleştiremedin.
              <br><button onclick="openSettingsFromLoss()">🔁 Tekrar Dene</button>
            `;
            return;
        }

        // Yeni tur başlatılıyor
        drawIndex = 0;
        turdaYerlesenKartSayisi = 0;
        drawnCards = [];
        selectedCard = null;
        removeHighlight();

        playNewTurnSound();

        const deckEl = document.getElementById("deck");
        deckEl.classList.add("flash");
        setTimeout(() => deckEl.classList.remove("flash"), 500);

        document.getElementById("status").innerText = "🔁 Yeni tura geçildi.";

        updateUI();

        // ❗Yeni turda kart açma yok
        return;
    }

    // ✅ Kalan kart sayısına göre esnek çekim
    const remaining = deck.length - drawIndex;
    const drawCount = Math.min(difficultyLevel, remaining);
    lastDrawCount = drawCount;
    undoEnabled = true;

    // 🕒 3 saniye sonra otomatik ipucu ver
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

    // Her çekimden sonra otomatik ipucu ver
    setTimeout(() => {
        showHint(); // 💡 Otomatik ipucu
    }, 300); // çok hızlı olmaması için kısa bir gecikme

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
        playDropSound(); // 🔊 ses burada çalacak

        table[index].push(card); // karti masaya ekle
        undoEnabled = false; // geri al buttonunu devre disi birak

        // ✅ Seri tamamlandıysa +100 puan
        if (table[index].length === 13) {
            score += 100;
            document.getElementById("status").innerText = `🎉 ${index + 1}. seri tamamlandı! +100 puan`;
        }
        drawnCards.pop();

        // 🔥 Remove from deck
        const cardIndexInDeck = deck.findIndex(
            c => c.suit === card.suit && c.rank === card.rank
        );
        if (cardIndexInDeck !== -1) {
            deck.splice(cardIndexInDeck, 1);
            drawIndex--;
        }

        // ✅ TURDA KART KONDU!
        turdaYerlesenKartSayisi++;

        // ✅ Hamle ve skor güncelle
        moveCount++;
        score += 10;
        updateCounters();

        checkSuitCompletion(card.suit);

        updateUI();

        if (table.flat().length === 52) {
            score += 500;
            updateCounters();
            document.getElementById("status").innerText = `🏆 Oyunu kazandınız! Toplam hamle: ${moveCount}, Skor: ${score}`;
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            let finalMessage = `🏆 Oyunu kazandınız!\nHamle: ${moveCount}, Skor: ${score}, Süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (score > highScore) {
                localStorage.setItem("highScore", score);
                highScore = score;
                finalMessage += `\n🎉 Yeni rekor!`;
            }
            updateCounters();
            clearInterval(timerInterval);
            document.getElementById("status").innerText = "";

            // 🃏 Kartları uçur
            document.querySelectorAll(".card-img").forEach((img, i) => {
                setTimeout(() => {
                    img.classList.add("win-fly");
                }, i * 50);
            });

            // 🏆 Modal göster
            setTimeout(() => {
                const modal = document.getElementById("winModal");
                const winStats = document.getElementById("winStats");
                winStats.innerText = finalMessage.replaceAll("\n", "\n");
                triggerWinCelebration(); // 🎊 Konfeti + ses
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

    // Son çekilen kartları sırayla al
    const cardsToReturn = drawnCards.slice(-lastDrawCount);

    // drawnCards listesinden sil
    drawnCards.splice(-lastDrawCount, lastDrawCount);

    // UI güncellemesi öncesi deck'e tek tek ekleyelim
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

            // ✅ Kopya kontrolü: bu kart zaten deck'te varsa tekrar ekleme!
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

function cardImageFile(card) {
    const rankMap = {
        1: "ace",
        11: "jack",
        12: "queen",
        13: "king"
    };
    const suitMap = {
        "♠": "spades",
        "♥": "hearts",
        "♦": "diamonds",
        "♣": "clubs"
    };
    const rank = rankMap[card.rank] || card.rank;
    const suit = suitMap[card.suit];
    return `cards/${rank}_of_${suit}.png`;
}

function formatCard(card) {
    const names = { 1: "As", 11: "Vale", 12: "Kız", 13: "Papaz" };
    return `${names[card.rank] || card.rank}${card.suit}`;
}

function updateUI() {

    // 🂠 Kapalı deste görselini kontrol et
    const deckEl = document.getElementById("deck");
    if (drawIndex >= deck.length) {
        deckEl.classList.add("empty"); // resim kalksın
    } else {
        deckEl.classList.remove("empty"); // resim gösterilsin
    }
    // Açılan kartlar
    const drawnDiv = document.getElementById("drawnCards");
    drawnDiv.innerHTML = "";

    if (drawnCards.length > 0) {
        const topCard = drawnCards[drawnCards.length - 1];
        const img = document.createElement("img");
        img.src = cardImageFile(topCard);
        img.alt = formatCard(topCard);
        img.className = "card-img";
        img.setAttribute("draggable", "true");

        // 🖱 Tıklama ile seçme (mobil için)
        img.addEventListener("click", () => {
            selectedCard = topCard;
            highlightCard(img);
        });

        // 🖱 Sürükle desteği
        img.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify(topCard));
        });

        // ✅ Double click ile otomatik yerleştir
        img.addEventListener("dblclick", () => {
            tryAutoPlaceCard(topCard);
        });

        drawnDiv.appendChild(img);
    }

    // Masadaki seriler (boş kutular, sadece kart varsa görsel)
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "";

    table.forEach((pile, index) => {
        const container = document.createElement("div");
        container.className = "series-container";

        // 🎯 Bırakma olayları
        container.ondragover = (e) => e.preventDefault();
        container.ondrop = (e) => {
            e.preventDefault();
            const cardData = JSON.parse(e.dataTransfer.getData("text/plain"));
            handleDropCard(index, cardData);
        };

        container.onclick = () => {
            // Eğer mobilde kart seçildiyse, buraya yerleştir
            if (selectedCard) {
                handleDropCard(index, selectedCard);
                selectedCard = null;
                removeHighlight(); // seçim vurgusunu kaldır
            } else {
                // masa tıklaması (masa kutusuna doğrudan tıklama)
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


    // 🛠 DEBUG: deck'te kalan kartları göster
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
    // Yalnızca en üst kart sürüklenebilir, güvenlik kontrolü
    if (!top || top.suit !== droppedCard.suit || top.rank !== droppedCard.rank) {
        document.getElementById("status").innerText = "❌ Bu kart geçersiz.";
        return;
    }

    if (canPlaceCardOnSeries(seriesIndex, top)) {
        playDropSound(); // 🔊 ses burada çalacak
        placeCardOnSeries(seriesIndex);
    } else {
        document.getElementById("status").innerText = "⛔ Bu seriye bu kart konamaz.";
    }
}

function tryAutoPlaceCard(card) {
    // 1. Uygun seri bul
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

    // 2. Animasyon başlat (kartı uçur)
    animateCardToSeries(card, targetIndex);
}

function animateCardToSeries(card, seriesIndex) {
    const cardImg = document.querySelector('#drawnCards img');
    const targetBox = document.querySelectorAll('.series-container')[seriesIndex];

    const rectFrom = cardImg.getBoundingClientRect();
    const rectTo = targetBox.getBoundingClientRect();

    // Uçan kart görseli oluştur
    const flying = document.createElement("img");
    flying.src = cardImageFile(card);
    flying.className = "flying-card";
    flying.style.left = rectFrom.left + "px";
    flying.style.top = rectFrom.top + "px";
    document.body.appendChild(flying);

    // Zamanlamalı olarak hedefe uçur
    requestAnimationFrame(() => {
        const dx = rectTo.left - rectFrom.left;
        const dy = rectTo.top - rectFrom.top;
        flying.style.transform = `translate(${dx}px, ${dy}px)`;
        flying.style.opacity = "0.7";
    });

    // Kart animasyonla uçuştan sonra yerleştirilsin
    setTimeout(() => {
        placeCardOnSeries(seriesIndex);
        flying.remove();
    }, 500); // animasyon süresi
}

function updateCounters() {
    document.getElementById("moveCounter").innerText = `Hamle: ${moveCount}`;
    document.getElementById("scoreCounter").innerText = `Skor: ${score}`;
    const highScoreDisplay = ` (Rekor: ${highScore})`;
    document.getElementById("scoreCounter").innerText = `Skor: ${score}${highScoreDisplay}`;
}

function playDropSound() {
    const audio = document.getElementById("dropSound");
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function playNewTurnSound() {
    const audio = document.getElementById("newTurnSound");
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function highlightCard(el) {
    removeHighlight();
    el.classList.add("selected");
}

function removeHighlight() {
    document.querySelectorAll(".card-img.selected").forEach(el => {
        el.classList.remove("selected");
    });
}

function checkSuitCompletion(suit) {
    if (completedSuits.includes(suit)) return; // zaten tamamlandıysa geç

    // O suit'e ait iki seriyi bul
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

function updateTimer() {
    const now = Date.now();
    const diff = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    document.getElementById("timer").innerText = `Süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showHint() {
    if (drawnCards.length === 0) {
        document.getElementById("status").innerText = "🤔 Açık kart yok.";
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

    if (targetIndex === -1) {
        document.getElementById("status").innerText = "🟨 Bu kartı koyacak yer yok.";
    } else {
        const seriesEl = document.querySelectorAll(".series-container")[targetIndex];
        seriesEl.classList.add("hint");

        setTimeout(() => {
            seriesEl.classList.remove("hint");
        }, 1000);

        document.getElementById("status").innerText = `💡 İpucu: ${formatCard(topCard)} → ${targetIndex + 1}. seri`;
    }
}

// 🏆 Konfeti Efekti + Ses
function triggerWinCelebration() {
    // Konfeti (canvas-confetti kullanılıyorsa)
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

    // Zafer sesi
    const audio = document.getElementById("winSound");
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }

    // canvas-confetti'nin canvas'ına yüksek z-index ver
    setTimeout(() => {
        const c = document.querySelector('canvas');
        if (c) c.style.zIndex = "3000";
    }, 50);
}

function startGameFromModal() {
    const modal = document.getElementById("settingsModal");
    if (modal) modal.style.display = "none";
    createDeck();
}

function closeSettingsModal() {
    document.getElementById("settingsModal").style.display = "none";
}

// Modal dışında tıklanınca da kapanması
window.addEventListener("click", function (event) {
    const modal = document.getElementById("settingsModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

function openSettingsFromWin() {
    // Önce kazanç modalını kapat
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";
  
    // Sonra ayar modalını göster
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.style.display = "block";
  }

  function openSettingsFromLoss() {
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.style.display = "block";
  }

// Event listeners
document.getElementById("deck").addEventListener("click", drawThree);
document.getElementById("undoBtn").addEventListener("click", undoDraw);
document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "block";
});

// Başlangıçta oyunu başlat
createDeck();