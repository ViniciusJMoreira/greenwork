"use server";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";
import { calcMin, minToDecimal } from "./utils";
import {
  saveSessionCookie,
  clearSessionCookie,
} from "./auth";

// Verifica il PIN, salva il cookie e reindirizza al dashboard
export async function loginByPin(pin) {
  const { data, error } = await supabase
    .from("dipendenti")
    .select("id, nome, cognome, pin, ruolo")
    .eq("pin", Number(pin))
    .single();

  if (error || !data) return { success: false };

  await saveSessionCookie(data);
  return { success: true };
}

// Logout — cancella il cookie e reindirizza al login
export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}

// Restituisce i cantieri attivi
export async function getCantieri() {
  const { data, error } = await supabase
    .from("cantieri")
    .select("*")
    .eq("attivo", true)
    .order("id");

  if (error) return [];
  return data;
}

// Restituisce i tipi di lavoro attivi
export async function getLavori() {
  const { data, error } = await supabase
    .from("lavori")
    .select("*")
    .eq("attivo", true)
    .order("id");

  if (error) return [];
  return data;
}

// Restituisce i macchinari attivi
export async function getMacchinari() {
  const { data, error } = await supabase
    .from("macchinari")
    .select("*")
    .eq("attivo", true)
    .order("id");

  if (error) return [];
  return data;
}

// Inserisce un turno in Supabase
export async function insertTurno(turno) {
  const { values, cantiereObj, macchinarioObj, operaio } = turno;

  // Calcola ore totali in decimale (es. "08:30" e "17:00" → 8.5)
  const ore_totali = minToDecimal(calcMin(values.inizio, values.fine));

  // 1. Salva in Supabase
  const { data, error } = await supabase
    .from("turni")
    .insert({
      data: values.data,
      orario_inizio: values.inizio ?? null,
      orario_fine: values.fine ?? null,
      ore_totali: ore_totali ?? null,
      note: values.note ?? null,
      dipendente_id: operaio?.id,
      cantiere_id: cantiereObj?.id,
      lavoro_id: values.lavoro_id ? Number(values.lavoro_id) : null,
      mezzo_id: macchinarioObj?.id ?? null,
      lavoro_finito: values.lavoro_finito ?? null,
      ore_mezzo: values.ore_mezzo ? parseFloat(values.ore_mezzo) : null,
      km_totale: values.km_totale ? parseFloat(values.km_totale) : null,
      km_percorso: values.km_percorso || null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Recupera il turno con join per normalizzarlo
  const { data: turnoCompleto } = await supabase
    .from("turni")
    .select(
      `*, cantieri ( cantiere, cod_cantiere ), lavori ( lavoro ), macchinari ( mezzo, cod_mezzo )`,
    )
    .eq("id", data.id)
    .single();


  return { success: true, data: normalizzaTurno(turnoCompleto ?? data) };
}

// Normalizza un turno Supabase nel formato atteso da stats.js e componenti
function normalizzaTurno(t) {
  return {
    id: t.id,
    data: t.data,
    cantiere: t.cantieri?.cantiere,
    codice: t.cantieri?.cod_cantiere,
    lavoro: t.lavori?.lavoro,
    mezzo: t.macchinari?.mezzo ?? null,
    inizio: t.orario_inizio,
    fine: t.orario_fine,
    ore_totali: t.ore_totali,
    note: t.note,
    lavoro_finito: t.lavoro_finito ?? null,
    dipendente_id: t.dipendente_id,
    cantiere_id: t.cantiere_id,
    lavoro_id: t.lavoro_id,
    mezzo_id: t.mezzo_id ?? null,
    ore_mezzo: t.ore_mezzo ?? null,
    km_totale: t.km_totale ?? null,
    km_percorso: t.km_percorso ?? null,
  };
}

// Restituisce i turni di un dipendente normalizzati
export async function getTurniByDipendente(dipendente_id) {
  const { data, error } = await supabase
    .from("turni")
    .select(
      `
      *,
      cantieri ( cantiere, cod_cantiere ),
      lavori ( lavoro ),
      macchinari ( mezzo, cod_mezzo )
    `,
    )
    .eq("dipendente_id", dipendente_id)
    .order("data", { ascending: false });

  if (error) return [];
  return data.map(normalizzaTurno);
}

// Restituisce tutti i turni di tutti i dipendenti (solo per responsabile)
export async function getAllTurni() {
  const { data, error } = await supabase
    .from("turni")
    .select(
      `
      *,
      cantieri ( cantiere, cod_cantiere ),
      lavori ( lavoro ),
      macchinari ( mezzo, cod_mezzo ),
      dipendenti ( id, nome, cognome )
    `,
    )
    .order("data", { ascending: false });

  if (error) return [];
  return data.map((t) => ({
    ...normalizzaTurno(t),
    nome_operaio: t.dipendenti
      ? t.dipendenti.nome + " " + t.dipendenti?.cognome
      : "—",
  }));
}

// Restituisce i dipendenti attivi (solo per responsabile)
export async function getDipendenti() {
  const { data, error } = await supabase
    .from("dipendenti")
    .select("id, nome, cognome, pin, ruolo")
    .eq("attivo", true)
    .order("cognome");
  if (error) return [];
  return data;
}

// Aggiorna un turno esistente
export async function updateTurno(id, turno) {
  const { values, cantiereObj, macchinarioObj } = turno;

  const ore_totali = minToDecimal(calcMin(values.inizio, values.fine));

  const { error } = await supabase
    .from("turni")
    .update({
      data: values.data,
      orario_inizio: values.inizio ?? null,
      orario_fine: values.fine ?? null,
      ore_totali: ore_totali ?? null,
      note: values.note ?? null,
      cantiere_id: cantiereObj?.id,
      lavoro_id: values.lavoro_id ? Number(values.lavoro_id) : null,
      mezzo_id: macchinarioObj?.id ?? null,
      lavoro_finito: values.lavoro_finito ?? null,
      ore_mezzo: values.ore_mezzo ? parseFloat(values.ore_mezzo) : null,
      km_totale: values.km_totale ? parseFloat(values.km_totale) : null,
      km_percorso: values.km_percorso || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  const { data: turnoCompleto } = await supabase
    .from("turni")
    .select(`*, cantieri ( cantiere, cod_cantiere ), lavori ( lavoro ), macchinari ( mezzo, cod_mezzo )`)
    .eq("id", id)
    .single();

  return { success: true, data: normalizzaTurno(turnoCompleto) };
}

// Elimina un turno per id
export async function deleteTurno(id) {
  const { error } = await supabase.from("turni").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Aggiorna lat, lng e area_geojson di un cantiere
export async function updateCantierePosizione(id, { lat, lng, area_geojson }) {
  const { data, error } = await supabase
    .from("cantieri")
    .update({ lat, lng, area_geojson })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ── Anagrafica — insert ────────────────────────────────────────────────────

export async function insertCantiere({ cantiere, cod_cantiere, isAssenza }) {
  const { data, error } = await supabase
    .from("cantieri")
    .insert({ cantiere: cantiere.trim(), cod_cantiere: cod_cantiere.trim(), isAssenza: !!isAssenza })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function insertDipendente({ nome, cognome, pin, ruolo }) {
  const { data, error } = await supabase
    .from("dipendenti")
    .insert({ nome: nome.trim(), cognome: cognome.trim(), pin: Number(pin), ruolo })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function insertLavoro({ lavoro }) {
  const { data, error } = await supabase
    .from("lavori")
    .insert({ lavoro: lavoro.trim() })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function insertMacchinario({ mezzo, cod_mezzo }) {
  const { data, error } = await supabase
    .from("macchinari")
    .insert({ mezzo: mezzo.trim(), cod_mezzo: cod_mezzo.trim() })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateDipendente(id, { nome, cognome, pin, ruolo }) {
  const { data, error } = await supabase
    .from("dipendenti")
    .update({ nome: nome.trim(), cognome: cognome.trim(), pin: Number(pin), ruolo })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateCantiere(id, { cantiere, cod_cantiere, isAssenza }) {
  const { data, error } = await supabase
    .from("cantieri")
    .update({ cantiere: cantiere.trim(), cod_cantiere: cod_cantiere.trim(), isAssenza: !!isAssenza })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateLavoro(id, { lavoro }) {
  const { data, error } = await supabase
    .from("lavori")
    .update({ lavoro: lavoro.trim() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateMacchinario(id, { mezzo, cod_mezzo }) {
  const { data, error } = await supabase
    .from("macchinari")
    .update({ mezzo: mezzo.trim(), cod_mezzo: cod_mezzo.trim() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function deleteDipendente(id) {
  const { error } = await supabase.from("dipendenti").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteCantiere(id) {
  const { error } = await supabase.from("cantieri").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteLavoro(id) {
  const { error } = await supabase.from("lavori").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMacchinario(id) {
  const { error } = await supabase.from("macchinari").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Anagrafica — archivia (attivo = false) ────────────────────────────────

export async function archiviaDipendente(id) {
  const { error } = await supabase.from("dipendenti").update({ attivo: false }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function archiviaCantiere(id) {
  const { error } = await supabase.from("cantieri").update({ attivo: false }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function archiviaLavoro(id) {
  const { error } = await supabase.from("lavori").update({ attivo: false }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function archiviaMacchinario(id) {
  const { error } = await supabase.from("macchinari").update({ attivo: false }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Anagrafica — ripristina (attivo = true) ───────────────────────────────

export async function ripristinaDipendente(id) {
  const { data, error } = await supabase
    .from("dipendenti").update({ attivo: true }).eq("id", id)
    .select("id, nome, cognome, pin, ruolo").single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function ripristinaCantiere(id) {
  const { data, error } = await supabase
    .from("cantieri").update({ attivo: true }).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function ripristinaLavoro(id) {
  const { data, error } = await supabase
    .from("lavori").update({ attivo: true }).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function ripristinaMacchinario(id) {
  const { data, error } = await supabase
    .from("macchinari").update({ attivo: true }).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ── Anagrafica — fetch archiviati ─────────────────────────────────────────

export async function getArchiviatiDipendenti() {
  const { data, error } = await supabase
    .from("dipendenti").select("id, nome, cognome, pin, ruolo")
    .eq("attivo", false).order("nome");
  if (error) return [];
  return data;
}

export async function getArchiviatiCantieri() {
  const { data, error } = await supabase
    .from("cantieri").select("*").eq("attivo", false).order("id");
  if (error) return [];
  return data;
}

export async function getArchiviatiLavori() {
  const { data, error } = await supabase
    .from("lavori").select("*").eq("attivo", false).order("id");
  if (error) return [];
  return data;
}

export async function getArchiviatiMacchinari() {
  const { data, error } = await supabase
    .from("macchinari").select("*").eq("attivo", false).order("id");
  if (error) return [];
  return data;
}
