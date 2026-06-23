---
name: verify-live
description: Použi tento skill predtým, než oznámiš akúkoľvek vizuálnu/funkčnú zmenu na donovanpeet.com za hotovú. Tento projekt opakovane narazil na chyby (CSP, cache, Worker routing) viditeľné LEN na produkcii, nie na localhoste.
---

# Over na živej stránke

Localhost nie je dostatočný dôkaz, že niečo funguje.

Pred potvrdením "hotovo":
1. `curl -I https://donovanpeet.com` (alebo konkrétna zmenená cesta) - over status 200 a očakávané headers.
2. Playwright otvor priamo `https://donovanpeet.com` (nie localhost, nie file://).
3. Screenshot alebo computed values ako dôkaz, nie len "žiadne console chyby".
4. Pri animáciách/loopoch nechaj Playwright sledovať aspoň 30-60s pred potvrdením.
