# CLAUDE.md — Peet Portfolio

Toto je portfolio stránka video editora "Peet" (Donovan Peet).

## Projekt fakty

- **URL:** https://donovanpeet.com
- **GitHub:** https://github.com/ImJustPeet/peet-portfolio (branch: main)
- **Deployment:** Cloudflare Pages (auto-deploy pri push na main)
- **Stack:** Čisto statický HTML/CSS/JS — žiadny framework, žiadny bundler
- **Hlavné súbory:**
  - `index.html` — hlavná stránka (všetok obsah)
  - `shared.css` — zdieľané štýly pre všetky podstránky
  - `shared.js` — zdieľaný JS (toast, konfeti, easter eggs, hamburger menu)
  - `_headers` — Cloudflare Pages response headers (CSP, HSTS, atď.)
  - `assets/tiktok-thumbs/` — lokálne WebP thumbnaily pre TikTok karty (tiktok-1.webp až tiktok-9.webp)
  - `assets/og-banner.png` — OG/Twitter share banner (1200×630px)
  - `blog.html`, `spoznaj-svojho-editora.html` — skeleton podstránky (noindex, skryté z nav)

## Kritické workflow pravidlá

- **VŽDY commitni a pushni** po každej sérii zmien — Cloudflare Pages sa deplouje automaticky z main
- **Pred akoukoľvek vizuálnou/funkčnou zmenou** over na localhost (port 3000 cez preview_start)
- **Pred oznámením "hotovo"** pre produkčné zmeny — over na živej donovanpeet.com (nie len localhost)
- **Jeden logický commit = jedna správa** — nerobí sa squash bez žiadosti
- **Nikdy neupravuj `.claude/settings.local.json`** — to sú permissions pre túto inštaláciu

## Technické rozhodnutia

### Video belt mozaika
- CSS Grid klaster: `grid-template-columns: 144px 175px; grid-template-rows: 213px 213px; gap: 10px`
- TikTok tall karty: `grid-row: span 2`
- Belt sa duplikuje dynamicky cez `innerHTML +=` pre nekonečný loop
- Po duplikácii sa znovu attachujú click handlery na `.reel-thumb`

### Video prehrávanie
- **YouTube:** IFrame API s lazy-load, `youtube-nocookie.com`, autoplay, volume 25, lightbox (focus trap, Escape, backdrop click)
- **TikTok:** `window.open(url, '_blank', 'noopener,noreferrer')` — embed bol zamietnutý po CSP problémoch a zlom renderingu v headless Chrome
- TikTok karty majú ext-link SVG ikonu (namiesto ▶) cez CSS `::after` pseudoelement

### CSP (_headers)
- `script-src`: self, unsafe-inline, cloudflareinsights, youtube, youtube-nocookie
- `style-src`: self, unsafe-inline, fonts.googleapis
- `frame-src`: youtube, youtube-nocookie (bez TikTok — embed odstránený)
- `img-src`: self, data:, ytimg, yt3.googleusercontent (bez tiktokcdn — lokálne WebP)
- Žiadne tiktokcdn domény, žiadne ttwstatic — vyčistené po prechode na window.open

### Shared CSS/JS architektúra
- `shared.css` obsahuje: CSS premenné, reset, body, nav/header, footer, button štýly, animácie (confetti, paw-rain, egg-toast, click-ripple)
- `shared.js` obsahuje: reducedGlobal, showToast, spawnConfetti, spawnPawRain, click ripple, hamburger menu, logo 5-klik, "max" easteregg, "hesoyam" easteregg, Konami kód
- `index.html` má inline `<style>` len pre page-specific CSS a inline `<script>` len pre page-specific JS

### Naming konzistencia
- Kanál sa volá **Duklock+** (nie "DuklockPlus") — všade v HTML, alt texty, reel-tagy

## Obsahové rozhodnutia

- **Jazyk:** Slovenčina pre UI text, Čeština/Slovenčina pre video titulky podľa originálu
- **Štatistika:** "35 mil.+" zhliadnutí na long form videách (data-count="35")
- **Aktuálni klienti:** Tary, Tak jsme tu!
- **Minulí klienti:** Duklock+, Fortuna, Jancucik, vvudyho herné dobrodružstvá, Jesus, Show More, Vidadu
- **Kontakt:** donovanpeet@gmail.com, Discord: imjustpeet, YouTube: @ImJustPeet, Instagram: @imjustpeet
- **Dostupnosť:** Online 9:00–15:00 Europe/Bratislava

## Osobné preferencie (Peet/Klaudia)

- Krátke, konkrétne odpovede — bez zbytočných vysvetlení
- Keď niečo overujem, chcem vidieť dôkaz (screenshot alebo konkrétne hodnoty), nie len "funguje"
- Commity po každej logickej zmene, nie batch na konci
- Audit findings riešiť naraz v jednom kole, nie po jednom
- Nezačínať implementáciu bez potvrdenia plánu pri väčších zmenách

## Otvorené veci

- `blog.html` a `spoznaj-svojho-editora.html` sú skeleton stránky bez obsahu — skryté z nav, noindex; čakajú na obsah
- `og-banner.png` je generovaný z `assets/og-banner-render.html` cez Playwright screenshot — pri zmene brandu regenerovať rovnakým spôsobom
- `scrape_views.mjs`, `scrape_missing.mjs`, `scrape_results*.json` — helper skripty pre manuálnu aktualizáciu view countov; nie sú commitnuté (.gitignore)

## Never do without asking (potrebuje explicitné potvrdenie od Peet/Klaudia)

- `git push --force` alebo akýkoľvek prepis git histórie
- Mazanie Cloudflare Worker alebo Pages projektu
- Zmena/mazanie DNS záznamov
- Vytváranie alebo rotácia API tokenov
- Force-replace celého `_headers` alebo `deploy.yml` súboru (úpravy áno, úplné prepísanie nie)

Tieto akcie sú nižšie technicky vynútené hookmi (pozri `.claude/settings.json`) — hook ich zablokuje, ale vždy najprv skús získať potvrdenie v konverzácii, hook je len posledná poistka.
