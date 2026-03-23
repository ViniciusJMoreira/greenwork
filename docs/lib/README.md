# `lib/` — Documentazione generale

> Documentazione di dettaglio per ogni file:
> - [`data.md`](./data.md) — Costanti statiche
> - [`utils.md`](./utils.md) — Funzioni di formattazione tempo
> - [`stats.md`](./stats.md) — Aggregazioni sui registri
> - [`auth.md`](./auth.md) — Gestione sessione
> - [`hooks.md`](./hooks.md) — Custom React hooks

---

## Panoramica

La cartella `lib/` contiene **tutta la logica di dominio** dell'app GreenWork,
separata dall'interfaccia grafica. I componenti React in `app/` importano da qui
ma non contengono mai calcoli, persistenza o business logic.

```
lib/
├── data.js    → Costanti: OPERAI, CANTIERI, LAVORI, VINICIUS_DATA
├── utils.js   → Funzioni pure: calcolo minuti, formattazione orari e date
├── stats.js   → Funzioni pure: aggregazioni sui registri (grafici, statistiche)
├── auth.js    → Sessione operaio: login, logout, lettura da sessionStorage
└── hooks.js   → Custom React hooks: useSession(), useRegistri()
```

---

## Architettura a strati

```
┌─────────────────────────────────────────────────┐
│              app/ (React Components)             │
│   page.jsx usa hook e funzioni pure da lib/      │
└───────────────────┬─────────────────────────────┘
                    │ importa
┌───────────────────▼─────────────────────────────┐
│                  lib/hooks.js                    │
│   useSession() — useRegistri()                   │
│   Stato React + side effects (storage, router)   │
└───────┬───────────────────────┬─────────────────┘
        │ importa               │ importa
┌───────▼───────┐       ┌───────▼───────┐
│  lib/auth.js  │       │  lib/data.js  │
│  sessionStorage│       │  VINICIUS_DATA│
└───────┬───────┘       └───────────────┘
        │ importa
┌───────▼───────────────────────────────────────┐
│               lib/stats.js                    │
│  getStats() getOrePerGiorno() getPieData()    │
│  getStoricoGruppi()                           │
└───────────────┬───────────────────────────────┘
                │ importa
┌───────────────▼───────────────────────────────┐
│               lib/utils.js                    │
│  timeToMin() calcMin() fmtOre()               │
│  fmtOreDecimale() oggi() fmtData()            │
└───────────────────────────────────────────────┘
                │ importa
┌───────────────▼───────────────────────────────┐
│               lib/data.js                     │
│  OPERAI, CANTIERI, LAVORI, VINICIUS_DATA      │
└───────────────────────────────────────────────┘
```

**Regola fondamentale:** le dipendenze vanno solo dall'alto verso il basso.
`data.js` non importa niente. `utils.js` non importa `data.js`. Nessuna dipendenza circolare.

---

## Responsabilità di ogni file

### `data.js` — Le costanti

**Cosa fa:** Definisce i dati di dominio fissi: chi sono gli operai, quali cantieri esistono,
quali tipi di lavoro ci sono, e i dati reali di Vinicius per il demo.

**Non fa:** Nessun calcolo, nessuna logica, nessun effetto.

**Regola:** Se aggiunta un cantiere, un operaio, o un tipo di lavoro → si modifica solo qui.
Tutto il resto si aggiorna automaticamente.

**Tipo chiave:**
```ts
type Operaio  = { nome: string, pin: string }
type Cantiere = { nome: string, codice: string }
type Registro = { id, data, cantiere, codice, lavoro, inizio, fine, note, operaio }
```

---

### `utils.js` — Il motore del tempo

**Cosa fa:** Converte e formatta orari nel formato `"HH:MM"`.
Funzioni pure al 100% — nessuno stato, nessun import esterno.

**Funzioni:**

| Funzione              | Input             | Output            | Esempio                        |
|-----------------------|-------------------|-------------------|--------------------------------|
| `timeToMin(str)`      | `"HH:MM"`         | `number` (minuti) | `"07:30"` → `450`              |
| `calcMin(ini, fin)`   | `"HH:MM"`, `"HH:MM"` | `number`       | `("07:00","15:00")` → `480`    |
| `fmtOre(min)`         | `number`          | `string`          | `90` → `"1 h 30 min"`          |
| `fmtOreDecimale(min)` | `number`          | `string`          | `90` → `"1,50"`                |
| `oggi()`              | —                 | `string`          | → `"22/03/2026"`               |
| `fmtData(str)`        | `string` (ISO o IT)| `string`         | `"2026-03-22"` → `"22 Mar 2026"`|

---

### `stats.js` — Le aggregazioni

**Cosa fa:** Trasforma un array di registri in strutture dati pronte per i componenti
(grafici, stat card, tabelle raggruppate). Funzioni pure — nessuno stato.

**Funzioni:**

| Funzione                        | Produce                                  | Usato in              |
|---------------------------------|------------------------------------------|-----------------------|
| `getStats(registri)`            | `{ minutiTotali, giorniSet, giorniLavorati, numCantieri }` | Stat card, EmailModal |
| `getOrePerGiorno(registri, n)`  | `[{ data, ore }]` — ultimi N giorni      | BarChart              |
| `getPieData(registri)`          | `[{ nome, min, ore }]` — per cantiere    | PieChart, barre, email|
| `getStoricoGruppi(registri)`    | `[{ data, records[], totMin }]`          | Tab Storico           |

**Vantaggio chiave:** `EmailModal` e `Dashboard` usano entrambi `getPieData()` —
la logica di aggregazione è scritta una volta sola.

---

### `auth.js` — La sessione

**Cosa fa:** Incapsula tutto ciò che tocca `sessionStorage['operaio']`.
Un solo posto per cambiare come funziona il login/logout.

**Funzioni:**

| Funzione             | Descrizione                                         |
|----------------------|-----------------------------------------------------|
| `findByPin(pin)`     | Cerca operaio per PIN → oggetto o `null`            |
| `saveSession(op)`    | Scrive operaio in sessionStorage (JSON)             |
| `readSession()`      | Legge operaio da sessionStorage — sicura per SSR    |
| `clearSession()`     | Rimuove operaio da sessionStorage (logout)          |

**Nota SSR:** `readSession()` controlla `typeof window === 'undefined'` e ritorna
`null` sul server invece di lanciare un errore. Le altre funzioni (`saveSession`,
`clearSession`) vengono chiamate solo da event handler — mai durante SSR.

---

### `hooks.js` — Lo stato React

**Cosa fa:** Due custom hook che collegano la logica `lib/` con lo stato React.
Permettono ai componenti di avere dati reattivi senza gestire direttamente lo storage.

**Hook:**

**`useSession()`**
```js
const { operaio, esci } = useSession()
```
- Legge `sessionStorage` una volta al mount (lazy initializer)
- Reindirizza a `/login` se non autenticato (`useEffect`)
- Espone `esci()` che chiama `clearSession()` + redirect

**`useRegistri()`**
```js
const { registri, aggiungi, rimuovi } = useRegistri()
```
- Carica da `localStorage` al mount (lazy initializer)
- Se primo accesso + Vinicius → seed con `VINICIUS_DATA`
- `aggiungi(record)` → prepend + salva su localStorage
- `rimuovi(id)` → filtra + salva su localStorage

---

## Come si usa in `app/dashboard/page.jsx`

```jsx
// Tutto lo stato dell'app in 2 righe:
const { operaio, esci }     = useSession()
const { registri, aggiungi, rimuovi } = useRegistri()

// I calcoli per i grafici, zero stato:
const stats    = getStats(registri)
const pieData  = getPieData(registri)
const gruppi   = getStoricoGruppi(registri)
```

Il componente principale fa solo coordinamento — non contiene calcoli né storage.

---

## Come si usa in `app/login/page.jsx`

```jsx
// Solo la logica di autenticazione:
const found = findByPin(pin)        // cerca l'operaio
if (found) {
  saveSession(found)                // salva in sessionStorage
  router.push('/dashboard')         // redirect
}
```

---

## Dipendenze tra file

```
data.js      ←  (nessuna)
utils.js     ←  (nessuna)
stats.js     ←  utils.js
auth.js      ←  data.js
hooks.js     ←  data.js, auth.js
```

Struttura lineare, zero dipendenze circolari.

---

## Cosa NON va in `lib/`

| Cosa                              | Dove va invece              |
|-----------------------------------|-----------------------------|
| Componenti React (JSX)            | `app/` o `_components/`     |
| Chiamate fetch alle API           | Nel componente che le usa   |
| Stili CSS / classi Tailwind       | Nel componente              |
| Configurazione Next.js            | `next.config.js`            |
| Variabili d'ambiente              | `.env.local`                |

---

## Come aggiungere un nuovo cantiere o operaio

**Nuovo cantiere:**
1. Aprire `lib/data.js`
2. Aggiungere `{ nome: 'Nome Cantiere', codice: 'CODICE' }` in `CANTIERI`
3. Il select nel form si aggiorna automaticamente — nessun altro file da modificare

**Nuovo operaio:**
1. Aprire `lib/data.js`
2. Aggiungere `{ nome: 'COGNOME NOME', pin: '1234' }` in `OPERAI`
3. Il login riconosce il nuovo PIN — nessun altro file da modificare

**Nuova tipologia di lavoro:**
1. Aprire `lib/data.js`
2. Aggiungere la stringa in `LAVORI`
3. Il select nel form si aggiorna automaticamente
