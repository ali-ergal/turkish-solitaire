let isAnimating = false;

function setAnimationState(active) {
    isAnimating = active;
}

function animateCardToSeries(card, seriesIndex) {
    if (isAnimating) return;
    setAnimationState(true);

    const cardImg = document.querySelector('#drawnCards img');
    const targetBox = document.querySelectorAll('.series-container')[seriesIndex];

    const rectFrom = cardImg.getBoundingClientRect();
    const rectTo = targetBox.getBoundingClientRect();

    const flying = document.createElement("img");
    flying.src = cardImageFile(card);
    flying.className = "flying-card";
    flying.style.position = "fixed";
    flying.style.left = rectFrom.left + "px";
    flying.style.top = rectFrom.top + "px";
    flying.style.width = cardImg.offsetWidth + "px";
    flying.style.height = cardImg.offsetHeight + "px";
    flying.style.zIndex = "1000";
    document.body.appendChild(flying);

    const dx = (rectTo.left + rectTo.width / 2) - (rectFrom.left + rectFrom.width / 2);
    const dy = (rectTo.top + rectTo.height / 2) - (rectFrom.top + rectFrom.height / 2);

    anime({
        targets: flying,
        translateX: dx,
        translateY: dy,
        scale: 1,
        opacity: 1,
        duration: 400,
        easing: "easeOutQuad",
        complete: () => {
            flying.remove();
            placeCardOnSeries(seriesIndex);
            setAnimationState(false);
        }
    });
}

function animateCardDraw(cards) {
    if (isAnimating) return;
    setAnimationState(true);

    const drawnDiv = document.getElementById("drawnCards");
    const deckEl = document.getElementById("deck");
    const deckRect = deckEl.getBoundingClientRect();
    const drawnRect = drawnDiv.getBoundingClientRect();

    const oldCards = [...drawnDiv.querySelectorAll("img")]; // Keep old cards
    const newFlyingCards = [];
    let animationsCompleted = 0;

    cards.forEach((card, i) => {
        const img = document.createElement("img");
        img.src = cardImageFile(card);
        img.alt = formatCard(card);
        img.className = "card-img";
        img.style.opacity = "0";
        img.style.position = "fixed";
        img.style.left = (deckRect.left + deckRect.width / 2 - 15) + "px";
        img.style.top = (deckRect.top + deckRect.height / 2 - 30) + "px";
        img.style.width = "100px";
        img.style.zIndex = 100 + i;
        document.body.appendChild(img);

        const finalLeft = drawnRect.left + (i === 0 ? 0 : i === 1 ? 15 : 30);
        const finalTop = drawnRect.top;

        anime({
            targets: img,
            translateX: finalLeft - parseFloat(img.style.left),
            translateY: finalTop - parseFloat(img.style.top),
            opacity: 1,
            duration: 500,
            delay: i * 150,
            easing: "easeOutExpo",
            complete: () => {
                newFlyingCards.push({ img, card });

                animationsCompleted++;

                // ✅ Wait until all cards are done flying
                if (animationsCompleted === cards.length) {
                    // Step 1: Remove old drawn cards
                    oldCards.forEach(old => old.remove());

                    // Step 2: Clean up the drawnDiv
                    drawnDiv.innerHTML = "";

                    // Step 3: Append new cards properly
                    newFlyingCards.forEach((item, idx) => {
                        const { img, card } = item;

                        img.style.position = "absolute";
                        img.style.left = "";
                        img.style.top = "";
                        img.style.transform = "none";
                        img.style.opacity = "1";
                        img.style.zIndex = "";

                        drawnDiv.appendChild(img);

                        // Set proper stacking (30px / 15px layout)
                        if (idx === 0) {
                            img.style.left = "0px";
                        } else if (idx === 1) {
                            img.style.left = "15px";
                        } else if (idx === 2) {
                            img.style.left = "30px";
                        }

                        img.addEventListener("click", () => {
                            tryAutoPlaceCard(card);
                        });
                        setAnimationState(false);
                    });
                }
            }
        });
    });
}

function animateUndoDraw(cardsToReturn, existingCards, deckRect, drawnDiv) {
    if (isAnimating) return;
    setAnimationState(true);

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

                if (animationsCompleted === cardsToReturn.length) {
                    flyingBackCards.forEach(card => card.remove());

                    drawnDiv.innerHTML = "";
                    drawIndex -= lastDrawCount;
                    updateUI();

                    document.getElementById("status").innerText = t("statusUndoDone", { n: 3 });
                    lastDrawCount = 0;
                    undoEnabled = false;
                    selectedCard = null;
                    setAnimationState(false);
                }
            }
        });
    });
}

function triggerWinCelebration() {
    if (window.confetti) {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }

    playSound("winSound");

    const cards = document.querySelectorAll(".card-img");
    cards.forEach((img, i) => {
        anime({
            targets: img,
            translateY: -600,
            rotate: 720,
            opacity: 0,
            duration: 1000,
            delay: i * 50,
            easing: "easeInQuad"
        });
    });

    setTimeout(() => {
        const modal = document.getElementById("winModal");
        const winStats = document.getElementById("winStats");
        if (modal && winStats) {
            winStats.innerText = `🏆 Kazandınız! Skor: ${score}`;
            modal.style.display = "flex";
        }
    }, 1500);
}