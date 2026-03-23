# `lib/data.js` — Costanti statiche dell'applicazione

## Scopo

Questo file è l'**unica fonte di verità** per tutti i dati statici dell'app GreenWork.
Non contiene logica, non dipende da nessun altro modulo, non ha effetti collaterali.
Qualunque componente o funzione che ha bisogno di dati di dominio li importa da qui.

---

## Esportazioni

### `OPERAI`

```js
export const OPERAI = [
  { nome: 'ACANFORA ROBERTO',           pin: '4821' },
  { nome: 'CIRRINCIONE VITO LUIGI',     pin: '7364' },
  { nome: 'CORRADINI STEFANO',          pin: '2951' },
  { nome: 'JUNQUEIRA MOREIRA VINICIUS', pin: '6130' },
  { nome: 'MAFTEI LARISIA PETRONELA',   pin: '8847' },
  { nome: 'MARCIGLIANO GERARDO LUIS',   pin: '3372' },
  { nome: 'MIGANI SIMONA',              pin: '5509' },
  { nome: 'MOREIRA SERGIO',             pin: '9183' },
  { nome: 'ROVIZZI STEFANO',            pin: '1746' },
  { nome: 'SANTI GRAZIANO',             pin: '6628' },
]
```

**Tipo di ogni elemento:**

| Campo  | Tipo     | Descrizione                              |
|--------|----------|------------------------------------------|
| `nome` | `string` | Nome completo in maiuscolo (COGNOME NOME)|
| `pin`  | `string` | PIN a 4 cifre — stringa, NON numero      |

> ⚠️ Il PIN è una **stringa**, non un numero intero.
> `'0012'` ≠ `12` — confrontare sempre con `===` tra stringhe.

**Chi lo usa:**
- `lib/auth.js` → `findByPin()` cerca nell'array
- `app/login/page.jsx` → bottoni demo rapidi (`OPERAI.slice(0, 4)`)

---

### `CANTIERI`

```js
export const CANTIERI = [
  { nome: 'Rivazzurra',              codice: '004501V15813' },
  { nome: 'Ina Casa',                codice: '004502V15813' },
  { nome: 'Rivabella',               codice: '004510V15813' },
  { nome: 'Stadio',                  codice: '004501V16813' },
  { nome: 'Varie + Gestione',        codice: 'GENHHH000000' },
  { nome: 'Privati',                 codice: 'XXX000B00XXX' },
  { nome: 'Giornata di Flessibilità',codice: 'BG'           },
  { nome: 'Permesso',                codice: 'PR'           },
  { nome: 'Ferie',                   codice: 'FR'           },
  { nome: 'Pioggia',                 codice: 'PI'           },
  { nome: 'Malattia',                codice: 'MA'           },
  // ... 27 cantieri totali
]
```

**Tipo di ogni elemento:**

| Campo    | Tipo     | Descrizione                                              |
|----------|----------|----------------------------------------------------------|
| `nome`   | `string` | Nome leggibile del cantiere, usato come chiave di lookup |
| `codice` | `string` | Codice contabile per Google Sheets e buste paga          |

**Nota sui codici:**
Più cantieri possono condividere lo stesso codice (es. `'004501V15813'` appare per 7 cantieri diversi).
I cantieri come Ferie, Malattia, Pioggia hanno codici abbreviati (`FR`, `MA`, `PI`) perché non sono lavori su cantiere ma giustificativi.

**Chi lo usa:**
- `app/dashboard/page.jsx` → select per scegliere il cantiere nel form
- `lib/stats.js` → `getPieData()` per aggregare ore per cantiere
- `app/api/send-email/route.js` → lookup del codice nell'email di riepilogo

---

### `LAVORI`

```js
export const LAVORI = [
  'Custodia', 'Pulizia Spogliatoi', 'Custodia Partita',
  'Pulizie GENERALI', 'Innaffiatura', 'Rigatura', 'Rigatura Extra',
  'Sfalcio CP', 'Sfalcio CP+CS', 'Sfalcio CS', 'Sfalcio AE',
  'Sfalcio AE+CP', 'Sfalcio CP + Rullo', 'Sfalcio CS + Rullo',
  'Sabbia', 'Rullatura', 'Giri Vari', 'Manutenzione GIOCHI',
  'Lavoro a Preventivo', 'Facchinaggio', 'Altre Manutenzioni',
  'Miglioria', 'GESTIONE', 'Riunione', 'Corso', 'Visita Medica',
]
```

**Tipo:** `string[]` — 26 tipologie di lavoro.

**Chi lo usa:**
- `app/dashboard/page.jsx` → select per il tipo lavoro nel form inserimento

---

### `VINICIUS_DATA`

```js
export const VINICIUS_DATA = [
  {
    data:     "2026-03-01",       // ISO 8601: "YYYY-MM-DD"
    cantiere: "Spadarolo",
    codice:   "004501V15813",
    lavoro:   "Custodia Partita",
    inizio:   "09:30",            // "HH:MM" 24h
    fine:     "13:30",
    note:     "",
  },
  // ... 42 record totali (marzo 2026)
].map((r, i) => ({ ...r, id: i, operaio: "JUNQUEIRA MOREIRA VINICIUS" }))
```

**Tipo di ogni elemento (dopo il `.map()`):**

| Campo      | Tipo               | Descrizione                              |
|------------|--------------------|------------------------------------------|
| `id`       | `number` (0–41)    | Indice progressivo aggiunto dal `.map()` |
| `data`     | `string` ISO-8601  | Formato `"YYYY-MM-DD"` — ordinabile come stringa |
| `cantiere` | `string`           | Nome cantiere (corrisponde a `CANTIERI[n].nome`) |
| `codice`   | `string`           | Codice contabile                         |
| `lavoro`   | `string`           | Tipo lavoro (corrisponde a `LAVORI[n]`)  |
| `inizio`   | `string`           | Ora inizio `"HH:MM"` formato 24h        |
| `fine`     | `string`           | Ora fine `"HH:MM"` formato 24h          |
| `note`     | `string`           | Note libere, può essere `""`            |
| `operaio`  | `string`           | Sempre `"JUNQUEIRA MOREIRA VINICIUS"`    |

**Scopo:**
Dati reali di Vinicius per marzo 2026. Servono come **seed demo**: quando Vinicius fa login per la prima volta e localStorage è vuoto, l'app precarica questi 42 record invece di partire da zero.

**Chi lo usa:**
- `lib/hooks.js` → `useRegistri()` controlla se fare il seed

---

## Dipendenze

```
lib/data.js  →  (nessuna dipendenza)
```

Nessun import. File autonomo.

---

## Formato dei Record — Schema condiviso

Il formato di un **registro ore** usato in tutta l'app è:

```ts
type Registro = {
  id:       number | string   // numero (VINICIUS_DATA) o UUID (nuovi record)
  data:     string            // "YYYY-MM-DD"
  cantiere: string            // nome cantiere
  codice:   string            // codice contabile
  lavoro:   string            // tipo lavoro
  inizio:   string            // "HH:MM"
  fine:     string            // "HH:MM"
  note:     string            // testo libero
  operaio:  string            // nome completo operaio
}
```

> I nuovi record inseriti dall'utente usano `crypto.randomUUID()` come `id` (stringa UUID).
> I record `VINICIUS_DATA` usano l'indice numerico `0–41`.
> Il codice non fa mai confronti `===` tra ID di tipo diverso — usa solo `!== id` per filtrare, che funziona correttamente in entrambi i casi.
