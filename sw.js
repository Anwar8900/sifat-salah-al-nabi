/* Service worker — offline support for صفة صلاة النبي */
var CACHE = "salat-v1.7.0";
var VER = "1.7.0";
var CORE = [
  "./",
  "./index.html",
  "./404.html",
  "./ar/", "./ar/index.html", "./ar/salah.html", "./ar/adhkar.html", "./ar/sunan.html",
  "./assets/css/style.css?v=" + VER,
  "./assets/css/fonts.css?v=" + VER,
  "./assets/js/app.js?v=" + VER,
  "./manifest.webmanifest",
  "./assets/img/logo-header.png",
  "./assets/img/logo-256.png",
  "./assets/img/icon-32.png",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/icon-maskable.png",
  "./assets/img/apple-touch-icon.png",
  "./assets/img/masjid-night.jpg",
  "./assets/img/masjid-chandelier.jpg",
  "./assets/img/calligraphy-muhammad.jpg",
  "./assets/img/masjid-calligraphy.jpg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(CORE.map(function (u) {
        return c.add(u).catch(function () { /* ignore individual failures */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        // refresh in the background (stale-while-revalidate)
        fetch(req).then(function (res) {
          if (res && res.ok) caches.open(CACHE).then(function (c) { c.put(req, res.clone()); });
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.ok && (res.type === "basic" || res.type === "default")) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === "navigate") {
          var lang = (url.pathname.match(/\/(ar|en|ur)\//) || [])[1];
          var fallback = lang ? "./" + lang + "/index.html" : "./index.html";
          return caches.match(fallback).then(function (f) {
            return f || caches.match("./index.html");
          });
        }
      });
    })
  );
});
