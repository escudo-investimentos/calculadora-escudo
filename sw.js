// Service worker simples: deixa o app abrir mesmo sem internet,
// depois da primeira visita (cache local no aparelho).
var CACHE = 'calculadora-aplicacoes-v2';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(FILES); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  // Só cuida dos arquivos do próprio site. Chamadas para o Firebase/Firestore
  // (login, dados) sempre vão direto pra rede, nunca pelo cache.
  if(event.request.url.indexOf(self.location.origin) !== 0) return;
  // Sempre tenta a rede primeiro, pra nunca ficar preso numa versão antiga
  // salva no aparelho. Só usa o que tem salvo se estiver sem internet.
  event.respondWith(
    fetch(event.request).then(function(resp){
      var copy = resp.clone();
      caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
      return resp;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
