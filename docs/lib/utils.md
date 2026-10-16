# `lib/utils.js` — Funzioni pure di formattazione tempo

## Scopo

Funzioni **pure** (nessuno stato, nessun effetto collaterale) per lavorare con orari in formato stringa `"HH:MM"`.
Tutte queste funzioni sono deterministiche: stesso input → stesso output, sempre.

---

## Funzioni

### `timeToMin(timeStr)`

Converte un orario in minuti totali dall'inizio della giornata.
Accetta sia stringhe `"HH:MM"` che numeri `float8` (formato usato da Supabase per `orario_inizio`/`orario_fine`).

```js
timeToMin("07:30")  // → 450   (stringa "HH:MM")
timeToMin("14:00")  // → 840
timeToMin(9.5)      // → 570   (float8 da Supabase: 9.5h * 60)
timeToMin(14.0)     // → 840
timeToMin("")       // → 0     (stringa vuota → 0)
timeToMin(null)     // → 0     (null/undefined → 0)
```

**Parametri:**

| Nome      | Tipo              | Descrizione                                   |
|-----------|-------------------|-----------------------------------------------|
| `timeStr` | `string \| number` | Orario `"HH:MM"` oppure ore decimali (float8) |

**Ritorna:** `number` — minuti totali (0–1439)

**Nota Supabase:** `orario_inizio` e `orario_fine` sono salvati come `float8` (es. `9.5` = 09:30).
`timeToMin` gestisce entrambi i formati — nessuna conversione necessaria prima di chiamarla.

---

### `calcMin(inizio, fine)`

Calcola i minuti di durata tra due orari.
Gestisce correttamente il **passaggio a mezzanotte** (es. turno notturno 22:00–02:00).

```js
calcMin("07:00", "15:00")  // → 480   (8 ore)
calcMin("14:30", "17:30")  // → 180   (3 ore)
calcMin("22:00", "02:00")  // → 240   (4 ore, attraversa mezzanotte)
calcMin("", "15:00")       // → 0     (inizio mancante)
calcMin("07:00", "")       // → 0     (fine mancante)
calcMin("10:00", "10:00")  // → 0     (uguale → 0, non negativo)
```

**Parametri:**

| Nome    | Tipo     | Descrizione                      |
|---------|----------|----------------------------------|
| `inizio`| `string` | Orario inizio nel formato `"HH:MM"` |
| `fine`  | `string` | Orario fine nel formato `"HH:MM"`   |

**Ritorna:** `number` — durata in minuti (≥ 0)

**Come gestisce la mezzanotte:**
```js
const diff = end - start
return diff < 0 ? diff + 24 * 60 : diff
// Se diff è negativo, significa che fine < inizio → è passata la mezzanotte
// Aggiunge 1440 minuti (24h) per ottenere la durata corretta
```

**Chi lo usa:**
- `lib/stats.js` → calcolo ore totali, ore per giorno, ore per cantiere
- `app/dashboard/page.jsx` → box "Ore calcolate" nel form, visualizzazione nel Storico
- `app/api/send-email/route.js` → calcolo ore per l'email

---

### `fmtOre(minuti)`

Formatta minuti in stringa leggibile `"X h"` o `"X h YY min"`.

```js
fmtOre(0)    // → "0 h"
fmtOre(60)   // → "1 h"
fmtOre(90)   // → "1 h 30 min"
fmtOre(480)  // → "8 h"
fmtOre(495)  // → "8 h 15 min"
fmtOre(null) // → "0 h"
```

**Parametri:**

| Nome     | Tipo     | Descrizione             |
|----------|----------|-------------------------|
| `minuti` | `number` | Durata totale in minuti |

**Ritorna:** `string` — formato leggibile per l'utente

**Nota:** I minuti < 10 sono paddati con zero (`"1 h 05 min"`, non `"1 h 5 min"`).

**Chi lo usa:**
- Stat card "Ore Totali" in Dashboard
- Badge ore per giorno in Storico
- Ore calcolate in FormInserimento
- Email Modal riepilogo

---

### `minToDecimal(minuti)`

Converte minuti in ore decimali float con punto (es. `90 → 1.5`).
Usato per i valori `float8` da inviare a Supabase e Google Sheets.

```js
minToDecimal(60)   // → 1.0
minToDecimal(90)   // → 1.5
minToDecimal(480)  // → 8.0
minToDecimal(495)  // → 8.25
minToDecimal(0)    // → 0
```

**Chi lo usa:**
- `lib/actions.js` → calcolo `orario_inizio`, `orario_fine`, `ore_totali` prima di inserire su Supabase

---

### `fmtOreDecimale(minuti)`

Formatta minuti in numero decimale con virgola (formato europeo).
Usato per visualizzazione e calcoli intermedi nei grafici.

```js
fmtOreDecimale(60)   // → "1,00"
fmtOreDecimale(90)   // → "1,50"
fmtOreDecimale(480)  // → "8,00"
fmtOreDecimale(495)  // → "8,25"
fmtOreDecimale(0)    // → "0,00"
fmtOreDecimale(null) // → "0,00"
```

**Parametri:**

| Nome     | Tipo     | Descrizione             |
|----------|----------|-------------------------|
| `minuti` | `number` | Durata totale in minuti |

**Ritorna:** `string` — numero con 2 decimali, separatore virgola

> ⚠️ Ritorna una **stringa** con virgola (`","`) non punto.
> Per usarla come numero float (es. nei grafici recharts), convertire con:
> ```js
> parseFloat(fmtOreDecimale(min).replace(',', '.'))
> ```
> Questo pattern è usato in `lib/stats.js`.

**Chi lo usa:**
- `lib/stats.js` → conversione per i grafici
- `app/dashboard/page.jsx` → campo `totaleOre` inviato all'API

---

### `oggi()`

Ritorna la data odierna nel formato `"DD/MM/YYYY"`.

```js
oggi()  // → "22/03/2026"  (se oggi è 22 marzo 2026)
```

**Parametri:** nessuno

**Ritorna:** `string` — data nel formato italiano `"DD/MM/YYYY"`

> ℹ️ Attualmente non usata nel codice principale (il form usa `new Date().toISOString().slice(0, 10)` per ottenere il formato ISO `"YYYY-MM-DD"` compatibile con `<input type="date">`).
> Disponibile per usi futuri o report.

---

### `fmtData(dataStr)`

Converte una data (ISO o italiana) in formato leggibile `"G Mon YYYY"`.

```js
fmtData("2026-03-22")  // → "22 Mar 2026"   (da ISO)
fmtData("22/03/2026")  // → "22 Mar 2026"   (da formato italiano)
fmtData("")            // → ""              (stringa vuota → stringa vuota)
```

**Parametri:**

| Nome      | Tipo     | Descrizione                                    |
|-----------|----------|------------------------------------------------|
| `dataStr` | `string` | Data in formato `"YYYY-MM-DD"` o `"DD/MM/YYYY"` |

**Ritorna:** `string` — data leggibile con nome mese abbreviato in italiano

**Mesi supportati:** Gen, Feb, Mar, Apr, Mag, Giu, Lug, Ago, Set, Ott, Nov, Dic

**Come distingue i due formati:**
```js
if (dataStr.includes('/')) {
  // formato italiano DD/MM/YYYY
} else {
  // formato ISO YYYY-MM-DD
}
```

**Chi lo usa:**
- `Storico` in `app/dashboard/page.jsx` → intestazione di ogni gruppo di giornata

---

### `isLavoroPreventivo(lavoro)`

Restituisce `true` se il nome del tipo di lavoro è "Lavoro a preventivo"
(confronto senza maiuscole/minuscole e spazi esterni).

```js
isLavoroPreventivo("Lavoro a preventivo")   // → true
isLavoroPreventivo(" lavoro A PREVENTIVO ") // → true
isLavoroPreventivo("Sfalcio")               // → false
isLavoroPreventivo(undefined)               // → false
```

**Chi lo usa:**
- `components/form/form-inserimento.jsx` e `form-modifica.jsx` → mostrano l'input
  obbligatorio "Codice preventivo" subito sotto "Tipo Lavoro" solo per questo tipo di lavoro

---

### `isCantiereServizioPagamento(cantiere)`

Restituisce `true` se il nome del cantiere è "Servizi a Pagamento" (o "Servizio a Pagamento"),
confronto senza maiuscole/minuscole e spazi esterni.

```js
isCantiereServizioPagamento("Servizi a Pagamento")  // → true
isCantiereServizioPagamento("servizio a pagamento") // → true
isCantiereServizioPagamento("Rivabella Rugby")      // → false
isCantiereServizioPagamento(undefined)              // → false
```

**Chi lo usa:**
- `components/form/form-inserimento.jsx` e `form-modifica.jsx` → mostrano l'input
  obbligatorio "Servizio a pagamento" (campo sportivo + società) subito sotto "Cantiere"

---

## Dipendenze

```
lib/utils.js  →  (nessuna dipendenza)
```

Nessun import. File autonomo, non dipende da React né da Next.js.
Può essere importato ovunque — componenti, API routes, script Node.js.

---

## Principio di design

Tutte queste funzioni sono **pure** nel senso matematico:
- Nessun accesso a `window`, `localStorage`, `sessionStorage`
- Nessuna chiamata fetch
- Nessuno stato React
- Nessun effetto collaterale

Questo le rende **facilmente testabili** senza mock o setup:

```js
// Test banale, nessun setup necessario
assert(calcMin("07:00", "15:00") === 480)
assert(fmtOre(90) === "1 h 30 min")
assert(fmtData("2026-03-22") === "22 Mar 2026")
```
