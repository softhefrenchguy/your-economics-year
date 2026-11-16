// Lets the site open from the home screen with no signal, showing the listings from the last
// visit. Everything tries the network first, so a new version shows up as soon as it's online.
// The one exception is the built JS, CSS and fonts in /assets/: they have a hash in their file
// names, so a saved copy never goes stale and can be served straight from the cache.
const CACHE = "your-economics-year-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// "index-AbC1-3_x.js" -> "index-*.js": the same file across deploys. The build's hash is
// always the last 8 characters before the extension, so "spectral-latin-700-normal-…" and
// "spectral-latin-800-normal-…" stay two different files.
const family = (url) => new URL(url).pathname.replace(/-[\w-]{8}(\.\w+)$/, "-*$1");

async function keep(key, response) {
  if (!response.ok) return;
  const cache = await caches.open(CACHE);
  await cache.put(key, response);
  // A new build replaces the old one, so the cache doesn't grow with every update.
  const url = typeof key === "string" ? key : key.url;
  if (!url.includes("/assets/")) return;
  for (const old of await cache.keys()) {
    if (old.url !== url && family(old.url) === family(url)) await cache.delete(old);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Saved under the bare address, so a shared ?listing= link still opens offline.
    const page = new URL(self.registration.scope).href;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if ((response.headers.get("content-type") ?? "").includes("text/html")) event.waitUntil(keep(page, response.clone()));
          return response;
        })
        .catch(() => caches.match(page).then((hit) => hit ?? Response.error())),
    );
    return;
  }

  const fromNetwork = () =>
    fetch(request).then((response) => {
      event.waitUntil(keep(request, response.clone()));
      return response;
    });
  event.respondWith(
    new URL(request.url).pathname.includes("/assets/")
      ? caches.match(request).then((hit) => hit ?? fromNetwork())
      : fromNetwork().catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
