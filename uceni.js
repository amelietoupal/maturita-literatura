/* Učení – doplňky stránky Literární historie (index.html):
   • jedna epocha najednou (výběr z dlaždic, předchozí / další), vyhledávání dál hledá ve všem
   • časová osa (česká × světová literatura), klik otevře kartu autora
   • karty k vybavování (jen jméno → odkrýt → ohodnotit; zapisuje do stávajícího sebehodnocení)
   • předem daná zvýraznění defaultně vypnutá (přepínač)
   • mobil: lišta se při posouvání dolů schová, tlačítko Poznámky je kulatá ikona
   Používá proměnné a funkce z hlavního skriptu index.html (ERAS, AUS, lvl, saveKnown, renderKnown, pov, povIn, md, esc…).
   Nová data jen pod novými klíči: lit-hist-view-v1, lit-hist-pre-v1. */
(function(){
const ls={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

/* ---------- 1) jedna epocha najednou ---------- */
const VKEY="lit-hist-view-v1";
const SECS=[...main.querySelectorAll(":scope > section")];
const secName=s=>s.querySelector("h2")?.textContent||s.id;
SECS.forEach((s,i)=>{
  const p=SECS[i-1],n=SECS[i+1],d=document.createElement("div");d.className="enav noprint";
  d.innerHTML=(p?`<button type="button" class="tbtn" data-sec="${p.id}">← ${esc(secName(p))}</button>`:"<span></span>")+(n?`<button type="button" class="tbtn" data-sec="${n.id}">${esc(secName(n))} →</button>`:"<span></span>");
  s.appendChild(d);
});
document.body.classList.add("one");
window.setSec=function(id,scroll){
  const s=document.getElementById(id);if(!s||!SECS.includes(s))return;
  SECS.forEach(x=>x.classList.toggle("cur",x===s));ls.set(VKEY,id);
  document.querySelectorAll("#ribbon a, #jump a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+id));
  if(scroll){const top=s.getBoundingClientRect().top+window.scrollY-(document.querySelector(".bar").offsetHeight||0)-8;window.scrollTo({top:Math.max(0,top)});}
};
// zobrazit epochu, ve které je daný prvek (poznámky, chyby z kvízu, obnovené úpravy, časová osa)
window.showEl=function(el){const s=el&&el.closest("#main > section");if(s&&!s.classList.contains("cur"))setSec(s.id);};
const start=(location.hash&&document.getElementById(location.hash.slice(1))&&SECS.includes(document.getElementById(location.hash.slice(1))))?location.hash.slice(1):ls.get(VKEY);
setSec(SECS.some(s=>s.id===start)?start:SECS[0].id);
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-sec]");if(b){setSec(b.dataset.sec,true);return;}
  const a=e.target.closest('#ribbon a[href^="#"], #jump a[href^="#"]');
  if(a){const id=a.getAttribute("href").slice(1);if(SECS.some(s=>s.id===id)){e.preventDefault();if(document.body.classList.contains("osa"))setView("main");if(qEl.value){qEl.value="";runSearch(false);}setSec(id,true);}}
},true);

// počet mých poznámek u každé epochy – aby bylo vidět, kde poznámky jsou, i když je zobrazená jen jedna epocha
function noteBadges(){
  const cnt={};Object.keys(notes).forEach(k=>{if(!notes[k])return;const e=noteEra(k);if(e)cnt[e]=(cnt[e]||0)+1;});
  document.querySelectorAll("#ribbon a, #jump a").forEach(a=>{const id=a.getAttribute("href").slice(1);let b=a.querySelector(".nbadge");
    if(!cnt[id]){if(b)b.remove();return;}if(!b){b=document.createElement("span");b.className="nbadge";a.appendChild(b);}b.textContent="📝 "+cnt[id];b.title=cnt[id]+" mých poznámek";});
}
const _rn=window.renderNotes;window.renderNotes=function(){_rn.apply(this,arguments);noteBadges();};
noteBadges();

/* ---------- 2) předem daná zvýraznění: defaultně vypnutá ---------- */
const PKEY="lit-hist-pre-v1";
window.PRE_ON=ls.get(PKEY)==="1";
const preBtn=document.getElementById("hlPreToggle");
function paintPreBtn(){if(preBtn){preBtn.textContent=PRE_ON?"🖍 Předem daná zvýraznění: zapnutá (vypnout)":"🖍 Předem daná zvýraznění: vypnutá (zapnout)";preBtn.setAttribute("aria-pressed",PRE_ON);}}
if(preBtn)preBtn.onclick=()=>{PRE_ON=!PRE_ON;ls.set(PKEY,PRE_ON?"1":"0");paintPreBtn();document.querySelectorAll("#main [data-hk]").forEach(el=>{if(!TE.has(el.dataset.hk))hlPaint(el);});};
paintPreBtn();

/* ---------- 3) mobil: lišta se schová při posouvání dolů ---------- */
let lastY=window.scrollY;
window.addEventListener("scroll",()=>{
  const y=window.scrollY,b=document.body;
  if(window.innerWidth>700||document.activeElement===qEl){b.classList.remove("barhide");lastY=y;return;}
  if(y>lastY+8&&y>220)b.classList.add("barhide");else if(y<lastY-8)b.classList.remove("barhide");
  if(Math.abs(y-lastY)>8)lastY=y;
},{passive:true});
document.getElementById("fab").setAttribute("aria-label","Poznámky");

/* ---------- 4) časová osa ---------- */
const CZ_G=/Česk|Májovci|Ruchovci|Lumírovci|buřič/;
const czech={};
ERAS.forEach(e=>{let cz=["obrozeni","cesk1","cesk2"].includes(e.id);e.au.forEach(a=>{if(a.g!==undefined&&!["obrozeni","cesk1","cesk2"].includes(e.id))cz=CZ_G.test(a.g);czech[a.n]=cz;});});
function span(d){
  const bc=/př\.\s*n\.\s*l/.test(d);let m;
  if((m=d.match(/(\d{1,4})\s*př\.\s*n\.\s*l\.\s*[–-]\s*(\d{1,4})/)))return [-m[1],+m[2]];
  if((m=d.match(/(\d{1,4})\s*[–-]\s*(?:po\s*)?(\d{1,4})/))){let a=+m[1],b=+m[2];if(bc){a=-a;b=-b;}return a<=b?[a,b]:[b,a];}
  if((m=d.match(/nar\.\s*(\d{4})/)))return [+m[1],new Date().getFullYear()];
  if((m=d.match(/(\d{1,2})\.\s*(?:[–-]\s*(\d{1,2})\.\s*)?st/))){const c1=+m[1],c2=m[2]?+m[2]:c1;return bc?[-c2*100,-(c1-1)*100]:[(c1-1)*100,c2*100];}
  if((m=d.match(/(\d{3,4})/))){let y=+m[1];if(bc)y=-y;return [y,y];}
  return null;
}
window.lifeSpan=span;
const Y0=-800,YB=1200,Y1=new Date().getFullYear()+5,K0=0.16,K1=4.2;
const X=y=>y<YB?(Math.max(y,Y0)-Y0)*K0:(YB-Y0)*K0+(y-YB)*K1;
const W=X(Y1)+40;
let built=false;
function buildOsa(){
  if(built)return;built=true;
  const rows={cz:[],sv:[]};
  ERAS.forEach(e=>e.au.forEach(a=>{const s=span(a.d);if(!s)return;rows[czech[a.n]?"cz":"sv"].push({a,e,s});}));
  const lanes=list=>{list.sort((p,q)=>p.s[0]-q.s[0]);const end=[];list.forEach(it=>{const x0=X(it.s[0]),x1=Math.max(X(it.s[1]),x0+5),lab=(it.a.n.length>22?(named(it.a)?it.a.n.split(" ").slice(-1)[0]:it.a.n.split(" ").slice(0,2).join(" ")+"…"):it.a.n);it.x0=x0;it.x1=x1;it.lab=lab;const w=Math.max(x1,x0+lab.length*6.6)+10;let l=end.findIndex(v=>v<=x0);if(l<0){l=end.length;end.push(0);}end[l]=w;it.l=l;});return end.length;};
  const nCz=lanes(rows.cz),nSv=lanes(rows.sv),LH=30;
  const ticks=[];[-800,-500,0,500,1000].forEach(y=>ticks.push(y));for(let y=1200;y<=Y1;y+=50)ticks.push(y);
  const tickHtml=ticks.map(y=>`<span class="tk${y>=YB&&y%100?" sm":""}" style="left:${X(y)}px">${y%100&&y>=YB?"":y<0?(-y)+" př. n. l.":y}</span>`).join("");
  const row=(list,n,cls,title)=>`<div class="orow ${cls}" style="height:${n*LH+36}px"><div class="olab">${title}</div>${list.map(it=>`<button type="button" class="obar" data-osa="${esc(it.a.n)}" title="${esc(it.a.n+" ("+it.a.d+") – "+it.e.name)}" style="left:${it.x0}px;top:${it.l*LH+30}px;--c:${it.e.c}"><span class="ol">${esc(it.lab)}</span><i style="width:${it.x1-it.x0}px"></i></button>`).join("")}</div>`;
  document.getElementById("osaIn").innerHTML=`<div class="oscroll"><div class="ocanvas" style="width:${W}px">
    <div class="oaxis">${tickHtml}</div>
    ${row(rows.cz,nCz,"cz","🇨🇿 Česká literatura")}${row(rows.sv,nSv,"sv","🌍 Světová literatura")}
    <div class="ogrid">${ticks.filter(y=>y<YB||y%100===0).map(y=>`<i style="left:${X(y)}px"></i>`).join("")}</div>
  </div></div>
  <div class="olg">${ERAS.map(e=>`<span><i style="background:${e.c}"></i>${esc(e.name)}</span>`).join("")}</div>`;
  const sc=document.querySelector("#osaIn .oscroll");sc.scrollLeft=X(1750)-40;
}
document.getElementById("osaIn").addEventListener("click",e=>{
  const b=e.target.closest("[data-osa]");if(!b)return;
  setView("main");const card=document.querySelector(`.au[data-au="${CSS.escape(b.dataset.osa)}"]`);if(!card)return;
  if(qEl.value){qEl.value="";runSearch(false);}
  document.getElementById("mAll").click();showEl(card);card.classList.remove("hide");
  requestAnimationFrame(()=>{card.scrollIntoView({block:"start"});window.scrollBy(0,-(document.querySelector(".bar").offsetHeight||0)-8);card.classList.add("flash");setTimeout(()=>card.classList.remove("flash"),1600);});
});
window.setView=function(v){
  const osa=v==="osa";document.body.classList.toggle("osa",osa);
  document.getElementById("osaView").hidden=!osa;
  document.querySelectorAll(".tabsnav [data-view]").forEach(a=>a.toggleAttribute("aria-current",a.dataset.view===(osa?"osa":"main")));
  if(osa){buildOsa();window.scrollTo({top:0});}
};
document.querySelectorAll(".tabsnav [data-view]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();setView(a.dataset.view);}));
if(location.hash==="#osa")setView("osa");

/* ---------- 5) karty k vybavování ---------- */
let C=null;
function cardsSetup(){
  povIn.innerHTML=povTop("Karty k vybavování")+`
  <p class="note" style="font-family:var(--sans)">Uvidíš jen <b>jméno</b>. Zkus si nahlas vybavit, kam autor patří a co napsal, pak kartu <b>odkryj</b> a poctivě se ohodnoť. Hodnocení se zapíše do „Jak mi jde tento autor“. Nejdřív přijdou ti, které ještě neumíš.</p>
  <label for="cScope">Z čeho</label>
  <select id="cScope"><option value="all">Všichni autoři</option><option value="todo">Jen ti, které ještě neumím</option><optgroup label="Epocha">${ERAS.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}</optgroup></select>
  <button class="pbtn go" id="cGo">Začít</button>`;
}
function cardsStart(scope){
  let list=AUS.filter(a=>scope==="all"||scope==="todo"?true:a.era===scope);
  if(scope==="todo")list=list.filter(a=>lvl[a.n]!=="ok");
  const rank=a=>({no:0,mid:1,undefined:2,ok:3})[lvl[a.n]];
  list=shuf(list).sort((p,q)=>rank(p)-rank(q));
  if(!list.length){povIn.innerHTML=povTop("Karty")+`<p>Tady už všechno umíš. 🎉</p><button class="ghost" id="cSetup">Zpět</button>`;return;}
  C={scope,list,i:0,res:{ok:0,mid:0,no:0}};cardShow(false);
}
// na kartě tvoje verze textu (psaní do textu i tvoje zvýraznění) a tvoje poznámky
const mine=a=>{const el=document.querySelector(`.au[data-au="${CSS.escape(a.n)}"] .tx`);return el?el.innerHTML:md(mainP(a.t));};
const wmine=(a,w)=>{const el=document.querySelector(`.wd[data-wkey="${CSS.escape("w:"+a.n+"|"+w[0])}"]`);return el?el.innerHTML:(w[4]?md(mainP(w[4])):"");};
const myNotes=a=>{const ks=["au:"+a.n,...a.w.map(w=>"w:"+a.n+"|"+w[0])].filter(k=>notes[k]);
  return ks.length?`<div class="fnote"><b>📝 Moje poznámky</b>${ks.map(k=>`<div><small>${k.startsWith("w:")?"k dílu "+esc(k.split("|").slice(1).join("|")):"k autorovi"}</small>${esc(notes[k])}</div>`).join("")}</div>`:"";};
function cardShow(open){
  const a=C.list[C.i],e=ERAS[a.ei];
  const works=a.w.map(w=>{const d=wmine(a,w);return `<li${w[3]?' class="k"':""}><i>${esc(w[0])}</i>${d?` – ${d}`:""}</li>`;}).join("");
  povIn.innerHTML=povTop("Karty k vybavování")+`
  <div class="meta"><span>${C.i+1} / ${C.list.length}</span><div class="tr"><div class="fl" style="width:${C.i/C.list.length*100}%"></div></div><span>${C.res.ok} ✓</span></div>
  <div class="fcard${open?" open":""}" style="--c:${e.c}">
    <div class="fk">${named(a)?"👤 Autor":"📖 Dílo"}</div><div class="fn">${esc(a.n)}</div>
    ${open?`<div class="fd">${esc(a.d)} · <b style="color:${e.c}">${esc(e.name)}</b></div><div class="ft">${mine(a)}</div>${a.w.length&&!(ANON.has(a.n)&&a.w.length===1)?`<ul class="fw">${works}</ul>`:""}${myNotes(a)}`:`<div class="fhint">Vybav si: epocha / směr · hlavní díla · čím je typický</div>`}
  </div>
  ${open?`<div class="frate"><span>Jak jsi to věděla?</span><button class="fbtn" data-cr="no">✗ neumím</button><button class="fbtn" data-cr="mid">~ napůl</button><button class="fbtn" data-cr="ok">✓ umím</button></div>`:`<button class="pbtn go" id="cOpen">Odkrýt kartu</button>`}`;
  (document.getElementById("cOpen")||povIn.querySelector("[data-cr]")).focus();
}
function cardRate(v){
  const a=C.list[C.i];lvl[a.n]=v;saveKnown();renderKnown();C.res[v]++;C.i++;
  if(C.i<C.list.length)return cardShow(false);
  povIn.innerHTML=povTop("Hotovo")+`<div class="score">${C.res.ok} / ${C.list.length}</div><p class="note" style="font-family:var(--sans)">✓ umím ${C.res.ok} · ~ napůl ${C.res.mid} · ✗ neumím ${C.res.no}. Hodnocení je uložené u autorů.</p><div class="row2"><button class="pbtn" id="cAgain">Další kolo</button><button class="ghost" id="cSetup">Změnit výběr</button></div>`;
}
document.getElementById("cards").addEventListener("click",()=>{pov.classList.add("open");document.body.style.overflow="hidden";cardsSetup();});
povIn.addEventListener("click",e=>{
  if(e.target.id==="cGo")return cardsStart(document.getElementById("cScope").value);
  if(e.target.id==="cOpen")return cardShow(true);
  const r=e.target.closest("[data-cr]");if(r)return cardRate(r.dataset.cr);
  if(e.target.id==="cAgain")return cardsStart(C.scope||"todo");
  if(e.target.id==="cSetup")return cardsSetup();
});
document.addEventListener("keydown",e=>{if(!pov.classList.contains("open")||!C)return;const o=document.getElementById("cOpen");if(o&&(e.key===" "||e.key==="Enter")){e.preventDefault();cardShow(true);}});
})();
