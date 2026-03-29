# `lib/auth.js` — Gestione sessione operaio

## Scopo

Centralizza tutto ciò che riguarda **l'identità dell'operaio in sessione**.
La sessione è gestita tramite **httpOnly cookie** lato server — non accessibile da JavaScript nel browser.

---

## Dipendenze

```
lib/auth.js  →  next/headers  (cookies)
```

Questo file usa `next/headers` — è utilizzabile **solo in Server Components e Server Actions**.
Non importarlo mai in componenti client (`"use client"`).

---

## Cookie

```
Nome:     gw_operaio
Tipo:     httpOnly, SameSite: lax
Valore:   JSON stringificato dell'oggetto operaio
```

Il flag `httpOnly` impedisce l'accesso al cookie da JavaScript lato browser — protezione XSS.

---

## Funzioni

### `saveSessionCookie(operaio)`

Scrive il cookie di sessione con i dati dell'operaio.

```js
await saveSessionCookie({ id: 3, nome: "MARIO", cognome: "ROSSI", pin: 1234 })
// cookie gw_operaio = '{"id":3,"nome":"MARIO","cognome":"ROSSI","pin":1234}'
```

**Chi lo usa:**
- `lib/actions.js` → `loginByPin()` dopo PIN verificato su Supabase

---

### `readSessionCookie()`

Legge e deserializza il cookie di sessione.

```js
await readSessionCookie()
// → { id: 3, nome: "MARIO", cognome: "ROSSI", pin: 1234 }

// Se non loggato:
await readSessionCookie()
// → null
```

**Chi lo usa:**
- `app/dashboard/layout.jsx` → verifica sessione e fetcha i turni dell'operaio

---

### `clearSessionCookie()`

Rimuove il cookie di sessione. Equivale al logout.

```js
await clearSessionCookie()
// cookie gw_operaio → rimosso
```

**Chi lo usa:**
- `lib/actions.js` → `logout()` prima del redirect a `/login`

---

## Ciclo di vita della sessione

```
[Login Page]
  utente digita PIN
    → loginByPin(pin)       ← actions.js
      → query Supabase dipendenti
        → trovato? → saveSessionCookie(operaio) → redirect /dashboard
        → non trovato? → { success: false }

[dashboard/layout.jsx — Server Component]
  readSessionCookie()
    → operaio trovato? → fetcha dati → passa ad AppProvider
    → null? → redirect("/login")

[Bottone Esci — Header]
  logout()                  ← actions.js
    → clearSessionCookie() → redirect("/login")
```

---

## Perché httpOnly cookie e non sessionStorage?

| httpOnly cookie (attuale)                     | sessionStorage (vecchio approccio)         |
|-----------------------------------------------|--------------------------------------------|
| Gestito server-side, sicuro da XSS            | Accessibile da qualsiasi script JS         |
| Compatibile con Server Components Next.js     | Solo browser, non leggibile lato server    |
| Persiste tra tab (stessa sessione browser)    | Privato per scheda                         |
| Leggibile in layout.jsx per fetch dati        | Non leggibile in Server Components         |