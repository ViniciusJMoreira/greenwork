# `lib/auth.js` — Gestione sessione operaio

## Scopo

Centralizza tutto ciò che riguarda **l'identità dell'operaio in sessione**.
Ogni operazione su `sessionStorage` passa per questo file — nessun componente
scrive direttamente `sessionStorage.setItem('operaio', ...)`.

Questo garantisce che la struttura del dato salvato sia sempre coerente
e che basti cambiare qui se in futuro si vuole usare un cookie o un JWT.

---

## Dipendenze

```
lib/auth.js  →  lib/data.js  (OPERAI)
```

---

## Funzioni

### `findByPin(pin)`

Cerca un operaio nell'array `OPERAI` tramite PIN.

```js
findByPin("6130")
// → { nome: "JUNQUEIRA MOREIRA VINICIUS", pin: "6130" }

findByPin("9999")
// → null   (PIN non trovato)

findByPin("")
// → null
```

**Parametri:**

| Nome  | Tipo     | Descrizione                 |
|-------|----------|-----------------------------|
| `pin` | `string` | PIN a 4 cifre come stringa  |

**Ritorna:** `{ nome: string, pin: string } | null`

**Come funziona:**
```js
return OPERAI.find(o => o.pin === pin) ?? null
```

Il confronto è `===` tra stringhe. Se `OPERAI.find()` non trova niente ritorna `undefined`, che viene convertito in `null` dall'operatore `??`. Preferito `null` a `undefined` perché è più esplicito come "non trovato".

**Chi lo usa:**
- `app/login/page.jsx` → dopo ogni 4a cifra digitata nel numpad

---

### `saveSession(operaio)`

Serializza l'oggetto operaio e lo salva in `sessionStorage`.

```js
saveSession({ nome: "JUNQUEIRA MOREIRA VINICIUS", pin: "6130" })
// sessionStorage['operaio'] = '{"nome":"JUNQUEIRA MOREIRA VINICIUS","pin":"6130"}'
```

**Parametri:**

| Nome      | Tipo                          | Descrizione              |
|-----------|-------------------------------|--------------------------|
| `operaio` | `{ nome: string, pin: string }` | Oggetto operaio trovato |

**Ritorna:** `void`

> ⚠️ Funzione **solo browser** — lancia errore se chiamata lato server (SSR).
> È sicura perché viene chiamata solo da event handler (click sul numpad o bottone demo),
> mai durante il rendering.

**Chi lo usa:**
- `app/login/page.jsx` → dopo PIN corretto, prima di `router.push('/dashboard')`

---

### `readSession()`

Legge e deserializza l'operaio da `sessionStorage`.
**Sicura per SSR**: controlla `typeof window === 'undefined'` prima di accedere.

```js
// Nel browser, dopo login:
readSession()
// → { nome: "JUNQUEIRA MOREIRA VINICIUS", pin: "6130" }

// Nel browser, prima del login (o dopo esci):
readSession()
// → null

// Sul server (Next.js SSR):
readSession()
// → null   (non lancia errore)
```

**Parametri:** nessuno

**Ritorna:** `{ nome: string, pin: string } | null`

**Come funziona:**
```js
if (typeof window === 'undefined') return null
const raw = sessionStorage.getItem('operaio')
return raw ? JSON.parse(raw) : null
```

**Chi lo usa:**
- `lib/hooks.js` → `useSession()` come initializer dello state: `useState(readSession)`
- `lib/hooks.js` → `useRegistri()` per sapere chi è loggato e fare il seed Vinicius

---

### `clearSession()`

Rimuove l'operaio da `sessionStorage`. Equivale al logout.

```js
clearSession()
// sessionStorage['operaio'] → rimosso
```

**Parametri:** nessuno

**Ritorna:** `void`

**Chi lo usa:**
- `lib/hooks.js` → `useSession()` → funzione `esci()`

---

## Ciclo di vita della sessione

```
[Login Page]
  utente digita PIN
    → findByPin(pin)
      → trovato? → saveSession(operaio) → router.push('/dashboard')
      → non trovato? → shake + errore

[Dashboard Page — primo render]
  useSession() → useState(readSession)
    → operaio trovato? → mostra app
    → null? → useEffect → router.replace('/login')

[Bottone Esci]
  esci() → clearSession() → router.replace('/login')
```

---

## Perché `sessionStorage` e non `localStorage`?

| `sessionStorage`                              | `localStorage`                          |
|-----------------------------------------------|-----------------------------------------|
| Cancellato alla chiusura della scheda/browser | Persiste indefinitamente                |
| Privato per scheda (non condiviso tra tab)    | Condiviso tra tutte le schede           |
| Adatto per "sessione di login"                | Adatto per preferenze utente persistenti|

I **registri ore** usano `localStorage` (vedi `hooks.js`) perché devono persistere.
La **sessione di login** usa `sessionStorage` perché deve scadere alla chiusura della scheda.

---

## Sicurezza

Il PIN è una **barriera d'accesso leggera**, non un sistema di autenticazione sicuro:
- I PIN sono nel bundle JavaScript lato client (in `lib/data.js`)
- Non c'è crittografia o hashing
- Non c'è un backend che valida le credenziali

**Questo è sufficiente** per un'app interna usata da operai fidati su dispositivi aziendali.
Non è adatta per dati sensibili o accesso pubblico a Internet.
