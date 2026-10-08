# maturita-literatura
## Ochrana uložených dat (pro další úpravy obsahu)

Poznámky, psaní do textu, zvýraznění a umím/neumím se ukládají v prohlížeči (localStorage).
`trvalost.js` při každém načtení stránky:

- jednou denně uloží automatickou zálohu všech dat (posledních 7 dní, dá se vrátit v sekci Záloha),
- pamatuje si text každého odstavce („otisk“) – když se obsah upraví nebo posune, přesune data s ním
  a zvýraznění znovu najde podle zvýrazněných slov,
- co nejde bezpečně přiřadit, nikdy nemaže, ale ukáže jako „🛟 Obnovenou dřívější úpravu“.

Při úpravách obsahu proto **neměň klíče** (`data-hk`, `data-nk`, sady `TXT_V3`/`TXT_V4`) – stačí měnit text.
