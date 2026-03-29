# `app/_components/AppContext.jsx` — Context globale

> ⚠️ `lib/hooks.js` è stato rimosso. Lo stato React è ora gestito tramite `AppContext`.

## Scopo

`AppContext` centralizza tutto lo stato condiviso dell'app dashboard:
- Dati sessione (`operaio`)
- Dati statici da Supabase (`cantieri`, `lavori`, `macchinari`)
- Turni mutabili lato client (`turni`, `aggiungiTurno`, `rimuoviTurno`)
- Stato UI (`tab`, `showEmail`)

I componenti non gestiscono direttamente Supabase né state globale — tutto passa dall'hook `useApp()`.

---

## Come funziona

I dati vengono **fetchati lato server** in `app/dashboard/layout.jsx` (Server Component),
poi passati come props ad `AppProvider` che li espone tramite React Context.

```
Supabase
  ↓  (Server Component: layout.jsx)
AppProvider (props: operaio, cantieri, lavori, macchinari, turni)
  ↓  (React Context)
useApp() → qualsiasi componente client nel dashboard
```

---

## `AppProvider`

```jsx
<AppProvider
  operaio={operaio}
  cantieri={cantieri}
  lavori={lavori}
  macchinari={macchinari}
  turni={turni}
>
  {children}
</AppProvider>
```

Wrappa l'intera dashboard in `layout.jsx`. I turni iniziali vengono caricati dal server
e poi mantenuti nello stato client per aggiunta/rimozione ottimistica senza reload.

---

## `useApp()`

```js
const {
  // UI
  showEmail, handleShowEmail,
  tab, setTab,
  // Sessione
  operaio,
  // Dati statici
  cantieri,
  lavori,
  macchinari,
  // Turni
  turni,
  aggiungiTurno,
  rimuoviTurno,
} = useApp()
```

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `showEmail` | `boolean` | Visibilità modal email |
| `handleShowEmail` | `() => void` | Toggle modal email |
| `tab` | `string` | Tab attiva: `"dashboard"`, `"inserisci"`, `"storico"` |
| `setTab` | `(tab) => void` | Cambia tab |
| `operaio` | `object` | Dati operaio loggato `{ id, nome, cognome }` |
| `cantieri` | `array` | Lista cantieri da Supabase |
| `lavori` | `array` | Lista tipi lavoro da Supabase |
| `macchinari` | `array` | Lista macchinari da Supabase |
| `turni` | `array` | Turni dell'operaio (aggiornabili client-side) |
| `aggiungiTurno` | `(turno) => void` | Prepend turno dopo insert riuscito |
| `rimuoviTurno` | `(id) => void` | Filtra turno dopo delete riuscito |

---

## Esempio d'uso

```jsx
"use client"
import { useApp } from "@/app/_components/AppContext"

export default function MioComponente() {
  const { operaio, turni, cantieri } = useApp()

  return <p>Ciao {operaio.nome}, hai {turni.length} turni</p>
}
```

---

## Aggiornamento ottimistico

Dopo un'operazione riuscita, i turni vengono aggiornati **senza reload della pagina**:

```js
// FormInserimento — dopo insertTurno() riuscito:
aggiungiTurno(result.data)   // aggiunge in cima all'array locale

// Storico — dopo deleteTurno() riuscito:
rimuoviTurno(id)             // filtra dall'array locale
```

I dati su Supabase vengono ri-fetchati al prossimo accesso alla dashboard (reload o nuova sessione).