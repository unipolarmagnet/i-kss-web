# I-KSS.dev

Predmetová stránka pre študentov **FEI STU** — predmet **Kvalita softvérových systémov (KSS)**.
Slúži na prihlásenie školským účtom, prehľad zadaní a priraďovanie tém študentom.

## Funkcie

- **Prihlásenie cez Google OAuth** obmedzené na doménu `@stuba.sk` (overené server-side cez `hd` claim aj kontrolu prípony e-mailu).
- **Role** admin / študent, vrátane admin „user view“ (impersonácia) na otestovanie študentského pohľadu.
- **Triedy (rozcestník)** — študent vstúpi presne do jednej triedy; triedy sa dajú premenovať, uzavrieť zápis a vyhodiť študenta.
- **Zoznamy tém** s kapacitami, exportom do PDF a priradením tried v režime *shared* (spoločná kapacita) alebo *separate* (kapacita per trieda).
- **Preferencie** — študent si vyberie 3 témy zoradené podľa priority 1–3.
- **Rozdeľovací algoritmus** — 3-kolový s náhodným žrebovaním pri zhode + re-open kolo pre nepriradených.
- **Audit** — každá akcia sa loguje do CSV (`logs/`) aj do databázy (`AuditLog`).
- **Zadania** — 3 inžinierske zadania (jednotkové testovanie, statická analýza, CI a kvalitatívne brány).

## Technológie

- [Next.js 15](https://nextjs.org/) (App Router, Server Actions, middleware)
- [Auth.js v5](https://authjs.dev/) (`next-auth` beta) — JWT stratégia
- [Prisma 6](https://www.prisma.io/) + SQLite
- [Bootstrap 5](https://getbootstrap.com/) (CDN) + Bootstrap Icons

## Lokálne spustenie

```bash
# 1. Závislosti
npm install

# 2. Premenné prostredia — skopíruj šablónu a vyplň hodnoty
cp .env.local.example .env.local
#   AUTH_SECRET        – náhodný 32-bajtový base64 reťazec
#   AUTH_GOOGLE_ID     – Google OAuth client ID
#   AUTH_GOOGLE_SECRET – Google OAuth client secret
#   ADMIN_EMAILS       – čiarkou oddelené @stuba.sk e-maily s rolou admin

# 3. Databáza
npm run db:migrate
npm run db:seed      # voliteľné: testovacie dáta

# 4. Vývojový server
npm run dev          # http://localhost:3000
```

Pri Google OAuth nastav redirect URI na `http://localhost:3000/api/auth/callback/google`.

## Konfigurácia prostredia

| Premenná | Súbor | Popis |
|---|---|---|
| `DATABASE_URL` | `.env` | Cesta k SQLite databáze (necitlivé, commitnuté) |
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS` | `.env.local` | Tajné údaje — **nikdy necommituj** (ignorované cez `.gitignore`) |
| `ALLOWED_HD` | `.env.local` | Povolená Workspace doména (`stuba.sk`) |
