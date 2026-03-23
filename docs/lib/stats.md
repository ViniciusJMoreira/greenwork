# `lib/stats.js` — Aggregazioni e calcoli sui registri

## Scopo

Funzioni **pure** che trasformano un array di registri ore in strutture dati
pronte per essere visualizzate: stat card, grafici recharts, tabelle raggruppate.

Nessuno stato React. Nessun effetto collaterale.
Ogni funzione prende `registri[]` e ritorna dati derivati.

---

## Dipendenze

```
lib/stats.js  →  lib/utils.js  (calcMin, fmtOreDecimale)
```

---

## Tipo di input — `Registro`

Tutte le funzioni accettano un array di oggetti con questa forma:

```ts
type Registro = {
  id:       number | string
  data:     string    // "YYYY-MM-DD"
  cantiere: string
  codice:   string
  lavoro:   string
  inizio:   string    // "HH:MM"
  fine:     string    // "HH:MM"
  note:     string
  operaio:  string
}
```

---

## Funzioni

### `getStats(registri)`

Calcola le **tre statistiche principali** mostrate nelle stat card in cima alla dashboard.

```js
getStats([])
// → { minutiTotali: 0, giorniSet: Set(0), giorniLavorati: 0, numCantieri: 0 }

getStats(VINICIUS_DATA)
// → {
//     minutiTotali: 2610,          // es. 43 h 30 min totali
//     giorniSet: Set { "2026-03-01", "2026-03-02", ... },
//     giorniLavorati: 18,
//     numCantieri: 11
//   }
```

**Parametri:**

| Nome       | Tipo    | Descrizione         |
|------------|---------|---------------------|
| `registri` | `Array` | Array di `Registro` |

**Ritorna:**

| Campo           | Tipo     | Descrizione                                              |
|-----------------|----------|----------------------------------------------------------|
| `minutiTotali`  | `number` | Somma di tutti i minuti lavorati                        |
| `giorniSet`     | `Set`    | Set delle date ISO uniche (usato per `.size` e per loop)|
| `giorniLavorati`| `number` | Numero di giorni distinti con almeno un record           |
| `numCantieri`   | `number` | Numero di cantieri distinti presenti nei registri        |

**Come funziona internamente:**
```js
const minutiTotali = registri.reduce((acc, r) => acc + calcMin(r.inizio, r.fine), 0)
const giorniSet    = new Set(registri.map(r => r.data))
const numCantieri  = new Set(registri.map(r => r.cantiere)).size
```

**Chi lo usa:**
- `Dashboard` in `page.jsx` → stat card ⏱️ Ore Totali, 📅 Giorni, 🏗️ Cantieri
- `EmailModal` in `page.jsx` → righe del riepilogo (ore totali, giorni lavorati)

---

### `getOrePerGiorno(registri, limit = 7)`

Produce i dati per il **BarChart** "Ore per Giorno".
Prende gli ultimi `limit` giorni ordinati e calcola le ore per ciascuno.

```js
getOrePerGiorno(registri)
// → [
//     { data: "03-09", ore: 8.0  },
//     { data: "03-10", ore: 5.5  },
//     { data: "03-11", ore: 8.5  },
//     { data: "03-16", ore: 9.0  },
//     { data: "03-17", ore: 7.5  },
//     { data: "03-18", ore: 5.5  },
//     { data: "03-19", ore: 5.5  },
//   ]

getOrePerGiorno(registri, 3)
// → ultimi 3 giorni soltanto
```

**Parametri:**

| Nome       | Tipo     | Default | Descrizione                    |
|------------|----------|---------|--------------------------------|
| `registri` | `Array`  | —       | Array di `Registro`            |
| `limit`    | `number` | `7`     | Quanti giorni mostrare al max  |

**Ritorna:** `Array<{ data: string, ore: number }>`

| Campo  | Tipo     | Descrizione                                     |
|--------|----------|-------------------------------------------------|
| `data` | `string` | Data in formato `"MM-DD"` (es. `"03-22"`)       |
| `ore`  | `number` | Ore decimali float (es. `8.5` = 8h 30min)       |

**Come funziona:**
1. Estrae tutti i giorni distinti → li ordina in ordine ISO crescente (alfabetico)
2. Prende gli ultimi `limit` (i più recenti)
3. Per ogni giorno filtra i registri e somma i minuti → converte in float

**Perché `"MM-DD"` e non la data completa?**
L'asse X del BarChart ha spazio limitato su mobile. `"03-22"` è più compatto di `"22 Mar 2026"`.

**Chi lo usa:**
- `Dashboard` in `page.jsx` → `<BarChart data={orePerGiorno}>`

---

### `getPieData(registri)`

Aggrega le ore **per cantiere**, ordinato dal cantiere con più ore al meno.
Usato sia per il PieChart che per le barre orizzontali e il riepilogo email.

```js
getPieData(VINICIUS_DATA)
// → [
//     { nome: "Spadarolo",    min: 780, ore: 13.0 },
//     { nome: "Torre Pedrera",min: 450, ore: 7.5  },
//     { nome: "Rivabella",    min: 420, ore: 7.0  },
//     { nome: "San Vito",     min: 360, ore: 6.0  },
//     // ... tutti i cantieri con almeno 1 record
//   ]
```

**Parametri:**

| Nome       | Tipo    | Descrizione         |
|------------|---------|---------------------|
| `registri` | `Array` | Array di `Registro` |

**Ritorna:** `Array<{ nome: string, min: number, ore: number }>`

| Campo  | Tipo     | Descrizione                                          |
|--------|----------|------------------------------------------------------|
| `nome` | `string` | Nome del cantiere (chiave)                           |
| `min`  | `number` | Minuti totali su quel cantiere (usato per percentuali)|
| `ore`  | `number` | Ore float (es. `7.5`) — usato nei tooltip recharts   |

**Come funziona:**
```js
// 1. Costruisce una mappa cantiere → minuti totali
const map = {}
registri.forEach(r => {
  map[r.cantiere] = (map[r.cantiere] || 0) + calcMin(r.inizio, r.fine)
})

// 2. Converte in array e ordina per minuti decrescenti
return Object.entries(map)
  .map(([nome, min]) => ({ nome, min, ore: parseFloat(...) }))
  .sort((a, b) => b.min - a.min)
```

**Perché `min` E `ore`?**
- `min` (numero intero) → usato per calcolare le **percentuali** senza errori di arrotondamento float
- `ore` (float) → usato nei **tooltip** di recharts che mostrano `"X h"`

**Chi lo usa:**
- `Dashboard` → `<PieChart>` e barre orizzontali con percentuale
- `EmailModal` → dettaglio cantieri (poi arricchito con `.codice` da `CANTIERI`)

---

### `getStoricoGruppi(registri)`

Raggruppa i registri **per data**, ordinate dalla più recente alla più vecchia.
Produce la struttura pronta per il render del tab Storico.

```js
getStoricoGruppi(VINICIUS_DATA)
// → [
//     {
//       data: "2026-03-20",
//       records: [ { id:37, cantiere:"Viserbella", ... }, { id:38, ... }, ... ],
//       totMin: 420,   // 7 ore in quel giorno
//     },
//     {
//       data: "2026-03-19",
//       records: [ ... ],
//       totMin: 330,
//     },
//     // ...
//   ]
```

**Parametri:**

| Nome       | Tipo    | Descrizione         |
|------------|---------|---------------------|
| `registri` | `Array` | Array di `Registro` |

**Ritorna:** `Array<{ data: string, records: Registro[], totMin: number }>`

| Campo     | Tipo       | Descrizione                                     |
|-----------|------------|-------------------------------------------------|
| `data`    | `string`   | Data ISO `"YYYY-MM-DD"` — usata come `key` React|
| `records` | `Registro[]`| Tutti i record di quel giorno                  |
| `totMin`  | `number`   | Minuti totali per il badge ore giornaliero       |

**Come funziona:**
1. Estrae i giorni distinti con `new Set()`
2. Li ordina descrescente con `.sort((a, b) => (a > b ? -1 : 1))` — funziona perché le date ISO sono ordinabili alfabeticamente
3. Per ogni giorno: filtra i record e somma i minuti

**Chi lo usa:**
- `Storico` in `page.jsx` → loop per renderizzare i gruppi di giornate

---

## Perché funzioni separate invece di calcoli inline nel componente?

| In componente (prima)                        | In `stats.js` (adesso)                    |
|----------------------------------------------|-------------------------------------------|
| Ricalcola ad ogni render                     | Il React 19 compiler ottimizza automaticamente |
| Logica mescolata con JSX → difficile leggere | Separata → leggibile e testabile          |
| Duplicata in più componenti (Dashboard + EmailModal) | Scritto una volta, usato ovunque   |
| Non testabile senza montare il componente    | Testabile con un semplice `assert()`      |
