/* Psaní přímo do textu – sdílené pro index.html i rozbory.html.
   Každý upravitelný text má atribut data-hk (stejný klíč jako zvýrazňovač).
   Upravený text se ukládá jako očištěné HTML (včetně zvýraznění) do localStorage. */
(function(){
  const ALLOW=new Set(["B","STRONG","I","EM","MARK","BR","UL","OL","LI","DIV","P","SPAN","SMALL","CODE","SUB","SUP","U","S"]);
  function clean(src){
    const box=document.createElement("div");box.innerHTML=src.innerHTML;
    (function walk(n){[...n.childNodes].forEach(c=>{
      if(c.nodeType===3)return;
      if(c.nodeType!==1){c.remove();return;}
      walk(c);
      const uhl=c.tagName==="SPAN"&&c.classList.contains("uhl");
      if(!ALLOW.has(c.tagName)||(c.tagName==="SPAN"&&!uhl)){c.replaceWith(...c.childNodes);return;}
      [...c.attributes].forEach(a=>{if(!(uhl&&(a.name==="class"||a.name==="data-id")))c.removeAttribute(a.name);});
      if(uhl)c.classList.remove("sel");
    });})(box);
    return box.innerHTML;
  }
  const plain=h=>{const d=document.createElement("div");d.innerHTML=h;return d.textContent.replace(/\s+/g," ").trim();};
  window.TextEdit={
    init(o){
      const T=this;T.o=o;T.orig={};T.byKey={};
      try{T.edits=JSON.parse(localStorage.getItem(o.key)||"{}")||{};}catch(e){T.edits={};}
      o.els.forEach(el=>{const k=el.dataset.hk;T.byKey[k]=el;T.orig[k]=el.innerHTML;});
      Object.keys(T.edits).forEach(k=>{const el=T.byKey[k];if(el){el.innerHTML=T.edits[k];el.classList.add("edited");}});
      // ovládací lišta
      const bar=document.createElement("div");bar.className="edbar";bar.hidden=true;
      bar.innerHTML=`<span>✎ Píšeš do textu – klepni do odstavce a piš, ukládá se samo.</span><button data-rev>↺ Původní text odstavce</button><button data-done>Hotovo</button>`;
      document.body.appendChild(bar);T.bar=bar;
      bar.addEventListener("mousedown",e=>e.preventDefault());
      bar.addEventListener("click",e=>{
        if(e.target.closest("[data-done]"))return T.toggle(false);
        if(e.target.closest("[data-rev]")){
          const el=T.last;if(!el)return alert("Nejdřív klepni do odstavce, který chceš vrátit.");
          if(!T.edits[el.dataset.hk])return;
          if(!confirm("Vrátit tento odstavec do původní podoby? Tvoje úpravy v něm se smažou."))return;
          T.revert(el);
        }
      });
      let tmr;
      o.els.forEach(el=>{
        el.addEventListener("input",()=>{T.last=el;clearTimeout(tmr);tmr=setTimeout(()=>T.save(el),400);});
        el.addEventListener("focus",()=>{T.last=el;});
        el.addEventListener("paste",e=>{if(!T.on)return;e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData("text");document.execCommand("insertText",false,t);});
      });
      o.btn.addEventListener("click",()=>T.toggle(!T.on));
      return T;
    },
    has(k){return !!this.edits[k];},
    save(el){
      const k=el.dataset.hk,h=clean(el);
      if(plain(h)===plain(this.orig[k])){delete this.edits[k];el.classList.remove("edited");} // text je zase původní
      else{this.edits[k]=h;el.classList.add("edited");}
      this.store();
    },
    revert(el){
      const k=el.dataset.hk;delete this.edits[k];el.innerHTML=this.orig[k];el.classList.remove("edited");this.store();
      if(this.o.onRevert)this.o.onRevert(el);
    },
    store(){try{localStorage.setItem(this.o.key,JSON.stringify(this.edits));}catch(e){alert("Prohlížeč nepovolil uložení úprav.");}},
    toggle(on){
      this.on=on;document.body.classList.toggle("psani",on);this.bar.hidden=!on;
      this.o.btn.setAttribute("aria-pressed",on);this.o.btn.textContent=on?"✓ Hotovo s psaním":"✎ Psát do textu";
      this.o.els.forEach(el=>{if(on)el.setAttribute("contenteditable","true");else el.removeAttribute("contenteditable");});
      if(on&&this.o.onStart)this.o.onStart();
      if(!on){getSelection().removeAllRanges();}
    },
    count(){return Object.keys(this.edits).length;}
  };
})();
