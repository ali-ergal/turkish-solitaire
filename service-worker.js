const CACHE_NAME = "decko-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./dist/js/app.min.js",
  "./sounds/card-drop.mp3",
  "./sounds/new-turn.mp3",
  "./sounds/win.mp3",
  "./manifest.json",
  ".images/cards/standard/2_of_clubs.png",
  ".images/cards/standard/2_of_diamonds.png",
  ".images/cards/standard/2_of_hearts.png",
  ".images/cards/standard/2_of_spades.png",
  ".images/cards/standard/3_of_clubs.png",
  ".images/cards/standard/3_of_diamonds.png",
  ".images/cards/standard/3_of_hearts.png",
  ".images/cards/standard/3_of_spades.png",
  ".images/cards/standard/4_of_clubs.png",
  ".images/cards/standard/4_of_diamonds.png",
  ".images/cards/standard/4_of_hearts.png",
  ".images/cards/standard/4_of_spades.png",
  ".images/cards/standard/5_of_clubs.png",
  ".images/cards/standard/5_of_diamonds.png",
  ".images/cards/standard/5_of_hearts.png",
  ".images/cards/standard/5_of_spades.png",
  ".images/cards/standard/6_of_clubs.png",
  ".images/cards/standard/6_of_diamonds.png",
  ".images/cards/standard/6_of_hearts.png",
  ".images/cards/standard/6_of_spades.png",
  ".images/cards/standard/7_of_clubs.png",
  ".images/cards/standard/7_of_diamonds.png",
  ".images/cards/standard/7_of_hearts.png",
  ".images/cards/standard/7_of_spades.png",
  ".images/cards/standard/8_of_clubs.png",
  ".images/cards/standard/8_of_diamonds.png",
  ".images/cards/standard/8_of_hearts.png",
  ".images/cards/standard/8_of_spades.png",
  ".images/cards/standard/9_of_clubs.png",
  ".images/cards/standard/9_of_diamonds.png",
  ".images/cards/standard/9_of_hearts.png",
  ".images/cards/standard/9_of_spades.png",
  ".images/cards/standard/10_of_clubs.png",
  ".images/cards/standard/10_of_diamonds.png",
  ".images/cards/standard/10_of_hearts.png",
  ".images/cards/standard/10_of_spades.png",
  ".images/cards/standard/ace_of_clubs.png",
  ".images/cards/standard/ace_of_diamonds.png",
  ".images/cards/standard/ace_of_hearts.png",
  ".images/cards/standard/ace_of_spades.png",
  ".images/cards/standard/jack_of_clubs.png",
  ".images/cards/standard/jack_of_diamonds.png",
  ".images/cards/standard/jack_of_hearts.png",
  ".images/cards/standard/jack_of_spades.png",
  ".images/cards/standard/queen_of_clubs.png",
  ".images/cards/standard/queen_of_diamonds.png",
  ".images/cards/standard/queen_of_hearts.png",
  ".images/cards/standard/queen_of_spades.png",
  ".images/cards/standard/king_of_clubs.png",
  ".images/cards/standard/king_of_diamonds.png",
  ".images/cards/standard/king_of_hearts.png",
  ".images/cards/standard/king_of_spades.png",
  ".images/cards/standard/back.png",
  ".images/cards/standard/back@2x.png",
  ".images/cards/standard/black_joker.png",
  ".images/cards/standard/red_joker.png"
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