# `lib/hooks.js` — Custom React Hooks

## Scopo

Due custom hook che gestiscono lo **stato con effetti collaterali** dell'app:
- `useSession()` → chi è loggato (sessionStorage + redirect)
- `useRegistri()` → i registri ore (localStorage + seed dati demo)

Questi hook separano la logica di stato dalla presentazione:
i componenti non toccano mai direttamente `localStorage` o `sessionStorage`.

---

## Requisiti

```js
'use client'  // obbligatorio — usa useState, useEffect, useRouter
```

Entrambi i hook **devono** essere usati solo in componenti con `"use client"`.
Non funzionano in Server Components o API Routes.

---

## Dipendenze

```
lib/hooks.js  →  react          (useState, useEffect)
              →  next/navigation (useRouter)
              →  lib/data.js    (VINICIUS_DATA)
              →  lib/auth.js    (readSession, clearSession)
```

---

## `useSession()`

Gestisce la sessione operaio. Legge chi è loggato, reindirizza se non loggato, espone la funzione di logout.

### Firma

```js
const { operaio, esci } = useSession()
```

### Valore di ritorno

| Campo     | Tipo                             | Descrizione                                  |
|-----------|----------------------------------|----------------------------------------------|
| `operaio` | `{ nome, pin } \| null`          | Operaio loggato, o `null` se non autenticato |
| `esci`    | `() => void`                     | Chiama `clearSession()` + redirect a `/login`|

### Comportamento

**Inizializzazione — sempre `null` su server e client:**
```js
const [operaio, setOperaio] = useState(null)
```
Inizia sempre come `null`, sia sul server (SSR) che sul primo render del client.
Questo garantisce che server e client producano lo stesso HTML iniziale — **nessun hydration mismatch**.

**Lettura della sessione dopo il mount:**
```js
useEffect(() => {
  const op = readSession()
  if (op) {
    setOperaio(op) // eslint-disable-line react-hooks/set-state-in-effect
  } else {
    router.replace('/login')
  }
}, [router])
```
Dopo l'hydration, il `useEffect` si attiva **solo sul client**:
- Se c'è una sessione valida → aggiorna `operaio` e la pagina si renderizza
- Se non c'è sessione → reindirizza a `/login`

Usa `router.replace()` invece di `router.push()` per **non aggiungere la dashboard alla history**
del browser — così il tasto "indietro" non riporta alla dashboard dopo il logout.

**Perché `useState(null)` + `useEffect` invece del lazy initializer?**

Con lazy initializer (`useState(readSession)`):
```
Server:  readSession() → null     → renderizza null
Client:  readSession() → { nome } → renderizza la pagina intera
                                    ⚠️ MISMATCH → hydration error
```

Con `useState(null)` + `useEffect`:
```
Server:  operaio = null → renderizza null
Client:  operaio = null → renderizza null (stesso del server ✅)
         [dopo mount] useEffect → setOperaio({ nome }) → renderizza la pagina
```

Il `// eslint-disable-line react-hooks/set-state-in-effect` è legittimo: leggere da
`sessionStorage` dopo il mount è esattamente il caso d'uso previsto per `useEffect`
(sincronizzare stato React con un sistema esterno). La regola lint è pensata per
scoraggiare stato derivato da altro stato React, non letture da storage esterno.

### Esempio d'uso

```jsx
export default function DashboardPage() {
  const { operaio, esci } = useSession()

  if (!operaio) return null  // evita render durante redirect

  return (
    <div>
      <p>Ciao, {operaio.nome}</p>
      <button onClick={esci}>Esci</button>
    </div>
  )
}
```

---

## `useRegistri()`

Gestisce la persistenza dei registri ore in `localStorage`.
Al primo utilizzo con Vinicius loggato, **semina automaticamente** i dati demo.

### Firma

```js
const { registri, aggiungi, rimuovi } = useRegistri()
```

### Valore di ritorno

| Campo      | Tipo                   | Descrizione                                         |
|------------|------------------------|-----------------------------------------------------|
| `registri` | `Registro[]`           | Array corrente dei registri (in ordine di inserimento)|
| `aggiungi` | `(record) => void`     | Aggiunge un record in cima all'array                 |
| `rimuovi`  | `(id) => void`         | Rimuove il record con quell'`id`                     |

### Comportamento

**Inizializzazione — sempre `[]` su server e client:**
```js
const [registri, setRegistri] = useState([])
```
Come per `useSession`, parte sempre da array vuoto per evitare hydration mismatch.

**Lettura da localStorage dopo il mount — tre casi:**

```js
useEffect(() => {
  const saved = localStorage.getItem('registri')
  if (saved) {
    setRegistri(JSON.parse(saved))               // Caso 1: dati già presenti
    return
  }
  const op = readSession()
  if (op?.nome === 'JUNQUEIRA MOREIRA VINICIUS') {
    localStorage.setItem('registri', JSON.stringify(VINICIUS_DATA))
    setRegistri(VINICIUS_DATA)                   // Caso 2: Vinicius → seed demo
  }
  // Caso 3: altro operaio, nessun dato → resta []
}, [])
```

| Caso | Condizione                          | Risultato                          |
|------|-------------------------------------|------------------------------------|
| 1    | `localStorage['registri']` esiste   | Carica i dati salvati              |
| 2    | Primo accesso + operaio = Vinicius  | Seed con 42 record di marzo 2026   |
| 3    | Primo accesso + altro operaio       | Array vuoto                        |

**Persistenza — funzione interna `_persist`:**

```js
function _persist(nuovi) {
  setRegistri(nuovi)
  localStorage.setItem('registri', JSON.stringify(nuovi))
}
```

`_persist` fa **sempre** due cose insieme: aggiorna lo stato React E scrive su localStorage.
Non è possibile aggiornare lo stato senza salvare, e viceversa.
Il prefisso `_` indica che è privata — non è esposta nell'oggetto ritornato.

**`aggiungi(record)`:**
```js
function aggiungi(record) {
  _persist([record, ...registri])
}
```
Il nuovo record va in **cima** all'array (prepend), così nel Storico appare subito il più recente.

**`rimuovi(id)`:**
```js
function rimuovi(id) {
  _persist(registri.filter(r => r.id !== id))
}
```
Funziona con entrambi i tipi di ID:
- `number` (VINICIUS_DATA, id 0–41)
- `string` UUID (`crypto.randomUUID()`, nuovi record)

`!==` confronta per valore e tipo — non c'è rischio di confondere `0` (number) con `"0"` (string).

### Esempio d'uso

```jsx
export default function DashboardPage() {
  const { registri, aggiungi, rimuovi } = useRegistri()

  // Aggiunge un nuovo record (chiamato da FormInserimento)
  function handleSave(record) {
    aggiungi(record)
  }

  // Rimuove un record (chiamato da Storico)
  function handleDelete(id) {
    rimuovi(id)
  }

  return (
    <>
      <FormInserimento onSave={handleSave} />
      <Storico registri={registri} onDelete={handleDelete} />
    </>
  )
}
```

---

## Perché custom hook invece di stato nel componente?

| Stato nel componente                       | Custom hook                                    |
|--------------------------------------------|------------------------------------------------|
| Logica `localStorage`/`sessionStorage` nel JSX | Separata, testabile, riusabile           |
| Se aggiungo un tab, devo riscrivere        | Hook riusato ovunque con una riga              |
| `useEffect` con `setState` → lint warnings | Lazy initializer → nessun warning              |
| Difficile da leggere (200+ righe in page.jsx) | `page.jsx` ha 3 righe di stato             |

---

## Schema del flusso dati

```
sessionStorage['operaio']
        ↓
  readSession()           ← lib/auth.js
        ↓
  useSession()            ← lib/hooks.js
        ↓
  { operaio, esci }       → DashboardPage (topbar, guard)


localStorage['registri']
        ↓
  useRegistri()           ← lib/hooks.js
        ↓
  { registri, aggiungi, rimuovi }
        ↓
  Dashboard (grafici) + FormInserimento (salva) + Storico (cancella)
```
