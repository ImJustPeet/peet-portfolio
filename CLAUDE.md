# CLAUDE.md — Peet Portfolio Project

Trvalý kontextový súbor. Drž ho krátky — každý riadok sa načítava v PLNEJ veľkosti pri každej session (na rozdiel od MCP nástrojov, toto sa nelazyloaduje).

## Tech stack — NEMENIŤ

Čistý vanilla HTML/CSS/JS. ŽIADNY React/Vue/Tailwind/build proces. Toto je vedomé, opakovane potvrdené rozhodnutie — nenavrhuj framework/build tooling.

Hosting: Cloudflare Pages, doména `donovanpeet.com`. Repo: GitHub `ImJustPeet/peet-portfolio` (verejný). Deploy: `git push main` → GitHub Actions → Cloudflare Pages → auto cache purge. Secrets: `CLOUDFLARE_API_TOKEN` (trvalý, Pages Write + Cache Purge), `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`.

Súbory: `index.html`, `shared.css`, `shared.js`, `blog.html` + jednotlivé `blog-*.html` články, `spoznaj-svojho-editora.html`, `robots.txt`, `sitemap.xml`, `_headers`, `404.html`, `/assets/`.

## KRITICKÉ pravidlá

1. **Vždy testuj na živej `donovanpeet.com`, nikdy len na localhoste.** CSP chyby, cache, Worker routing boli viditeľné LEN na produkcii. Použi skill `verify-live`.
2. **"Žiadne console errors" ≠ dôkaz že to funguje.** Vyžaduj vizuálne potvrdenie (screenshot/skutočné prehratie), nie len technické signály.
3. **Infinite scroll/marquee: NIKDY `-50%` na obaľujúcom kontajneri.** Použi: každý "set" element má vlastnú identickú animáciu `translateX(0) → translateX(-100%)` (vždy presne vlastná šírka, nemôže byť nepresné).
4. **Po JS duplikácii obsahu (`innerHTML +=`) vždy znova napoj event listenery** na duplikované uzly.
5. **Po pridaní externého zdroja (script/iframe/font/obrázok z cudzej domény) vždy aktualizuj `_headers` CSP.**
6. **Zmeny rob v presne vymedzenom rozsahu** — nič mimo zadania.
7. **Pred úpravou kódu over si aktuálny stav priamo v súbore** (nepredpokladaj obsah na základe predošlých správ — môže byť zastaraný).

## Technické gotchas (neopakovať skúmanie)

- Custom kurzor odstránený, systémový kurzor je finálny stav.
- TikTok embed v lightboxe NEFUNGUJE spoľahlivo (CSP, ttwstatic.com, GPU rendering v headless) — finálne riešenie: `window.open(url, '_blank', 'noopener,noreferrer')`, NIE embed. Neskúšať znova bez silného dôvodu.
- YouTube lightbox: `YT.Player`, doména `youtube-nocookie.com`, **`origin: window.location.origin` POVINNÉ v `playerVars`** (inak "content blocked").
- YouTube thumbnaily: doména `i.ytimg.com` (nie `img.youtube.com`), musí sedieť s `<link rel="preconnect">`.
- TikTok thumbnaily: TRVALÉ lokálne WebP v `/assets/tiktok-thumbs/` — nikdy nehotlinkovať CDN (expirujúce podpísané URL).
- Video belt mozaika: CSS grid (`grid-template-columns/rows`, `grid-row: span 2`), NIE flexbox s `align-items:flex-end` (nerovnomerné medzery).
- Cloudflare Worker s priamou "Worker Domain" väzbou môže OBÍSŤ Pages pipeline bez chyby — ak doména neukazuje nový obsah aj po úspešnom deployi, skontroluj DNS/Worker bindings, nie len cache.
- Slovenská typografia: krátke predložky/spojky (k,s,z,v,o,a,i,u) → `&nbsp;` pred nasledujúcim slovom.
- Vyhýbať sa em dash (—) vo VŠETKOM texte vrátane skrytých `<title>`/`<meta>` tagov — čítané ako "AI slop" signál. Čiarka/dvojbodka/rozdelenie vety.
- Farby len cez CSS premenné v `:root`, nikdy natvrdo zapísaný hex mimo.
- Lightbox accessibility: `role="dialog"`, `aria-modal`, `aria-hidden` prepínanie, focus trap, focus-return po zatvorení.
- Google favicon v search results vyžaduje reálny PNG súbor (min. 48×48), nie inline SVG data-URI.

## Never do without asking (hook-enforced, pozri .claude/settings.json)

- `git push --force` / prepis git histórie
- Mazanie Cloudflare Worker/Pages projektu
- Zmena/mazanie DNS záznamov
- Vytváranie/rotácia API tokenov
- Úplné prepísanie `_headers` alebo `deploy.yml` (úpravy áno, prepísanie nie)
