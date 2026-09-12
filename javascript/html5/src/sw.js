/**
 * Service Worker for Max Adder PWA
 * Handles offline functionality and asset caching
 */

const CACHE_NAME = "max-adder-v1";
const urlsToCache = [
	"./",
	"./index.html",
	"./manifest.json",
	"./css/index.css",
	"./js/board.js",
	"./js/common.js",
	"./js/controller.js",
	"./js/hmi.js",
	"./js/renderer.js",
	"./js/store.js",
	"./js/uct/uct.js",
	"./js/uct/uctnode.js",
	"./img/icons/favicon.ico",
	"./img/icons/icon-bars.svg",
	"./img/icons/icon-delete.svg",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache).catch((err) => {
				console.warn("Cache addAll error:", err);
				// Continue even if some files fail to cache
				return Promise.resolve();
			});
		}),
	);
	self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
					return null;
				}),
			);
		}),
	);
	self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
	// Only handle GET requests
	if (event.request.method !== "GET") {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((response) => {
			// Return cached response if available
			if (response) {
				return response;
			}

			// Try to fetch from network
			return fetch(event.request)
				.then((response) => {
					// Don't cache if not a successful response
					if (response?.status !== 200 || response?.type === "error") {
						return response;
					}

					// Clone and cache successful responses
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache).catch((err) => {
							console.warn("Cache put error:", err);
						});
					});

					return response;
				})
				.catch(() => {
					// Return cached version if network fails
					return caches.match(event.request);
				});
		}),
	);
});
