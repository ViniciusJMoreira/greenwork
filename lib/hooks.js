'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VINICIUS_DATA } from './data'
import { readSession, clearSession } from './auth'

/**
 * Gestisce la sessione dell'operaio.
 *
 * Inizia con null sia su server che su client (evita hydration mismatch).
 * Dopo il mount, legge sessionStorage e aggiorna lo stato.
 * Se non c'è sessione valida, reindirizza a /login.
 */
export function useSession() {
  const router = useRouter()
  const [operaio, setOperaio] = useState(null) // null consistente su server e client

  useEffect(() => {
    const op = readSession()
    if (op) {
      setOperaio(op) // eslint-disable-line react-hooks/set-state-in-effect
    } else {
      router.replace('/login')
    }
  }, [router])

  function esci() {
    clearSession()
    router.replace('/login')
  }

  return { operaio, esci }
}

/**
 * Gestisce i registri ore in localStorage.
 *
 * Inizia con array vuoto sia su server che su client (evita hydration mismatch).
 * Dopo il mount, legge localStorage. Se Vinicius e nessun dato salvato → seed demo.
 */
export function useRegistri() {
  const [registri, setRegistri] = useState([]) // [] consistente su server e client

  useEffect(() => {
    const saved = localStorage.getItem('registri')
    if (saved) {
      setRegistri(JSON.parse(saved)) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }
    // Seed demo per Vinicius al primo accesso
    const op = readSession()
    if (op?.nome === 'JUNQUEIRA MOREIRA VINICIUS') {
      localStorage.setItem('registri', JSON.stringify(VINICIUS_DATA))
      setRegistri(VINICIUS_DATA) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [])

  function _persist(nuovi) {
    setRegistri(nuovi)
    localStorage.setItem('registri', JSON.stringify(nuovi))
  }

  function aggiungi(record) {
    _persist([record, ...registri])
  }

  function rimuovi(id) {
    _persist(registri.filter((r) => r.id !== id))
  }

  return { registri, aggiungi, rimuovi }
}
