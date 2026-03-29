# `lib/` — Documentazione generale

> Documentazione di dettaglio per ogni file:
> - [`utils.md`](./utils.md) — Funzioni di formattazione tempo
> - [`stats.md`](./stats.md) — Aggregazioni sui turni
> - [`auth.md`](./auth.md) — Gestione sessione (httpOnly cookie)

---

## Panoramica

La cartella `lib/` contiene **tutta la logica di dominio** dell'app GreenWork,
separata dall'interfaccia grafica. I componenti React in `app/` importano da qui
ma non contengono mai calcoli, persistenza o business logic.

```
lib/
├── actions.js  → Server Actions: login, logout, CRUD turni, fetch cantieri/lavori/macchinari
├── supabase.js → client Supabase inizializzato con service role key
├── auth.js     → sessione operaio via httpOnly cookie (next/headers)
├── utils.js    → funzioni pure: calcolo minuti, formattazione orari e date
├── stats.js    → funzioni pure: aggregazioni sui turni (grafici, statistiche)
└── sheets.js   → fetch verso Google Apps Script per scrittura su Sheets
```

---

## Architettura a strati

```
┌─────────────────────────────────────────────────────┐
│           app/ (React Components)                    │
│   useApp() → dati da AppContext                      │
└───────────────────┬─────────────────────────────────┘
                    │ importa
┌───────────────────▼─────────────────────────────────┐
│         app/_components/AppContext.jsx               │
│   AppProvider — fornisce operaio, turni, cantieri,   │
│   lavori, macchinari, tab, showEmail                 │
└───────────────────┬─────────────────────────────────┘
                    │ riceve props da
┌───────────────────▼─────────────────────────────────┐
│         app/dashboard/layout.jsx (Server Component)  │
│   readSessionCookie() + getCantieri() + getLavori()  │
│   + getMacchinari() + getTurniByDipendente()         │
└───────────────────┬─────────────────────────────────┘
                    │ chiama
┌───────────────────▼─────────────────────────────────┐
│                lib/actions.js                        │
│   Server Actions — loginByPin, logout, insertTurno,  │
│   deleteTurno, getCantieri, getLavori, getMacchinari │
└────────┬─────────────────────────┬──────────────────┘
         │ importa                 │ importa
┌────────▼────────┐       ┌────────▼────────┐
│  lib/supabase.js│       │   lib/auth.js   │
│  client Supabase│       │  httpOnly cookie │
└─────────────────┘       └─────────────────┘
                    │ importa
┌───────────────────▼─────────────────────────────────┐
│               lib/stats.js                           │
│  getStats() getOrePerGiorno() getPieData()           │
│  getStoricoGruppi()                                  │
└───────────────────┬─────────────────────────────────┘
                    │ importa
┌───────────────────▼─────────────────────────────────┐
│               lib/utils.js                           │
│  timeToMin() calcMin() fmtOre()                      │
│  fmtOreDecimale() minToDecimal() oggi() fmtData()    │
└─────────────────────────────────────────────────────┘
```

**Regola fondamentale:** le dipendenze vanno solo dall'alto verso il basso. Nessuna dipendenza circolare.

---

## Responsabilità di ogni file

### `actions.js` — Server Actions

**Cosa fa:** Tutte le operazioni lato server: autenticazione, lettura/scrittura dati Supabase, scrittura su Google Sheets.
Marcato `"use server"` — eseguito solo sul server, mai nel browser.

**Funzioni principali:**

| Funzione | Descrizione |
|----------|-------------|
| `loginByPin(pin)` | Verifica PIN su Supabase, salva cookie sessione |
| `logout()` | Cancella cookie, redirect a `/login` |
| `getCantieri()` | Lista cantieri ordinata A-Z |
| `getLavori()` | Lista tipi lavoro ordinata A-Z |
| `getMacchinari()` | Lista macchinari ordinata A-Z |
| `insertTurno(turno)` | Inserisce turno in Supabase + scrive su Sheets |
| `deleteTurno(id)` | Elimina turno da Supabase |
| `getTurniByDipendente(id)` | Fetcha turni con join, normalizzati |

---

### `supabase.js` — Client database

**Cosa fa:** Esporta il client Supabase inizializzato con `SUPABASE_KEY` (service role).
**Solo server** — non usare in componenti client.

---

### `auth.js` — Sessione operaio

**Cosa fa:** Legge/scrive/cancella l'httpOnly cookie `gw_operaio` via `next/headers`.
La sessione è gestita **server-side** — non accessibile da JavaScript nel browser.

**Funzioni:** `saveSessionCookie(operaio)`, `readSessionCookie()`, `clearSessionCookie()`

---

### `utils.js` — Funzioni pure di tempo

**Cosa fa:** Converte e formatta orari. Funzioni pure al 100%.
Accetta sia stringhe `"HH:MM"` che numeri `float8` (dal DB Supabase).

---

### `stats.js` — Aggregazioni

**Cosa fa:** Trasforma un array di turni normalizzati in strutture dati per i componenti.
Funzioni pure — nessuno stato, nessun effetto.

---

### `sheets.js` — Google Sheets

**Cosa fa:** Chiama Google Apps Script via fetch POST per scrivere ore su Sheets.
Usato da `insertTurno` in `actions.js`. Non bloccante — errori loggati ma non propagati.

---

## Dipendenze tra file

```
supabase.js  ←  (nessuna)
utils.js     ←  (nessuna)
auth.js      ←  next/headers
stats.js     ←  utils.js
sheets.js    ←  (nessuna, solo fetch)
actions.js   ←  supabase.js, auth.js, utils.js, sheets.js
```

---

## Cosa NON va in `lib/`

| Cosa                              | Dove va invece              |
|-----------------------------------|-----------------------------|
| Componenti React (JSX)            | `app/` o `_components/`     |
| Stato UI (tab, modal)             | `AppContext.jsx`             |
| Stili CSS / classi Tailwind       | Nel componente              |
| Configurazione Next.js            | `next.config.js`            |
| Variabili d'ambiente              | `.env.local`                |

---

## Come aggiungere un nuovo cantiere o operaio

**Nuovo cantiere/operaio/lavoro:**
Aggiungere direttamente nel Table Editor di Supabase — l'app fetcha i dati live ad ogni sessione, nessun file da modificare.