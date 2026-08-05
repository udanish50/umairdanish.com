const CACHE='udanish-v8-fixed-20260805';
const SHELL=[
  '/',
  '/research.html',
  '/publications.html',
  '/news.html',
  '/teaching.html',
  '/collaborators.html',
  '/cv.html',
  '/contact.html',
  '/assets/css/site.css',
  '/assets/js/site.js',
  '/assets/css/collaborators-v5.css',
  '/assets/js/collaborators-v5.js',
  '/assets/js/impact.js',
  '/assets/js/publications.js',
  '/assets/data/publications.json',
  '/assets/data/scholar-metrics.json',
  '/assets/images/graduation-hero-mobile.webp'
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request).then(response=>response||caches.match('/404.html')))
  );
});
