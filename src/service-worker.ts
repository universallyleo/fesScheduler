/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const worker = globalThis as unknown as ServiceWorkerGlobalScope;
const cacheName = `live-fes-${version}`;
const assets = [...build, ...files];

worker.addEventListener('install', (event) => {
	event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
			)
	);
});

worker.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') void worker.skipWaiting();
});

worker.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	event.respondWith(
		caches.match(event.request).then(
			(cached) =>
				cached ??
				fetch(event.request).then((response) => {
					if (response.ok)
						void caches.open(cacheName).then((cache) => cache.put(event.request, response.clone()));
					return response;
				})
		)
	);
});
