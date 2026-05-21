# STATUS — što je gotovo, što čeka tebe

> **TL;DR**: Kod 100% gotov + testiran (58+ assertions pass). 2 buga ispravljena autonomno. Trebaš samo: kreirati prazan repo na github.com → `git push` → setup credentials. **Detaljni izvještaj: vidi [REPORT.md](REPORT.md)**

## Gotovo (Claude Code, 2026-05-20 + 2026-05-21)

- [x] Pregledana sva 10 aktivna "Opsis - Email Sequence v5" n8n workflowa preko n8n API-ja
- [x] Mapirano: sheet_id, gid, sender_email, smtp_key za svaku od 10 industrija
- [x] 200 email templatea extracted iz Build_Email Code nodeova (E1×V1-V9 + E2 DEFAULT + E3×V1-V9 + E4 DEFAULT × 10 industrija)
- [x] Portan `Filter Eligible` → `src/filter.js`
- [x] Portan `Smart Variant Selector` → `src/variant.js`
- [x] Portan `Build Email` interpolate → `src/template.js`
- [x] Napisan `src/sheets.js` (Google Sheets v4 + Service Account)
- [x] Napisan `src/smtp.js` (nodemailer pool)
- [x] Napisan `src/state.js` (per-day per-industry counter)
- [x] Napisan `src/send.js` — round-robin loop s 50min session budget
- [x] **Test suite (6 fajlova, 58+ assertion-a, npm test):**
  - syntax.js — 17 fajlova parse + 200 templatea struktura + config shape
  - fixture.js — basic smoke
  - edge_cases.js — 26 assertions (filter, variant, 360 template renders, state)
  - error_handling.js — 2 assertions (missing creds errori)
  - e2e_mock.js — 17 assertions (full pipeline mocked)
  - env_vars.js — 6 assertions (CLI env var behavior)
- [x] **Bug #1 fixed**: send.js auto-run on require → wrap u `if (require.main === module)`
- [x] **Bug #2 fixed**: send.js spin-on-permanent-error → break if no progress made in cycle
- [x] Fresh checkout simulated (kako će routine raditi) → exit 0.4s, no hang
- [x] npm dependencies installed: google-spreadsheet@4.1.4, google-auth-library@9.14.1, nodemailer@6.9.16
- [x] Git: 3 commit-a, main branch, remote=origin pointing to github.com/tutafranko-web/opsis-bulk-sender.git
- [x] gh CLI authenticated s novim PAT-om

## ⚠️ ČEKA TEBE (~5 min)

### 1. Kreiraj prazan repo (PAT nema Administration scope, ne mogu autonomno)
- https://github.com/new
- Name: `opsis-bulk-sender`, Private, NE dodaji README

### 2. Push
```bash
cd "c:/Users/WWW/Desktop/ai/claude code/opsis-bulk-sender"
git push -u origin main
```

### 3. Slijedi `CREDENTIALS_SETUP.md`
- Service Account JSON (Google Cloud Console)
- 10 SMTP password-a (Hostinger panel)
- Share-aj 10 sheetova sa SA email-om

### 4. Test live
```bash
npm test                                          # all pass
DRY_RUN=true INDUSTRY=ortopedija node src/send.js # see what would happen
INDUSTRY=ortopedija LIMIT=1 node src/send.js      # send 1 real
```

### 5. Kreiraj Claude Routine kroz /schedule
- Repo: `https://github.com/tutafranko-web/opsis-bulk-sender`
- Cron: `0 7-15 * * 1-5`
- Prompt: `cd opsis-bulk-sender && npm ci --silent && node src/send.js`
- Tools: Bash, Model: `claude-sonnet-4-6`

### 6. PARALELNI RUN DAN 1
**NE GASI n8n** dok nova skripta ne odradi 1 cijeli dan paralelno bez problema.

### 7. Gasi n8n workflowe (NAKON 1 uspješnog dana)
```bash
KEY="<n8n API key>"
for ID in pQ2khjWOh0cXGt3l i68ud6eQmeUd6inQ IHih9F5wsgp0pk3M ctikuouhslc1nuHG jQHmdf189zHHulVl 1z7cjtwo8Vna2NM1 P6t8mrXLJC59rrN8 7KiZyebnLENkxefr RXokeIVkCqOUrrpR OckyZOlduxFDVzj0; do
  curl -X POST -H "X-N8N-API-KEY: $KEY" "https://n8n.srv1385713.hstgr.cloud/api/v1/workflows/$ID/deactivate"
done
```

## Sigurnost

- `credentials/` gitignored — nikad committed
- Privatni repo mora ostati privatan
- Ako sumnjaš na compromise: rotiraj 10 SMTP password-a + regen SA JSON

## Ako nešto ne radi

- **`Service account JSON not found`** → vidi CREDENTIALS_SETUP.md korak 1
- **`Sheet with gid X not found`** → SA email nije share-an, ili gid kriv
- **`SMTP ERROR: Invalid login`** → password kriv u smtp.json
- **`unrendered placeholders: {{e1_value_short}}`** → benign, parity s n8n
- **Routine session prekine prije kraja dana** → state file commit-a se nakon svakog send-a, sljedeći fire (1h kasnije) nastavlja
