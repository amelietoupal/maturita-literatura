/* Předem daná zvýraznění nejdůležitějších pojmů.
   Pojmy označené v datech **takto** se vykreslí jako <span class="pre"> a při prvním otevření se z nich
   stanou běžná zvýraznění zvýrazňovače (žlutá, pre:1) – dají se klepnutím přebarvit nebo odebrat.
   Každý odstavec se „osemení“ jen jednou, takže odebrané zvýraznění se už nevrátí. */
window.PreHL={
  seed(els,hls,seedKey,cap){
    let seeded={};try{seeded=JSON.parse(localStorage.getItem(seedKey)||"{}")||{};}catch(e){}
    let changed=false;
    els.forEach(el=>{
      const k=el.dataset.hk,pres=[...el.querySelectorAll(".pre")];
      if(!pres.length)return;
      if(!seeded[k]){
        if(!(hls[k]&&hls[k].length)){ // kde už má uživatelka vlastní zvýraznění, nic nepřidávat
          const list=pres.slice(0,cap(el)).map((p,i)=>{const r=document.createRange();r.selectNodeContents(el);r.setEndBefore(p);const s=r.toString().length;
            return {s,e:s+p.textContent.length,c:"y",id:"p"+i+Math.random().toString(36).slice(2,7),pre:1};});
          hls[k]=list;changed=true;
        }
        seeded[k]=1;
      }
      pres.forEach(p=>p.replaceWith(...p.childNodes));el.normalize();
    });
    document.querySelectorAll(".pre").forEach(p=>p.replaceWith(...p.childNodes));
    try{localStorage.setItem(seedKey,JSON.stringify(seeded));}catch(e){}
    return changed;
  },
  removePresets(hls){Object.keys(hls).forEach(k=>{hls[k]=hls[k].filter(h=>!h.pre);if(!hls[k].length)delete hls[k];});},
  resetSeed(seedKey){try{localStorage.removeItem(seedKey);}catch(e){}}
};
