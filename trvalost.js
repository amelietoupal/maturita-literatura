/* Trvalost – aby se poznámky, psaní do textu a zvýraznění neztrácely, když se obsah stránky upraví.
   Sdílené pro index.html i rozbory.html. Spouští se při načtení stránky dřív, než stránka uložená data přečte.

   Jak to funguje:
   • Každý odstavec má klíč (data-hk). Ke každému klíči si pamatujeme, jak jeho text vypadal minule („otisk“).
   • Když se text při aktualizaci posune jinam (nový odstavec před ním), najde se podle otisku a data se přesunou s ním.
   • Když se text změní, zvýraznění se znovu najdou podle zvýrazněných slov; tvoje psaní do textu zůstane
     a u odstavce se ukáže, že existuje nová verze.
   • Co nejde bezpečně přiřadit (např. úpravy ze starších verzí stránky), se nikdy nesmaže – přesune se do
     „Obnovených úprav“ a ukáže se u nejpodobnějšího odstavce i v seznamu u zálohy.
   • Jednou denně se před čímkoli dalším uloží automatická záloha všech dat (posledních 7 dní). */
(function(){
  const today=()=>new Date().toISOString().slice(0,10);
  const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}};
  const plain=h=>{const d=document.createElement("div");d.innerHTML=h;return d.textContent.replace(/\s+/g," ").trim();};
  const words=s=>s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(w=>w.length>2);
  // jak velká část slov současného textu je obsažena v (starší) upravené verzi – 1 = celý text tam je
  function sim(curText,editPlain){const a=words(curText);if(!a.length)return 0;const b=new Set(words(editPlain));return a.filter(w=>b.has(w)).length/a.length;}
  // podobnost dvou textů (společná slova / všechna slova) – aby krátká políčka nevyhrávala jen tím, že jsou krátká
  function jac(x,y){const a=new Set(words(x)),b=new Set(words(y));if(!a.size||!b.size)return 0;let n=0;a.forEach(w=>{if(b.has(w))n++;});return n/(a.size+b.size-n);}
  const AUTO="maturita-auto-zaloha-v1";

  window.Trvalost={
    /* o: {id, els, text:klíč úprav textu, hl:klíč zvýraznění, alias(k,cur)→klíč|null, notes:[{key,valid:Set}], keys:[klíče pro automatickou zálohu]} */
    run(o){
      this.o=o;
      // 1) automatická záloha (jednou denně, před jakoukoli změnou)
      try{
        const snaps=load(AUTO,[]),data={};
        (o.keys||[]).forEach(k=>{const v=localStorage.getItem(k);if(v!==null)data[k]=JSON.parse(v);});
        const js=JSON.stringify(data),last=snaps[snaps.length-1];
        if(Object.keys(data).length&&(!last||JSON.stringify(last.data)!==js)){
          if(last&&last.d===today())snaps.pop();
          snaps.push({d:today(),data});while(snaps.length>7)snaps.shift();
          if(!save(AUTO,snaps)){snaps.splice(0,snaps.length-2);save(AUTO,snaps);}
        }
      }catch(e){}
      const FP=o.id+"-otisky-v1",RC=o.id+"-obnova-v1",UPD=o.id+"-aktualizovano-v1";
      const cur={};o.els.forEach(el=>{cur[el.dataset.hk]=el.textContent;});
      const prev=load(FP,{}),rec=load(RC,[]),upd=load(UPD,{});
      const free=k=>k in cur;
      const byText=t=>Object.keys(cur).filter(k=>cur[k]===t);
      const pre=k=>k.split(/[-:]/)[0]; // stejná kniha / epocha má při shodě přednost
      const best=(editPlain,skip,from)=>{let bk=null,bs=0;Object.keys(cur).forEach(k=>{if(skip.has(k))return;const s=jac(cur[k],editPlain)+(from&&pre(k)===pre(from)?0.05:0);if(s>bs){bs=s;bk=k;}});return bs>=0.35?bk:null;};

      // 2) psaní do textu
      const edits=load(o.text,{}),newE={},taken=new Set(),later=[];
      Object.keys(edits).forEach(k=>{
        if(free(k)&&(prev[k]===undefined||prev[k]===cur[k])){newE[k]=edits[k];taken.add(k);}
        else later.push(k);
      });
      later.forEach(k=>{
        const h=edits[k];let t=null,how="";
        if(prev[k]!==undefined){const c=byText(prev[k]).filter(x=>!taken.has(x));if(c.length){t=c[0];how="moved";}}
        if(!t&&prev[k]!==undefined&&free(k)&&!taken.has(k)){t=k;how="changed";}
        if(t){newE[t]=h;taken.add(t);if(how==="changed")upd[t]=1;return;}
        // starší verze stránky – nikdy nemazat, dát do obnovených úprav u nejpodobnějšího odstavce
        let to=o.alias?o.alias(k,cur):null;if(to&&!free(to))to=null;
        if(!to)to=best(plain(h),new Set(),k);
        if(!rec.some(r=>r.from===k&&r.h===h))rec.push({type:"text",from:k,to,h,d:today()});
      });
      save(o.text,newE);
      Object.keys(upd).forEach(k=>{if(!newE[k])delete upd[k];});

      // 3) zvýraznění – posunout s textem nebo znovu najít podle slov
      const hls=load(o.hl,{}),newH={};
      Object.keys(hls).forEach(k=>{
        const list=hls[k]||[];
        if(free(k)&&(prev[k]===undefined||prev[k]===cur[k])){newH[k]=(newH[k]||[]).concat(list);return;}
        if(prev[k]===undefined){rec.push({type:"hl",from:k,list,d:today(),hidden:1});return;} // bez otisku nejde bezpečně umístit
        const old=prev[k],moved=byText(old);
        if(moved.length){newH[moved[0]]=(newH[moved[0]]||[]).concat(list);return;}
        const out=[];
        list.forEach(h=>{
          const x=old.slice(h.s,h.e);let tk=null,pos=-1;
          const tryK=kk=>{if(!free(kk)||!x.trim())return false;const txt=cur[kk];let p=txt.indexOf(x),bestp=-1;while(p!==-1){if(bestp===-1||Math.abs(p-h.s)<Math.abs(bestp-h.s))bestp=p;p=txt.indexOf(x,p+1);}if(bestp<0)return false;tk=kk;pos=bestp;return true;};
          if(tryK(k)||(o.alias&&tryK(o.alias(k,cur)||""))){(newH[tk]=newH[tk]||[]).push({...h,s:pos,e:pos+x.length});}
          else out.push({...h,x});
        });
        const mine=out.filter(h=>!h.pre); // předem daná zvýraznění nejsou tvoje – ta se jen tiše zahodí
        if(mine.length)rec.push({type:"hl",from:k,to:free(k)?k:(o.alias?o.alias(k,cur):null),list:mine,d:today()});
      });
      save(o.hl,newH);

      // 4) poznámky – když jejich místo zmizí, přesunout do obnovených (nikdy nesmazat)
      (o.notes||[]).forEach(n=>{
        const st=load(n.key,{});let ch=false;
        Object.keys(st).forEach(k=>{if(!n.valid.has(k)&&st[k]){rec.push({type:"note",from:k,h:st[k],store:n.key,d:today()});delete st[k];ch=true;}});
        if(ch)save(n.key,st);
      });

      save(FP,cur);save(RC,rec);save(UPD,upd);
      this.rec=rec;this.upd=upd;this.RC=RC;this.UPD=UPD;
    },

    /* po načtení úprav textu: ukázat obnovené úpravy u odstavců a upozornění na novou verzi textu */
    show(o){
      const T=this,TE=o.TE,label=o.label||(()=>"");
      if(!document.getElementById("trv-css")){const st=document.createElement("style");st.id="trv-css";st.textContent=`
.trv{margin:8px 0;padding:9px 12px;border:1px dashed #C9A227;border-radius:10px;background:rgba(255,214,90,.12);font-family:var(--sans,system-ui);font-size:13.5px;line-height:1.45}
.trv b{font-weight:600}.trv .tt{margin:6px 0;font-family:var(--serif,Georgia,serif);font-size:15px}.trv ins{background:rgba(70,190,120,.3);text-decoration:none;border-radius:3px;padding:0 2px}
.trv button{margin:4px 6px 0 0;border:1px solid var(--rule,#ccc);background:var(--card,#fff);color:var(--ink,#222);border-radius:999px;padding:4px 10px;font:inherit;font-size:13px;cursor:pointer}
.trv .sm{color:var(--muted,#666);font-size:12.5px}.trv-list .trv{margin:10px 0}`;document.head.appendChild(st);}
      const where=el=>el.closest("table,ul,ol")||el;
      const diff=(h,base)=>{ // zeleně části upravené verze, které v současném textu nejsou
        const a=plain(h).split(/(\s+)/),bw=new Set(words(base||""));
        return a.map(w=>{const ws=words(w);return ws.length&&ws.some(x=>!bw.has(x))?`<ins>${esc(w)}</ins>`:esc(w);}).join("");
      };
      const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
      document.querySelectorAll(".trv").forEach(x=>x.remove());
      const hlx=r=>r.type==="hl"?(r.list||[]).filter(h=>h.x&&h.x.trim()&&!h.pre):[];
      const show1=r=>!r.hidden||hlx(r).length>0; // i dříve schovaná zvýraznění, u kterých známe zvýrazněná slova
      const target=r=>{const k=r.to||r.from,hit=k&&document.querySelector(`[data-hk="${CSS.escape(k)}"]`);if(hit)return hit;const a=T.o&&T.o.alias&&r.from?T.o.alias(r.from,Object.fromEntries([...document.querySelectorAll("[data-hk]")].map(e=>[e.dataset.hk,1]))):null;return a?document.querySelector(`[data-hk="${CSS.escape(a)}"]`):null;};
      const box=(r,i)=>{
        const el=r.type==="hl"?target(r):r.to&&document.querySelector(`[data-hk="${CSS.escape(r.to)}"]`);
        const d=document.createElement("div");d.className="trv";d.dataset.ri=i;
        if(r.type==="hl"){d.innerHTML=`<b>🖍 Tvoje zvýraznění ze starší verze ${el?"tohoto textu":"textu"}</b> <span class="sm">– text se mezitím změnil a tato slova v něm už nejsou na stejném místě, tak je tu máš vypsaná:</span><div class="tt">${hlx(r).map(h=>`<mark class="uhl ${esc(h.c||"y")}">${esc(h.x)}</mark>`).join(" · ")}</div><button data-trv-del>Smazat</button>`;return [d,el];}
        d.innerHTML=r.type==="note"?`<b>🛟 Obnovená poznámka</b> <span class="sm">(její původní místo na stránce už neexistuje – ${esc(r.from)})</span><div class="tt">${esc(r.h)}</div><button data-trv-del>Smazat</button>`
          :`<b>🛟 Obnovená dřívější úprava${el?" tohoto textu":""}</b> <span class="sm">– psala jsi ji do starší verze stránky (obnoveno ${esc(r.d)}). <ins>Zeleně</ins> je to, co v současném textu není – nejspíš tvoje dopsané poznámky.</span><div class="tt">${diff(r.h,el?el.textContent:"")}</div>${el?`<button data-trv-use>Použít místo současného textu</button>`:""}<button data-trv-del>Smazat</button>`;
        return [d,el];
      };
      T.rec.forEach((r,i)=>{if(!show1(r))return;const [d,el]=box(r,i);if(el)where(el).after(d);});
      // seznam všech obnovených (i těch, které nemají místo na stránce)
      if(o.list){
        o.list.innerHTML="";
        const vis=T.rec.map((r,i)=>[r,i]).filter(([r])=>show1(r));
        if(vis.length){
          const p=document.createElement("p");p.className="note";
          p.innerHTML=`<b>🛟 Obnovené dřívější úpravy a poznámky (${vis.length})</b> – nic se neztratilo, jen to patřilo ke starší podobě stránky. Projdi je; co nepotřebuješ, smaž.`;
          o.list.appendChild(p);
          vis.forEach(([r,i])=>{const [d,el]=box(r,i);d.classList.add("keep");
            if(el){const a=document.createElement("button");a.textContent="Ukázat na stránce"+(label(el)?" – "+label(el):"");a.onclick=()=>{o.reveal&&o.reveal(el);where(el).scrollIntoView({block:"center"});};d.appendChild(a);}
            o.list.appendChild(d);});
        }
      }
      // upozornění: text byl aktualizován, ty vidíš svou verzi
      Object.keys(T.upd).forEach(k=>{
        const el=document.querySelector(`[data-hk="${CSS.escape(k)}"]`);if(!el||!TE.has(k))return;
        const d=document.createElement("div");d.className="trv";d.dataset.upd=k;
        d.innerHTML=`<b>ℹ️ Tento text byl mezitím aktualizován.</b> <span class="sm">Vidíš svou upravenou verzi, nic se neztratilo.</span><br><button data-trv-new>Ukázat novou verzi</button><button data-trv-ok>Rozumím, skrýt</button><div class="tt" hidden>${TE.orig[k]}</div>`;
        where(el).after(d);
      });
      if(!T.bound){T.bound=1;document.addEventListener("click",e=>{
        const d=e.target.closest(".trv");if(!d)return;
        if(e.target.closest("[data-trv-new]")){const t=d.querySelector(".tt");t.hidden=!t.hidden;return;}
        if(e.target.closest("[data-trv-ok]")){delete T.upd[d.dataset.upd];save(T.UPD,T.upd);d.remove();return;}
        const i=+d.dataset.ri,r=T.rec[i];if(!r)return;
        if(e.target.closest("[data-trv-del]")){if(!confirm("Opravdu smazat tuto obnovenou úpravu? (Je uložená i v automatické záloze.)"))return;T.rec.splice(i,1);save(T.RC,T.rec);T.show(o);return;}
        if(e.target.closest("[data-trv-use]")){
          const el=document.querySelector(`[data-hk="${CSS.escape(r.to)}"]`);if(!el)return;
          if(TE.has(r.to)&&!confirm("V tomhle odstavci už máš jinou úpravu. Nahradit ji obnovenou verzí?"))return;
          el.innerHTML=r.h;TE.save(el);T.rec.splice(i,1);save(T.RC,T.rec);T.show(o);
        }
      });}
    },
    autoSnaps(){return load(AUTO,[]);},
    restoreAuto(i){const s=load(AUTO,[])[i];if(!s)return false;Object.keys(s.data).forEach(k=>save(k,s.data[k]));return true;}
  };
})();
