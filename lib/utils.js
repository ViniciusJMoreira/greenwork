import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converte "HH:MM" in minuti totali
 */
export function timeToMin(timeStr) {
  if (!timeStr && timeStr !== 0) return 0;
  if (typeof timeStr === "number") return Math.round(timeStr * 60);
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Calcola i minuti tra inizio e fine (gestisce il passaggio a mezzanotte)
 */
export function calcMin(inizio, fine) {
  if (!inizio || !fine) return 0;
  const start = timeToMin(inizio);
  const end = timeToMin(fine);
  const diff = end - start;
  return diff < 0 ? diff + 24 * 60 : diff;
}

/**
 * Formatta i minuti in stringa "X h YY min" oppure "X,XX h"
 */
export function fmtOre(minuti) {
  if (!minuti || minuti <= 0) return "0 h";
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

/**
 * Formatta i minuti in numero decimale (es. 90 min → "1,50")
 */
export function fmtOreDecimale(minuti) {
  if (!minuti || minuti <= 0) return "0,00";
  return (minuti / 60).toFixed(2).replace(".", ",");
}

/**
 * Converte i minuti in ore decimali float (es. 90 → 1.5, 150 → 2.5)
 * Usato per il payload verso Apps Script (campo oreDecimali)
 */
export function minToDecimal(minuti) {
  if (!minuti || minuti <= 0) return 0;
  return Math.round((minuti / 60) * 100) / 100;
}

/**
 * Restituisce la data odierna in formato "DD/MM/YYYY"
 */
export function oggi() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formatta una data ISO o "DD/MM/YYYY" in "GG Mon YYYY" per visualizzazione
 */
export function fmtData(dataStr) {
  if (!dataStr) return "";
  const mesi = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  let d;
  if (dataStr.includes("/")) {
    const [dd, mm, yyyy] = dataStr.split("/");
    d = new Date(yyyy, mm - 1, dd);
  } else {
    d = new Date(dataStr);
  }
  return `${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
}
