import { calcMin, fmtOreDecimale } from './utils'

/**
 * Statistiche aggregate sui registri.
 * @param {Array} registri
 * @returns {{ minutiTotali, giorniSet, giorniLavorati, numCantieri }}
 */
export function getStats(registri) {
  const minutiTotali = registri.reduce((acc, r) => acc + calcMin(r.inizio, r.fine), 0)
  const giorniSet = new Set(registri.map((r) => r.data))
  const numCantieri = new Set(registri.map((r) => r.cantiere)).size
  return { minutiTotali, giorniSet, giorniLavorati: giorniSet.size, numCantieri }
}

/**
 * Dati per il BarChart (ultimi N giorni, default 7).
 * @param {Array} registri
 * @param {number} limit
 * @returns {Array<{ data: string, ore: number }>}
 */
export function getOrePerGiorno(registri, limit = 7) {
  const giorniSet = new Set(registri.map((r) => r.data))
  return Array.from(giorniSet)
    .sort()
    .slice(-limit)
    .map((d) => ({
      data: d.slice(5), // "MM-DD"
      ore: parseFloat(
        fmtOreDecimale(
          registri
            .filter((r) => r.data === d)
            .reduce((acc, r) => acc + calcMin(r.inizio, r.fine), 0),
        ).replace(',', '.'),
      ),
    }))
}

/**
 * Dati aggregati per cantiere, ordinati per ore desc.
 * @param {Array} registri
 * @returns {Array<{ nome: string, min: number, ore: number }>}
 */
export function getPieData(registri) {
  const map = {}
  registri.forEach((r) => {
    map[r.cantiere] = (map[r.cantiere] || 0) + calcMin(r.inizio, r.fine)
  })
  return Object.entries(map)
    .map(([nome, min]) => ({
      nome,
      min,
      ore: parseFloat(fmtOreDecimale(min).replace(',', '.')),
    }))
    .sort((a, b) => b.min - a.min)
}

/**
 * Ore aggregate per tipo lavoro, filtrate per lista nomi.
 * @param {Array} registri
 * @param {string[]} nomiLavori
 * @returns {Array<{ nome: string, min: number, ore: number }>}
 */
export function getOreLavori(registri, nomiLavori) {
  const set = new Set(nomiLavori)
  const map = {}
  registri.forEach((r) => {
    if (!r.lavoro || !set.has(r.lavoro)) return
    map[r.lavoro] = (map[r.lavoro] || 0) + calcMin(r.inizio, r.fine)
  })
  return Object.entries(map)
    .map(([nome, min]) => ({
      nome,
      min,
      ore: parseFloat(fmtOreDecimale(min).replace(',', '.')),
    }))
    .sort((a, b) => b.min - a.min)
}

/**
 * Raggruppa i registri per data (ISO desc) con totale minuti per giorno.
 * @param {Array} registri
 * @returns {Array<{ data: string, records: Array, totMin: number }>}
 */
export function getStoricoGruppi(registri) {
  const giorniSet = new Set(registri.map((r) => r.data))
  return Array.from(giorniSet)
    .sort((a, b) => (a > b ? -1 : 1))
    .map((d) => {
      const records = registri.filter((r) => r.data === d)
      const totMin = records.reduce((acc, r) => acc + calcMin(r.inizio, r.fine), 0)
      return { data: d, records, totMin }
    })
}
