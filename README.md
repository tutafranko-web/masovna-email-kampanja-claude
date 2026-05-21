# masovna-email-kampanja-claude

Bulk email outreach za Opsis Dalmatia — zamjena za 10 n8n workflowa.

## Što radi

Šalje 4-stupanjsku email sekvencu (E1=ice-breaker, E2=check-in, E3=ponuda, E4=last touch) na liste prospekta iz Google Sheets-a, po industriji:

- Psihijatrijske ordinacije
- Ortopedske ordinacije
- Medicina rada
- Pedijatrijske ordinacije
- Fizioterapeutske ordinacije
- Ginekoloske ordinacije
- Turisticke agencije i ture
- Oftalmoloske ordinacije
- Wellness centri i SPA
- Estetske poliklinike

Svaka industrija ima:
- Vlastiti Google Sheet (lista prospekta + tracking kolone)
- Vlastiti SMTP mailbox (10 različitih sender adresa kroz 3 domene)
- 9 varijanti E1/E3 emaila + 1 default za E2/E4 (= 20 template-a per industry)

## Arhitektura

```
ScheduleTrigger (Claude Routine, hourly) → npm ci → node src/send.js
  → load industries.json, state/today.json
  → ROUND-ROBIN:
      for each industry (randomized order):
        read sheet via Service Account
        filter eligible (step+delay [0,3,4,7], daily cap 35)
        pick variant V1-V9 based on website diagnostics
        render template (interpolate {{placeholders}})
        send via nodemailer SMTP
        update sheet (email_step++, last_sent_at)
        wait 60-180s random
      wait 15-25min between full cycles
  → state.save (idempotent restart)
```

## Run

```bash
npm ci
DRY_RUN=true node src/send.js                # no sends, no sheet writes
INDUSTRY=ortopedija LIMIT=1 node src/send.js # send 1 email from Ortopedi only
node src/send.js                             # production: round-robin all 10
```

## Env vars

- `DRY_RUN=true` — log what would happen, do not send/update
- `INDUSTRY=ortopedija` — process only one industry (skips cycle wait)
- `LIMIT=N` — override daily limit (default 35)
- `SKIP_CYCLE_WAIT=true` — single cycle then exit

## Setup

Vidi [CREDENTIALS_SETUP.md](CREDENTIALS_SETUP.md). Trebaš:
- `credentials/service-account.json` (Google SA s pristupom na 10 sheetova)
- `credentials/smtp.json` (10 mailbox username/password parova)

## Struktura

```
opsis-bulk-sender/
├── industries.json      # config 10 industrija + global settings
├── templates/           # 10 industry-specific template files (E1-E4 × V1-V9)
├── src/
│   ├── send.js          # main entry — round-robin loop
│   ├── sheets.js        # Google Sheets read/write
│   ├── filter.js        # filter eligible rows (step + delay days)
│   ├── variant.js       # pick V1-V9 based on website diagnostics
│   ├── template.js      # render email body/subject with placeholders
│   ├── smtp.js          # nodemailer per-industry transporter pool
│   └── state.js         # per-day per-industry send counter
├── state/today.json     # runtime-generated, commits back to git
└── credentials/         # (gitignored)
    ├── service-account.json
    └── smtp.json
```

## Migration status

Trenutno radi paralelno s n8n workflowima. n8n se gasi **TEK NAKON 1 USPJEŠNOG DANA** ove skripte (inače duplikati). Vidi CREDENTIALS_SETUP.md korak 6.
