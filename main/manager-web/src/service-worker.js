/* global self, workbox */

// [text]Service Worker[text]
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// CDN[text]
const CDN_CSS = [
  'https://unpkg.com/element-ui@2.15.14/lib/theme-chalk/index.css',
  'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css'
];

const CDN_JS = [
  'https://unpkg.com/vue@2.6.14/dist/vue.min.js',
  'https://unpkg.com/vue-router@3.6.5/dist/vue-router.min.js',
  'https://unpkg.com/vuex@3.6.2/dist/vuex.min.js',
  'https://unpkg.com/element-ui@2.15.14/lib/index.js',
  'https://unpkg.com/axios@0.27.2/dist/axios.min.js',
  'https://unpkg.com/opus-decoder@0.7.7/dist/opus-decoder.min.js'
];

// [text]Service Worker[text]manifest[text]
const manifest = self.__WB_MANIFEST || [];

// [text]CDN[text]
const isCDNEnabled = manifest.some(entry => 
  entry.url === 'cdn-mode' && entry.revision === 'enabled'
);

console.log(`Service Worker initialized, CDN mode: ${isCDNEnabled ? 'enabled' : 'disabled'}`);

// [text]workbox[text]
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
workbox.setConfig({ debug: false });

// [text]workbox
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// [text]
const OFFLINE_URL = '/offline.html';
workbox.precaching.precacheAndRoute([
  { url: OFFLINE_URL, revision: null }
]);

// [text]，[text]
self.addEventListener('install', event => {
  if (isCDNEnabled) {
    console.log('Service Worker installed, caching CDN resources');
  } else {
    console.log('Service Worker installed, CDN disabled, caching local resources only');
  }
  
  // [text]
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(OFFLINE_URL);
    })
  );
});

// [text]
self.addEventListener('activate', event => {
  console.log('Service Worker activated, now controlling pages');
  
  // [text]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // [text]
          return cacheName.startsWith('workbox-') && !workbox.core.cacheNames.runtime.includes(cacheName);
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// [text]fetch[text]，[text]CDN[text]
self.addEventListener('fetch', event => {
  // [text]CDN[text]CDN[text]
  if (isCDNEnabled) {
    const url = new URL(event.request.url);
    
    // [text]CDN[text]，[text]
    if ([...CDN_CSS, ...CDN_JS].includes(url.href)) {
      // [text]fetch[text]，[text]
      console.log(`请求CDN资源: ${url.href}`);
    }
  }
});

// [text]CDN[text]CDN[text]
if (isCDNEnabled) {
  // [text]CDN[text]CSS[text]
  workbox.routing.registerRoute(
    ({ url }) => CDN_CSS.includes(url.href),
    new workbox.strategies.CacheFirst({
      cacheName: 'cdn-stylesheets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 365 * 24 * 60 * 60, // 增加到1年缓// [comment]1[comment]
          maxEntries: 10, // Max entriesCSS文// [comment]10[comment]CSS[comment]
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200], // Cache duration// [comment]
        }),
      ],
    })
  );

  // [text]CDN[text]JS[text]
  workbox.routing.registerRoute(
    ({ url }) => CDN_JS.includes(url.href),
    new workbox.strategies.CacheFirst({
      cacheName: 'cdn-scripts',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 365 * 24 * 60 * 60, // 增加到1年缓// [comment]1[comment]
          maxEntries: 20, // Max entriesJS文// [comment]20[comment]JS[comment]
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200], // Cache duration// [comment]
        }),
      ],
    })
  );
}

// [text]CDN[text]，[text]
workbox.routing.registerRoute(
  /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2|eot|ttf|otf)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7天缓// 7[comment]
        maxEntries: 50, // Max entries// [comment]50[comment]
      }),
    ],
  })
);

// [text]HTML[text]
workbox.routing.registerRoute(
  /\.html$/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 1 * 24 * 60 * 60, // 1天缓// 1[comment]
        maxEntries: 10, // Max entriesHTML文// [comment]10[comment]HTML[comment]
      }),
    ],
  })
);

// [text] - [text]
workbox.routing.setCatchHandler(async ({ event }) => {
  // [text]
  switch (event.request.destination) {
    case 'document':
      // [text]，[text]
      return caches.match(OFFLINE_URL);
    default:
      // [text]
      return Response.error();
  }
}); 