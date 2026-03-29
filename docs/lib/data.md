# `lib/data.js` — RIMOSSO

> ⚠️ Questo file è stato eliminato durante la migrazione a Supabase.

## Cosa conteneva

- `OPERAI` — array statico degli operai con PIN
- `CANTIERI` — array statico dei cantieri con nome e codice
- `LAVORI` — array statico delle tipologie di lavoro
- `VINICIUS_DATA` — 42 record demo di marzo 2026

## Dove sono finiti i dati

Tutti i dati sono ora in **Supabase** (tabelle `dipendenti`, `cantieri`, `lavori`, `macchinari`)
e vengono fetchati live tramite le Server Actions in `lib/actions.js`:

| Dato | Funzione |
|------|----------|
| Operai / PIN | `loginByPin(pin)` → query `dipendenti` |
| Cantieri | `getCantieri()` → query `cantieri` |
| Lavori | `getLavori()` → query `lavori` |
| Macchinari | `getMacchinari()` → query `macchinari` |
| Turni | `getTurniByDipendente(id)` → query `turni` |

## Schema tabelle Supabase

**cantieri**: `id` (int8), `cantiere` (text), `cod_cantiere` (text)

**lavori**: `id` (int8), `lavoro` (text)

**macchinari**: `id` (int8), `mezzo` (text), `cod_mezzo` (text)

**dipendenti**: `id` (int8), `nome` (text), `cognome` (text), `pin` (int8)

**turni**: `id`, `data`, `orario_inizio` (float8), `orario_fine` (float8), `ore_totali` (float8), `note`, `dipendente_id`, `cantiere_id`, `lavoro_id`, `mezzo_id`, `lavoro_finito`

## Come aggiungere dati

Aggiungere direttamente nel **Table Editor di Supabase** — l'app legge i dati live ad ogni sessione.