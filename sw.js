const CACHE='udanish-v22-openmetriclab-20260814';
const CORE=['/software/linear-lens/','/assets/css/linear-lens-v21.css','/assets/js/linear-lens-engine.js','/assets/js/linear-lens-app.js',
  '/software.html','/software/core-norm/','/assets/css/software-v19.css','/assets/data/software.json','/assets/js/software-catalog.js','/assets/js/core-norm-evidence.js',
  '/assets/js/core-norm-engine.js','/assets/js/core-norm-app.js',
  '/assets/css/research-service-v17-3.css',
  '/assets/js/daily-knowledge-v16.js',
  '/assets/css/daily-knowledge-v16.css',
  '/assets/css/trending-v15-1.css',
  '/assets/js/trending-v15-1.js','/','/index.html','/research.html','/publications.html','/teaching.html','/about.html','/contact.html','/news.html','/collaborators.html','/cv.html','/assets/css/site.css','/assets/css/v11-academic.css',
  '/assets/css/mobile-v13-1.css','/assets/css/live-v14.css','/assets/js/site.js','/assets/js/impact.js','/assets/js/publications.js','/assets/js/live-v14.js','/assets/js/reactions-v15.js','/assets/data/publications.json','/assets/data/search-index.json','/assets/images/formal-headshot.webp','/assets/papers/pgmn.pdf'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;if(e.request.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.includes('/assets/data/')){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html'))));return}e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}))) });