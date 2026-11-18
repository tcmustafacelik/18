/* 18 · çevrimdışı açılış: uygulamanın kendisi ve kütüphaneler telefonda saklanır.
   Veriler (GitHub API) asla önbelleğe alınmaz; onlar zaten uygulamanın kendi cihaz deposunda durur. */
const AD = "tsk-arsiv-v15";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(AD).then(c => c.addAll(["./", "./manifest.webmanifest", "./icon-m18-192.png", "./kisayol2-soru.png", "./kisayol2-antk.png", "./fonts/LiberationSerif-Regular.ttf", "./fonts/LiberationSerif-Bold.ttf", "./fonts/LiberationSans-Regular.ttf", "./fonts/LiberationSans-Bold.ttf"])).catch(() => {})); });
self.addEventListener("activate", e => e.waitUntil((async () => { for(const k of await caches.keys()) if(k !== AD) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return; const u = new URL(r.url);
  if(u.hostname === "api.github.com") return;
  if(u.origin === location.origin && /\/(fonts|yazi)\/[^/]+\.ttf$/.test(u.pathname)){   // yazı tipleri değişmez: önce saklanan
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if(res.ok){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; }))); return; }
  if(u.origin === location.origin && r.mode === "navigate"){   /* sayfa: telefonda saklanan kopya HEMEN açılır; yeni sürüm arka planda iner.
       İnince açık sayfaya "yeni-surum" haberi gider (sayfa "Yeni sürüm hazır · Yenile" gösterir). Saklanan yoksa internetten gelir. */
    e.respondWith((async () => {
      /* S793: telefon depolaması 2,5 sn içinde yanıt vermezse saklanan kopya beklenmez, sayfa internetten açılır */
      const bekle = (p, ms) => Promise.race([p, new Promise(z => setTimeout(() => z(null), ms))]);
      const c = await bekle(caches.open(AD), 2500), m = c ? await bekle(c.match("./"), 2500) : null;
      if(!c) return fetch(r, { cache: "no-cache" }).catch(() => new Response("Bağlantı yok", { status: 503 }));
      const ag = fetch(r, { cache: "no-cache" }).then(async res => {
        if(res.ok && res.type === "basic"){ const eT = m && (m.headers.get("etag") || m.headers.get("last-modified")), yT = res.headers.get("etag") || res.headers.get("last-modified");
          const kopya = res.clone();   /* saklama arka planda: depolama yavaşsa sayfa onu beklemez */
          e.waitUntil(c.put("./", kopya).then(async () => { if(m && eT && yT && eT !== yT){ for(const k of await self.clients.matchAll({ type: "window" })) k.postMessage({ tip: "yeni-surum" }); } }).catch(() => {})); }
        return res; });
      if(m){ e.waitUntil(ag.catch(() => {})); return m; }
      return ag.catch(() => caches.match("./"));
    })()); return; }
  if(u.origin === location.origin){   // önce internet, yoksa saklanan
    e.respondWith(fetch(r, { cache: "no-cache" }).then(res =>   /* tarayıcı önbelleğindeki eski sürümü değil, sunucudakini al */ { if(res.ok && !u.search){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./"))));
    return; }
  if(/(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)){   // kütüphaneler: önce saklanan
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if(res.ok || res.type === "opaque"){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; }))); }
});

/* bulut bildirimi (S766): özel depodaki zamanlanmış görev gönderir; uygulama kapalıyken de gelir */
self.addEventListener("push", e => { let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = { b: "18", m: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.b || "18", { body: d.m || "", tag: d.tag || "18", icon: "icon-m18-192.png", badge: "icon-m18-192.png", data: { url: d.url || "./" } })); });
self.addEventListener("notificationclick", e => { e.notification.close(); const hedef = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil((async () => { const L = await self.clients.matchAll({ type: "window", includeUncontrolled: true }); for(const c of L){ if("navigate" in c){ try { await c.navigate(hedef); } catch(x){} } if("focus" in c) return c.focus(); } return self.clients.openWindow(hedef); })()); });
