const CACHE_NAME = "decko-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./js/confetti.browser.min.js",
  "./js/anime.min.js",
  "./js/language.js",
  "./js/dailyChallange.js",
  "./game.js",
  "./sounds/card-drop.mp3",
  "./sounds/new-turn.mp3",
  "./sounds/win.mp3",
  "./manifest.json",
  "./images/cards/2_of_clubs.png",
  "./images/cards/2_of_diamonds.png",
  "./images/cards/2_of_hearts.png",
  "./images/cards/2_of_spades.png",
  "./images/cards/3_of_clubs.png",
  "./images/cards/3_of_diamonds.png",
  "./images/cards/3_of_hearts.png",
  "./images/cards/3_of_spades.png",
  "./images/cards/4_of_clubs.png",
  "./images/cards/4_of_diamonds.png",
  "./images/cards/4_of_hearts.png",
  "./images/cards/4_of_spades.png",
  "./images/cards/5_of_clubs.png",
  "./images/cards/5_of_diamonds.png",
  "./images/cards/5_of_hearts.png",
  "./images/cards/5_of_spades.png",
  "./images/cards/6_of_clubs.png",
  "./images/cards/6_of_diamonds.png",
  "./images/cards/6_of_hearts.png",
  "./images/cards/6_of_spades.png",
  "./images/cards/7_of_clubs.png",
  "./images/cards/7_of_diamonds.png",
  "./images/cards/7_of_hearts.png",
  "./images/cards/7_of_spades.png",
  "./images/cards/8_of_clubs.png",
  "./images/cards/8_of_diamonds.png",
  "./images/cards/8_of_hearts.png",
  "./images/cards/8_of_spades.png",
  "./images/cards/9_of_clubs.png",
  "./images/cards/9_of_diamonds.png",
  "./images/cards/9_of_hearts.png",
  "./images/cards/9_of_spades.png",
  "./images/cards/10_of_clubs.png",
  "./images/cards/10_of_diamonds.png",
  "./images/cards/10_of_hearts.png",
  "./images/cards/10_of_spades.png",
  "./images/cards/ace_of_clubs.png",
  "./images/cards/ace_of_diamonds.png",
  "./images/cards/ace_of_hearts.png",
  "./images/cards/ace_of_spades.png",
  "./images/cards/jack_of_clubs.png",
  "./images/cards/jack_of_diamonds.png",
  "./images/cards/jack_of_hearts.png",
  "./images/cards/jack_of_spades.png",
  "./images/cards/queen_of_clubs.png",
  "./images/cards/queen_of_diamonds.png",
  "./images/cards/queen_of_hearts.png",
  "./images/cards/queen_of_spades.png",
  "./images/cards/king_of_clubs.png",
  "./images/cards/king_of_diamonds.png",
  "./images/cards/king_of_hearts.png",
  "./images/cards/king_of_spades.png",
  "./images/cards/back.png",
  "./images/cards/back@2x.png",
  "./images/cards/black_joker.png",
  "./images/cards/red_joker.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});