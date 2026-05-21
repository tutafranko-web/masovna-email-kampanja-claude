# Credentials Setup

Repo se ne može aktivirati bez ova 2 fajla. Slijedi ovo kad se vratiš.

## 1. Google Service Account JSON

### Korak 1: Kreiraj Service Account
1. Otvori https://console.cloud.google.com
2. Kreiraj novi projekt (ili koristi postojeći) — npr. `masovna-email-kampanja-claude`
3. Lijevi izbornik → **APIs & Services → Library** → traži "Google Sheets API" → **Enable**
4. **APIs & Services → Credentials** → **Create credentials → Service account**
5. Name: `opsis-sender`, Description: "Bulk email outreach sheet access"
6. **Done** (preskoči role i user access koraka)
7. Klikni na novokreirani SA → **Keys** tab → **Add key → Create new key → JSON** → preuzmi

### Korak 2: Spremi JSON u repo
- Preimenuj preuzeti fajl u `service-account.json`
- Stavi ga u `credentials/service-account.json`
- **NE COMMIT-AJ** — `.gitignore` to već blokira, ali provjeri `git status` prije push-a

### Korak 3: Share-aj svih 10 sheetova sa SA email-om
SA email izgleda otprilike: `opsis-sender@PROJECT_ID.iam.gserviceaccount.com` (vidiš ga u JSON-u pod `client_email`).

Otvori svaki od 10 sheetova i klikni **Share** → upiši taj SA email → **Editor** → **Send**:

1. https://docs.google.com/spreadsheets/d/1eMoz0BTb9KNjtwFG9Xyz6Cl5XAlRJqdw7aK2oyK-VG8 (Psihijatrija)
2. https://docs.google.com/spreadsheets/d/1ulv8WP6TfbuRibTl-u35c4PdZWI418Pe3Lh61d3V8oU (Ortopedi)
3. https://docs.google.com/spreadsheets/d/1vqKy_JimD5aWIWN7sK76zDUgOgboiZdl_dY4CWg-N0E (Medicina rada)
4. https://docs.google.com/spreadsheets/d/1hpetszwH4qQEzjTENsUzdx4T-mcJXgxC3wPMtsttCuI (Pedijatrija)
5. https://docs.google.com/spreadsheets/d/1m37cHKXLVzvQ20RCK3oU47j-HRTMWMJYgf0hmhBNFD0 (Fizioterapija)
6. https://docs.google.com/spreadsheets/d/1E0aJSYEUxkkw0zM_hRaGL4R_4ftnTIq-nren6lNE8Q4 (Ginekologija)
7. https://docs.google.com/spreadsheets/d/1kL-X1JF4atvN67doJkdwrGjUBalSRlCgm935JSI2cks (Tour)
8. https://docs.google.com/spreadsheets/d/1sclWDWDW24A1QvAM3hCl-ODIPaBhekRWI_6_Qo4mRQM (Oftamologija)
9. https://docs.google.com/spreadsheets/d/101vebPGOtL8_YXmAKThNCX26agwr3hLqqYCpzrZxJEY (Wellness)
10. https://docs.google.com/spreadsheets/d/1LgToxUK30pEv7ySGePXGBbbT5NppYO7gY8zVxq3m5GU (Estetske)

## 2. SMTP passwords (10 mailboxa)

### Korak 1: Logiraj se u Hostinger
- https://hpanel.hostinger.com
- Otvori **Emails** → vidiš listu mailboxa po domeni:
  - `opsisdalmatiaoutreachseriaa.com` → a1, a2, a3
  - `opsisdalmatiaoutreachseriab.com` → b1, b2, b3, b4
  - `opsisdalmatiaoutreachseriac.com` → c1, c3, c4

### Korak 2: Za svaki mailbox uzmi password
Hostinger neće pokazati postojeći password (security). Imaš dvije opcije:
- **Reset password** za svaki mailbox: Manage → Reset password → zapiši novi
- **Ili izvuci iz n8n credentials-a** (ako nemaš pristup hpanel-u): u n8n otvori bilo koji "Send Email SMTP" node → klikni na credential → password je tu (možda hidden, ali u n8n DB možeš ga izvući kroz API ako treba)

### Korak 3: Popuni `credentials/smtp.json`
Kopiraj `credentials/smtp.example.json` → preimenuj u `credentials/smtp.json` i popuni passworde:

```json
{
  "a1": { "user": "opsisdalmatiaa1@opsisdalmatiaoutreachseriaa.com", "pass": "..." },
  "a2": { "user": "opsisdalmatiaa2@opsisdalmatiaoutreachseriaa.com", "pass": "..." },
  ...
}
```

### Korak 4: SMTP host/port
Trenutno hard-coded `smtp.hostinger.com:465` (SSL). Provjeri u Hostinger panelu → Email → Manage → IMAP/POP/SMTP. Ako se razlikuje, izmijeni `industries.json` → `global.smtp_host` i `smtp_port`.

## 3. Verifikacija (prvi dry-run)

```bash
npm ci
DRY_RUN=true node src/send.js
```

Trebao bi vidjeti:
- "[ts] [industry] -> email@domena.com | step 0->1 | variant V9 | 'subject'"
- "DRY_RUN — not sending, not updating sheet"
- Ciklus se ponavlja

Ako nešto faila — error će biti jasan (sheet nije share-an, password kriv, itd.).

## 4. Live test (kad dry-run radi)

```bash
INDUSTRY=ortopedija LIMIT=1 node src/send.js
```

→ pošalje 1 email iz Ortopedi liste, ažurira sheet. Provjeri sent inbox + Google Sheet → kolona `email_step` mora biti 1, `email_last_sent_at` mora biti današnji timestamp.

## 5. Aktivacija Claude Routine

Kad live test radi, kreiraj routine kroz `/schedule` skill u Claude Code-u s ovim parametrima:
- Repo: `https://github.com/tutafranko-web/masovna-email-kampanja-claude`
- Cron: `0 7-15 * * 1-5` (08-16 Europe/Zagreb, weekdays)
- Prompt: `cd masovna-email-kampanja-claude && npm ci --silent && node src/send.js`
- Allowed tools: `Bash`
- Model: `claude-sonnet-4-6`
- MCP: nikakve

## 6. Gašenje n8n workflowa (TEK NAKON 1 USPJEŠNOG DANA)

Ne gasi n8n dok ne provjeriš da nova skripta radi cijeli dan bez problema. Inače duplikati. Kad si siguran:

```bash
for ID in pQ2khjWOh0cXGt3l i68ud6eQmeUd6inQ IHih9F5wsgp0pk3M ctikuouhslc1nuHG jQHmdf189zHHulVl 1z7cjtwo8Vna2NM1 P6t8mrXLJC59rrN8 7KiZyebnLENkxefr RXokeIVkCqOUrrpR OckyZOlduxFDVzj0; do
  curl -X POST -H "X-N8N-API-KEY: $N8N_KEY" "https://n8n.srv1385713.hstgr.cloud/api/v1/workflows/$ID/deactivate"
done
```

## Sigurnost

- Repo **MORA** ostati privatan zauvijek. Ne dijeli access.
- Ako sumnjaš da je credentials curio (laptop ukraden, repo se slučajno otvorio public): rotiraj svih 10 SMTP password-a i regeneriraj Service Account JSON.
- Praćenje: GitHub Settings → Security log periodički provjeri.
