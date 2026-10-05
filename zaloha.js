/* Společná záloha všech dat z obou stránek (literární historie i rozbory) do jednoho souboru. */
(function(){
  const KEYS=[
    "lit-hist-notes-v1","lit-hist-lvl-v1","lit-hist-hl-v1","lit-hist-text-v1","lit-hist-known-v1",
    "rozbory-kniha-v1","rozbory-hl-v1","rozbory-poznamky-v1","rozbory-poznamky-autor-v1","rozbory-text-v1"
  ];
  const today=()=>new Date().toISOString().slice(0,10);
  function collect(){const data={};KEYS.forEach(k=>{try{const v=localStorage.getItem(k);if(v!==null)data[k]=JSON.parse(v);}catch(e){}});return data;}
  function count(data){
    const n=k=>{const v=data[k];return v?(Array.isArray(v)?v.length:Object.keys(v).length):0;};
    return {poznamky:n("lit-hist-notes-v1")+n("rozbory-poznamky-v1")+n("rozbory-poznamky-autor-v1"),zvyrazneni:n("lit-hist-hl-v1")+n("rozbory-hl-v1"),upravy:n("lit-hist-text-v1")+n("rozbory-text-v1"),oznaceni:n("lit-hist-lvl-v1")+n("rozbory-kniha-v1")};
  }
  window.Zaloha={
    stats(){return count(collect());},
    export(){
      const data=collect(),blob=new Blob([JSON.stringify({app:"maturita-zaloha",v:1,datum:today(),data},null,1)],{type:"application/json"});
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`maturita-zaloha-${today()}.json`;document.body.appendChild(a);a.click();a.remove();
    },
    import(file){
      return file.text().then(t=>{
        const d=JSON.parse(t);let data;
        if(d.app==="maturita-zaloha")data=d.data||{};
        else if(d.app==="lit-hist"){ // starší záloha jen z literární historie
          data={};if(d.notes)data["lit-hist-notes-v1"]=d.notes;
          if(d.lvl)data["lit-hist-lvl-v1"]=d.lvl;else if(d.known)data["lit-hist-lvl-v1"]=Object.fromEntries(d.known.map(n=>[n,"ok"]));
          if(d.hl)data["lit-hist-hl-v1"]=d.hl;if(d.text)data["lit-hist-text-v1"]=d.text;
        }else throw new Error("format");
        const c=count(data);
        if(!confirm(`Záloha obsahuje: ${c.poznamky} poznámek, ${c.zvyrazneni} zvýrazněných odstavců, ${c.upravy} upravených odstavců a ${c.oznaceni} označení (umím / neumím).\n\nNahradit tím současná data na tomto zařízení?`))return false;
        Object.keys(data).forEach(k=>{if(KEYS.includes(k))localStorage.setItem(k,JSON.stringify(data[k]));});
        location.reload();return true;
      });
    }
  };
})();
