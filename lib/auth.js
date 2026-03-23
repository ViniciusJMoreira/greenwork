import { OPERAI } from './data'

/**
 * Cerca un operaio per PIN. Restituisce l'oggetto operaio o null.
 * @param {string} pin
 * @returns {{ nome: string, pin: string } | null}
 */
export function findByPin(pin) {
  return OPERAI.find((o) => o.pin === pin) ?? null
}

/**
 * Salva l'operaio in sessionStorage.
 * @param {{ nome: string, pin: string }} operaio
 */
export function saveSession(operaio) {
  sessionStorage.setItem('operaio', JSON.stringify(operaio))
}

/**
 * Legge l'operaio dalla sessionStorage. Restituisce null se assente.
 * @returns {{ nome: string, pin: string } | null}
 */
export function readSession() {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem('operaio')
  return raw ? JSON.parse(raw) : null
}

/**
 * Cancella la sessione.
 */
export function clearSession() {
  sessionStorage.removeItem('operaio')
}
