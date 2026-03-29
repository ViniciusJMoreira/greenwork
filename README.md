# 🌿 GreenWork — Gestione Ore Operai

Web app mobile-first per la gestione delle ore lavorative di operai su cantieri cooperativi.

## ✨ Funzionalità

- **Login con PIN** — ogni operaio accede con un PIN a 4 cifre
- **Inserimento ore** — form con cantiere, tipo lavoro, orario inizio/fine (step 30 min), macchinario, note
- **Dashboard** — statistiche personali, grafici ore per giorno e distribuzione cantieri
- **Storico** — registro ore raggruppato per data con possibilità di eliminazione
- **Google Sheets** — ogni salvataggio scrive automaticamente sulle tabelle Buste Paghe e Contabilità
- **Email riepilogo** — invio riepilogo ore mensile via email

## 🛠️ Stack

| Tecnologia         | Versione       |
| ------------------ | -------------- |
| Next.js            | 16.2.1         |
| React              | 19.2.4         |
| Tailwind CSS       | v4             |
| Supabase           | database       |
| Recharts           | grafici        |
| Nodemailer         | email          |
| Google Apps Script | backend Sheets |

## 🚀 Setup

### 1. Installa le dipendenze

```bash
pnpm install
```

### 2. Configura le variabili d'ambiente

Crea un file `.env.local` nella root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_service_role_key
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
├── dashboard/
│   ├── layout.jsx  → Server Component: fetcha dati da Supabase, fornisce AppContext
│   └── page.jsx    → Client Component: 3 tab (Dashboard, Inserisci, Storico)
└── api/
    └── send-email/ → invia email riepilogo via Nodemailer
app/_components/
├── AppContext.jsx  → context globale (operaio, turni, cantieri, lavori, macchinari)
├── dashboard/      → componenti tab Dashboard (grafici recharts)
├── form/           → FormInserimento, TimeSelect
├── header/         → Header con bottone email e logout
└── storico/        → tab Storico con raggruppamento per data
lib/
├── actions.js      → Server Actions: login, logout, CRUD turni, fetch liste
├── supabase.js     → client Supabase (service role)
├── auth.js         → sessione operaio via httpOnly cookie
├── utils.js        → funzioni pure: calcolo minuti, formattazione orari e date
├── stats.js        → aggregazioni pure per grafici e statistiche
└── sheets.js       → chiamata Apps Script per Google Sheets
```

## 🔐 Note di sicurezza

- `.env.local` non viene mai committato (escluso da `.gitignore`)
- La sessione operaio è gestita via **httpOnly cookie** (server-side, non accessibile da JS)
- I dati vengono letti da **Supabase** con service role key (solo server)

## 📄 Licenza

Progetto privato — uso interno cooperativa.