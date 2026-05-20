# STATUS — što je gotovo, što čeka tebe

## Gotovo (Claude Code, 2026-05-20, dok si bio na predavanju)

- [x] Pregledana sva 10 aktivna "Opsis - Email Sequence v5" n8n workflowa preko n8n API-ja
- [x] Mapirano: sheet_id, gid, sender_email, smtp_key za svaku od 10 industrija (vidi `industries.json`)
- [x] Extracted email template-ovi iz svih 10 Build_Email Code nodeova → `templates/{industry}.js` (E1xV1-V9 + E2 DEFAULT + E3xV1-V9 + E4 DEFAULT = 20 templatea per industrija = 200 templatea ukupno)
- [x] Portan `Filter Eligible` JS code → `src/filter.js` (delays [0,3,4,7], daily cap)
- [x] Portan `Smart Variant Selector` → `src/variant.js` (V1-V9 logika)
- [x] Portan `Build Email` interpolate i mapping → `src/template.js`
- [x] Napisan `src/sheets.js` (Google Sheets v4 preko Service Account)
- [x] Napisan `src/smtp.js` (nodemailer pool, 1 transporter po mailbox)
- [x] Napisan `src/state.js` (per-day per-industry counter, reset preko ponoći)
- [x] Napisan `src/send.js` — main round-robin loop:
  - Randomized order industrija svaki ciklus
  - 60-180s random wait između sends (Sheets quota friendly)
  - 15-25min random wait između ciklusa
  - Hard cap 35/industry/dan (configurable)
  - Graceful exit nakon 50min session budget
  - State spremljen nakon svakog email-a (idempotent restart)
- [x] Offline fixture test (`test/fixture.js`) → SVE PROŠLO (filter + variant + template parity s n8n)
- [x] npm dependencies installirani (`google-spreadsheet`, `google-auth-library`, `nodemailer`)
- [x] Git repo inicijaliziran, sve commit-ano lokalno (1 commit, 27 fajlova)

## ČEKA TEBE (kad se vratiš s predavanja)

### 1. Refresh GitHub PAT
Postojeći token u `~/.claude/settings.json` je expired (HTTP 401 Bad credentials). 
- Idi na https://github.com/settings/tokens
- Generate new token (fine-grained ili classic, scopes: `repo`, `read:org`)
- Update `~/.claude/settings.json` → `mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN`
- `gh auth login -h github.com` s novim tokenom

### 2. Kreiraj privatni GitHub repo i push
```bash
cd "c:/Users/WWW/Desktop/ai/claude code/opsis-bulk-sender"
gh repo create tutafranko-web/opsis-bulk-sender --private --source=. --remote=origin --description "Opsis Dalmatia bulk email outreach - replaces 10 n8n workflows"
git push -u origin main
```

### 3. Slijedi `CREDENTIALS_SETUP.md`
- Korak 1-3: Kreiraj Google Service Account, preuzmi JSON, share-aj 10 sheetova
- Korak 4: Izvuci 10 SMTP password-a iz Hostinger panela
- Stavi u `credentials/service-account.json` i `credentials/smtp.json`

### 4. Lokalni dry-run
```bash
DRY_RUN=true node src/send.js
```
Treba pokazati listu emailova koji bi se poslali, BEZ stvarnog slanja.

### 5. Live test za 1 industriju
```bash
INDUSTRY=ortopedija LIMIT=1 node src/send.js
```
Pošalje točno 1 email iz Ortopedi liste. Provjeri Gmail Sent + Google Sheet (`email_step` → 1, `email_last_sent_at` → today).

### 6. Aktivacija Claude Routine
Kad live test radi, kreiraj routine kroz `/schedule`:
- Repo: `https://github.com/tutafranko-web/opsis-bulk-sender`
- Cron: `0 7-15 * * 1-5`
- Prompt: `cd opsis-bulk-sender && npm ci --silent && node src/send.js`
- Allowed tools: `Bash`
- Model: `claude-sonnet-4-6`

### 7. PARALELNI RUN DAN 1 (NE GASI n8n!)
Pusti da nova skripta i n8n rade paralelno 1 dan. Provjeri Sheet kraj dana:
- Jesu li `email_step` vrijednosti uredno povećane?
- Postoje li duplikati? (Pošto i n8n i nova skripta updejtaju iste rowove, mogli bi se javiti duplikati)

Ako želiš biti sigurniji — prvi dan nove skripte koristi `LIMIT=5` da samo 5 emaila per industrija pošalje, paralelno s n8n koji nastavlja punim cap-om. Manji "blast radius" ako nešto ne valja.

### 8. Gašenje n8n (NAKON 1 USPJEŠNOG DANA paralelnog runa)
```bash
KEY="eyJhbG..."
for ID in pQ2khjWOh0cXGt3l i68ud6eQmeUd6inQ IHih9F5wsgp0pk3M ctikuouhslc1nuHG jQHmdf189zHHulVl 1z7cjtwo8Vna2NM1 P6t8mrXLJC59rrN8 7KiZyebnLENkxefr RXokeIVkCqOUrrpR OckyZOlduxFDVzj0; do
  curl -X POST -H "X-N8N-API-KEY: $KEY" "https://n8n.srv1385713.hstgr.cloud/api/v1/workflows/$ID/deactivate"
done
```

## Sigurnost

- `credentials/` folder je gitignored — nikad neće biti committed
- Privatni repo mora ostati privatan zauvijek
- Ako sumnjaš na compromise: rotiraj svih 10 SMTP password-a + regen SA JSON

## Ako nešto ne radi

- **`Service account JSON not found`** → vidi CREDENTIALS_SETUP.md korak 1
- **`Sheet with gid X not found`** → SA email nije share-an na taj sheet, ili je gid kriv u industries.json
- **`SMTP ERROR: Invalid login`** → password kriv u smtp.json, ili Hostinger blokira (provjeri "Less secure apps" iako Hostinger to ne koristi — vjerojatno password kriv)
- **`unrendered placeholders: {{e1_value_short}}`** → benign, isto se događa u n8n. To je leftover iz E2 templatea i ne utječe na slanje.
