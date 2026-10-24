/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[];
};

/* Built output, the prefecture boundaries and icons, precached by hash. */
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

/* Navigations: network first with a 3 s limit, then the cached shell. Other
   origins (map tiles, the API) are not handled here: data caching lives in
   the app, in one place. */
const shell = createHandlerBoundToURL('index.html');
const network = new NetworkFirst({ cacheName: 'yunabi-pages', networkTimeoutSeconds: 3 });
registerRoute(
  new NavigationRoute(async (opts) => {
    try {
      return await network.handle(opts);
    } catch {
      return shell(opts);
    }
  }),
);

/* Upgrading from v1.3 (its caches are named yui-*): take over at once rather
   than asking to reload into the version already on screen. v1.3 was never
   deployed and the app now has its own origin (ADR-0025), so this is a
   harmless no-op kept for the code-level compatibility rule (Y-B3). */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => {
      if (ks.some((k) => k.startsWith('yui-'))) return self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (e) => {
  /* v1.3 caches (yui-v1 … yui-v6) */
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(ks.filter((k) => k.startsWith('yui-')).map((k) => caches.delete(k))),
      ),
  );
});

self.addEventListener('message', (e) => {
  if ((e.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
