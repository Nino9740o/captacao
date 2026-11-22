const CACHE="captacao-v6";
const ARQ=["./","./index.html","./p.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQ)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE&&n!=="captacao-dados").map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin||u.pathname.endsWith("/__cobrancas"))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});

/* aviso diário de cobranças (Chrome Android com o app instalado) */
function hoje(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
async function checarCobrancas(){
  const c=await caches.open("captacao-dados");
  const ult=await c.match("./__avisado");
  if(ult&&(await ult.text())===hoje())return;
  const r=await c.match("./__cobrancas");if(!r)return;
  const lista=await r.json();
  const n=lista.filter(d=>d&&d<=hoje()).length;
  if(!n)return;
  await c.put("./__avisado",new Response(hoje()));
  await self.registration.showNotification("Captação",{body:n===1?"Você tem 1 lead para cobrar hoje.":`Você tem ${n} leads para cobrar hoje.`,icon:"icon-192.png",badge:"icon-192.png",tag:"cobrar"});
  if(self.navigator&&navigator.setAppBadge)try{await navigator.setAppBadge(n)}catch(e){}
}
self.addEventListener("periodicsync",e=>{if(e.tag==="cobrancas")e.waitUntil(checarCobrancas())});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{for(const w of ws){if("focus" in w)return w.focus()}return clients.openWindow("./")}));
});
