# 🌿 GreenWork — Gestione Ore Operai

Web app mobile-first per la gestione delle ore lavorative di operai su cantieri cooperativi.

## ✨ Funzionalità

- **Login con PIN** — ogni operaio accede con un PIN a 4 cifre
- **Inserimento ore** — form con cantiere, tipo lavoro, orario inizio/fine (step 30 min), note
- **Dashboard** — statistiche personali, grafici ore per giorno e distribuzione cantieri
- **Storico** — registro ore raggruppato per data con possibilità di eliminazione
- **Google Sheets** — ogni salvataggio scrive automaticamente sulle tabelle Buste Paghe e Contabilità
- **Email riepilogo** — invio riepilogo ore mensile via email

## 🛠️ Stack

| Tecnologia | Versione |
|---|---|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| Tailwind CSS | v4 |
| Recharts | grafici |
| Nodemailer | email |
| Google Apps Script | backend Sheets |

## 🚀 Setup

### 1. Installa le dipendenze

```bash
pnpm install
```

### 2. Configura le variabili d'ambiente

Crea un file `.env.local` nella root:

```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
EMAIL_FROM=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=your@gmail.com
```

### 3. Google Apps Script

1. Apri il Google Sheet → **Estensioni → Apps Script**
2. Incolla il codice dal file `CONTEXT.md` (sezione Apps Script)
3. **Distribuisci → Nuova distribuzione** → Tipo: App web → Accesso: **Chiunque**
4. Copia l'URL → incolla in `.env.local` come `APPS_SCRIPT_URL`

### 4. Avvia in sviluppo

```bash
pnpm dev
```

Apri [http://localhost:3000](http://localhost:3000)

## 📁 Struttura

```
app/
├── login/          → schermata PIN
├── dashboard/      → app principale (3 tab)
└── api/
    ├── save-ore/   → scrive su Google Sheets
    └── send-email/ → invia email riepilogo
lib/
├── data.js         → operai, cantieri, lavori
├── utils.js        → funzioni tempo e formattazione
├── stats.js        → aggregazioni per grafici
├── auth.js         → gestione sessione
├── hooks.js        → custom React hooks
└── sheets.js       → chiamata Apps Script
```

## 🔐 Note di sicurezza

- `.env.local` non viene mai committato (escluso da `.gitignore`)
- La sessione operaio è gestita via `sessionStorage` (lato client)
- I dati ore sono persistiti in `localStorage`

## 📄 Licenza

Progetto privato — uso interno cooperativa.
