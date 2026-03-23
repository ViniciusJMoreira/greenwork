# 🌿 GreenWork — Gestione Ore Operai

> Contesto aggiornato del progetto per Claude Code

---

## 📌 Obiettivo

Web app mobile-first per la gestione delle ore lavorative di operai su cantieri.
Ogni operaio accede con PIN, inserisce le proprie ore, vede una dashboard personale.
I dati vengono scritti automaticamente su Google Sheets (direttamente nelle celle giuste)
e inviati via email di riepilogo a viniciusit.moreira@gmail.com.

---

## ⚙️ Stack Tecnico

| Pacchetto                   | Versione                         |
| --------------------------- | -------------------------------- |
| next                        | **16.2.1**                       |
| react                       | **19.2.4**                       |
| react-dom                   | **19.2.4**                       |
| tailwindcss                 | **^4** (breaking changes vs v3!) |
| @tailwindcss/postcss        | **^4**                           |
| eslint                      | **^9**                           |
| babel-plugin-react-compiler | **1.0.0**                        |
| recharts                    | per grafici dashboard            |
| nodemailer                  | per invio email                  |
| motion                      | richiesto da Catalyst            |
| @headlessui/react           | richiesto da Catalyst            |

- **Nome progetto**: `coop-app`
- **Linguaggio**: **JavaScript puro — ZERO TypeScript. Nessun file `.ts` o `.tsx`**
- **Estensioni file**: `.js` e `.jsx` ovunque
- **Deploy**: Vercel

### ⚠️ Note critiche sulle versioni

**Next.js 16** — Leggi `node_modules/next/dist/docs/` prima di scrivere codice.

**Tailwind v4** — Completamente diverso dalla v3:
- ❌ NON esiste più `tailwind.config.js`
- ❌ NON si usa `@tailwind base/components/utilities`
- ✅ Import nel CSS globale: `@import "tailwindcss"`
- ✅ Configurazione con variabili CSS native dentro `@theme {}`
- ✅ PostCSS plugin: `@tailwindcss/postcss`

**React 19 + Compiler** — `babel-plugin-react-compiler` attivo:
- ❌ NON scrivere `useMemo` / `useCallback` manualmente
- ❌ NON chiamare `setState` direttamente nel body di `useEffect` → lint error `react-hooks/set-state-in-effect`
  - Eccezione legittima: lettura da storage esterno (localStorage/sessionStorage) → `// eslint-disable-line react-hooks/set-state-in-effect`
- ✅ Il compilatore ottimizza automaticamente

**JavaScript puro**:
- ❌ Nessun tipo, nessuna interface, nessun `type`, nessun generic
- ❌ Nessun file `.ts` o `.tsx`
- ✅ Solo `.js` e `.jsx`

---

## 🎨 Design — tema dark custom

L'app usa un **tema dark custom** con colori inline via `style={{}}`, **non** le classi verde/grigio di Catalyst.

| Elemento             | Colore / valore          |
|----------------------|--------------------------|
| Sfondo pagina        | `#030712`                |
| Card / pannelli      | `#1f2937`                |
| Header / navbar      | `#111827`                |
| Input / select       | `#374151`                |
| Bottone primario     | `#16a34a` (verde)        |
| Testo principale     | `white`                  |
| Testo secondario     | `#9ca3af` (gray-400)     |
| Accento verde        | `#4ade80`                |

Colori grafici (PIE_COLORS in dashboard):
```js
["#16a34a","#15803d","#166534","#4ade80","#86efac","#22c55e","#bbf7d0","#dcfce7","#6ee7b7","#a7f3d0"]
```

### Schermate implementate

**1. Login** (`/login`)
- Sfondo dark con gradiente radiale verde scuro
- Logo 🌿, titolo "GreenWork", sottotitolo
- 4 pallini PIN che si riempiono
- Tastierino numerico 3×4 (1-9, ⌫, 0, C)
- Animazione shake su PIN errato
- Bottoni demo per i primi 4 operai
- **Nessun Catalyst** — schermata completamente custom dark

**2. Dashboard** (`/dashboard`)
- Topbar sticky: 🌿 + nome operaio + bottone email 📧 + bottone Esci
- Tab bar sticky: 📊 Dashboard | ➕ Inserisci | 📋 Storico
- **Nessun Catalyst** — tutto custom dark come il login

**3. Tab Dashboard**
- 3 stat card con icona, valore colorato, label
- BarChart ore per giorno (ultimi 7) — recharts
- PieChart distribuzione cantieri — recharts
- Barre orizzontali con percentuale per cantiere

**4. Tab Inserimento**
- Input HTML nativi stilizzati dark (NON Catalyst)
- Select cantiere (mostra codice sotto in automatico)
- Select tipo lavoro
- Grid 2 colonne: input time Inizio / Fine
- Box verde "Ore calcolate" in real-time
- Textarea note
- Bottone "💾 Salva Ore"

**5. Tab Storico**
- Card layout raggruppato per data (ISO desc)
- Ogni card: cantiere, badge lavoro, orario–orario, ore, note
- Bottone ✕ per eliminare un record

**6. Modal Email** (bottom sheet su mobile)
- Backdrop blur
- Riepilogo: operaio, destinatario, ore totali, giorni
- Dettaglio cantieri con codici e ore
- Bottone "Invia Riepilogo"

---

## 🗂️ Catalyst UI Kit

I componenti Catalyst sono in `app/_components/` (**dentro `app/`**, non nella root).
L'underscore fa sì che Next.js li ignori come route.

> ⚠️ **Attualmente non usati** nel login né nella dashboard (entrambi usano UI custom dark).
> Disponibili per schermate future (es. admin, impostazioni).

**Import corretto:**
```jsx
import { Button } from "@/app/_components/button"
import { Input } from "@/app/_components/input"
// ... ecc.
```

**NON modificare** i file in `app/_components/`.

---

## 📁 Struttura Progetto

```
coop-app/
├── app/
│   ├── _components/           ← Catalyst UI Kit (NON modificare)
│   │   ├── button.jsx
│   │   ├── input.jsx
│   │   ├── select.jsx
│   │   ├── textarea.jsx
│   │   ├── table.jsx
│   │   ├── dialog.jsx
│   │   ├── badge.jsx
│   │   ├── fieldset.jsx
│   │   ├── navbar.jsx
│   │   ├── sidebar.jsx
│   │   ├── stacked-layout.jsx
│   │   ├── dropdown.jsx
│   │   └── ...
│   ├── layout.js              ← metadata "GreenWork", lang="it"
│   ├── page.js                ← redirect a /login
│   ├── login/
│   │   └── page.jsx           ← PIN screen custom dark
│   ├── dashboard/
│   │   └── page.jsx           ← app principale (3 tab, custom dark)
│   └── api/
│       ├── save-ore/
│       │   └── route.js       ← scrive su Google Sheets via Apps Script
│       └── send-email/
│           └── route.js       ← invia email via Nodemailer
├── lib/
│   ├── data.js                ← OPERAI, CANTIERI, LAVORI, VINICIUS_DATA
│   ├── utils.js               ← timeToMin, calcMin, fmtOre, fmtOreDecimale, fmtData
│   ├── stats.js               ← getStats, getOrePerGiorno, getPieData, getStoricoGruppi
│   ├── auth.js                ← findByPin, saveSession, readSession, clearSession
│   ├── hooks.js               ← useSession(), useRegistri()
│   └── sheets.js              ← fetch verso Apps Script
├── docs/
│   └── lib/                   ← documentazione dettagliata di lib/
│       ├── README.md
│       ├── data.md
│       ├── utils.md
│       ├── stats.md
│       ├── auth.md
│       └── hooks.md
├── CONTEXT.md                 ← questo file
└── .env.local
```

---

## 📦 lib/ — Panoramica

La cartella `lib/` contiene tutta la logica di dominio separata dall'UI.
**Documentazione dettagliata** in `docs/lib/`.

### `lib/data.js` — Costanti

```js
export const OPERAI    // 10 operai { nome, pin }
export const CANTIERI  // 27 cantieri { nome, codice }
export const LAVORI    // 26 tipologie di lavoro (array di stringhe)
export const VINICIUS_DATA  // 42 record reali marzo 2026 — seed demo
```

**Tipo record (Registro):**
```js
{
  id:       string | number,  // UUID (nuovi) o intero 0-41 (VINICIUS_DATA)
  data:     string,           // "YYYY-MM-DD" — ISO 8601
  cantiere: string,           // nome cantiere
  codice:   string,           // codice contabile
  lavoro:   string,           // tipo lavoro
  inizio:   string,           // "HH:MM"
  fine:     string,           // "HH:MM"
  note:     string,           // testo libero
  operaio:  string,           // nome completo operaio
}
```

### `lib/utils.js` — Funzioni pure di tempo

```js
timeToMin(timeStr)         // "HH:MM" → numero minuti
calcMin(inizio, fine)      // durata in minuti (gestisce mezzanotte)
fmtOre(minuti)             // 90 → "1 h 30 min"
fmtOreDecimale(minuti)     // 90 → "1,50" (stringa con virgola)
oggi()                     // → "DD/MM/YYYY"
fmtData(dataStr)           // "2026-03-22" o "22/03/2026" → "22 Mar 2026"
```

### `lib/stats.js` — Aggregazioni pure

```js
getStats(registri)              // → { minutiTotali, giorniSet, giorniLavorati, numCantieri }
getOrePerGiorno(registri, n=7)  // → [{ data: "MM-DD", ore: 8.5 }] per BarChart
getPieData(registri)            // → [{ nome, min, ore }] per PieChart + barre
getStoricoGruppi(registri)      // → [{ data, records[], totMin }] per tab Storico
```

### `lib/auth.js` — Sessione (sessionStorage)

```js
findByPin(pin)       // cerca operaio per PIN → { nome, pin } | null
saveSession(operaio) // scrive in sessionStorage (solo browser)
readSession()        // legge da sessionStorage — sicura per SSR (ritorna null sul server)
clearSession()       // rimuove sessionStorage (logout)
```

### `lib/hooks.js` — Custom React Hooks

```js
useSession()   // → { operaio, esci }    — legge sessione, redirect se non auth
useRegistri()  // → { registri, aggiungi, rimuovi }  — localStorage + seed Vinicius
```

**Pattern importante — hydration:**
Entrambi gli hook iniziano con `null` / `[]` (consistente tra server e client),
poi leggono lo storage in `useEffect` dopo il mount. Questo evita il hydration mismatch.

### `lib/sheets.js` — Chiamata Apps Script

```js
export async function saveOre(payload) {
  const res = await fetch(process.env.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json()
}
```

---

## 🔗 Google Sheets

- **ID Foglio**: `1tU5bVH0rdTKapO2HSLTY7xG3hzdu0glh4aS93JjYiz8`

### Fogli utilizzati

#### `Tabella per Buste Paghe`
```
Col A → DIPENDENTE
Col B → COD. DIPENDENTE
Col C → Cod. Cantiere  ← chiave di ricerca
Col D → COD. MEZZO
Col E → giorno 1 … Col AI → giorno 31
Col AJ → TOT MESE
```
**Logica**: trova riga per codice in col C → scrive in colonna `E + giorno - 1` → somma al valore esistente.

#### `Tabella per Contabilità`
```
Col A → DIPENDENTE
Col B → CANTIERE  ← chiave di ricerca
Col C → giorno 1 … Col AH → giorno 31
Col AI → TOT MESE
```
**Logica**: trova riga per nome cantiere in col B → scrive in colonna `C + giorno - 1` → somma al valore esistente.

---

## 🔌 Google Apps Script

### Setup (una tantum)
1. Apri Google Sheets → **Estensioni → Apps Script**
2. Cancella tutto → incolla il codice → salva `Ctrl+S`
3. **Distribuisci → Nuova distribuzione** → Tipo: **App web** → Accesso: **Chiunque**
4. Autorizza → copia l'URL → incolla in `.env.local` come `APPS_SCRIPT_URL`

> ⚠️ Ogni modifica al codice richiede una **nuova versione** nella distribuzione

### Codice Apps Script

```javascript
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById("1tU5bVH0rdTKapO2HSLTY7xG3hzdu0glh4aS93JjYiz8")
    const data = JSON.parse(e.postData.contents)

    const giorno = parseInt(data.data.split("-")[2])
    const oreDecimali = parseFloat(data.oreDecimali)

    // BUSTE PAGHE — cerca per codice cantiere in col C (indice 3)
    const bustePaghe = ss.getSheetByName("Tabella per Buste Paghe")
    const colBuste = giorno + 4
    const rigaBuste = trovaNellaColonna(bustePaghe, 3, data.codice)
    if (rigaBuste) {
      const cella = bustePaghe.getRange(rigaBuste, colBuste)
      cella.setValue((parseFloat(cella.getValue()) || 0) + oreDecimali)
    }

    // CONTABILITÀ — cerca per nome cantiere in col B (indice 2)
    const contabilita = ss.getSheetByName("Tabella per Contabilità")
    const colCont = giorno + 2
    const rigaCont = trovaNellaColonna(contabilita, 2, data.cantiere)
    if (rigaCont) {
      const cella = contabilita.getRange(rigaCont, colCont)
      cella.setValue((parseFloat(cella.getValue()) || 0) + oreDecimali)
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function trovaNellaColonna(sheet, colIndex, valore) {
  const valori = sheet.getRange(1, colIndex, sheet.getLastRow(), 1).getValues()
  for (let i = 0; i < valori.length; i++) {
    if (String(valori[i][0]).trim() === String(valore).trim()) return i + 1
  }
  return null
}
```

---

## 🔄 Payload Next.js → Apps Script

```js
// Quello che manda /api/save-ore ad Apps Script
{
  data:        "2026-03-15",                  // "YYYY-MM-DD"
  cantiere:    "Spadarolo",                   // nome (per Contabilità)
  codice:      "004501V15813",                // codice (per Buste Paghe)
  oreDecimali: 2.5,                           // float (2h30m = 2.5)
  operaio:     "JUNQUEIRA MOREIRA VINICIUS"
}
```

---

## 🔐 .env.local

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
EMAIL_FROM=viniciusit.moreira@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_TO=viniciusit.moreira@gmail.com
```

---

## ✅ Checklist

- [x] Login PIN tastierino numerico (custom dark)
- [x] Dashboard custom dark con grafici recharts
- [x] Form inserimento con calcolo ore real-time
- [x] Storico raggruppato per data con eliminazione record
- [x] Modal email con riepilogo cantieri
- [x] Persistenza localStorage (+ seed VINICIUS_DATA)
- [x] Sessione operaio via sessionStorage (useSession hook)
- [x] lib/ organizzata: data, utils, stats, auth, hooks, sheets
- [x] Documentazione in docs/lib/
- [ ] API /api/save-ore → Apps Script → Google Sheets (route stub presente, integrazione da completare)
- [ ] API /api/send-email → Nodemailer (route stub presente, da configurare con App Password)
- [ ] PWA manifest per mobile

---

## 💡 Regole — OBBLIGATORIE

1. ✅ **Solo JavaScript** — `.js` e `.jsx` — zero `.ts` e `.tsx`
2. ✅ **Mobile-first** — 375px, dark theme custom
3. ✅ **Tailwind v4** — `@import "tailwindcss"` e `@theme {}`, zero `tailwind.config.js`
4. ✅ **React 19** — zero `useMemo`/`useCallback` manuali
5. ✅ **Hydration safe** — gli hook iniziano sempre con `null`/`[]`, leggono storage in `useEffect`
6. ✅ **lib/ = logica, app/ = UI** — nessuna logica di business nei componenti
7. ✅ **docs/ aggiornata** — ogni modifica a un file di `lib/` va riflessa nel `.md` corrispondente in `docs/lib/`
8. ✅ **Date in ISO** — formato `"YYYY-MM-DD"` ovunque (compatibile con `<input type="date">` e ordinabile come stringa)
9. ✅ **ID record** — `crypto.randomUUID()` per nuovi record
10. ✅ Apps Script scrive **direttamente nelle celle** di Buste Paghe e Contabilità — non appendere righe
