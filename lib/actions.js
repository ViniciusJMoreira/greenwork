"use server";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";
import { calcMin, minToDecimal } from "./utils";
import { saveOreToSheets } from "./sheets";
import {
  saveSessionCookie,
  clearSessionCookie,
  readSessionCookie,
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

// Restituisce tutti i cantieri
export async function getCantieri() {
  const { data, error } = await supabase
    .from("cantieri")
    .select("*")
    .order("id");

  if (error) return [];
  return data;
}

// Restituisce tutti i tipi di lavoro
export async function getLavori() {
  const { data, error } = await supabase.from("lavori").select("*").order("id");

  if (error) return [];
  return data;
}

// Restituisce tutti i macchinari
export async function getMacchinari() {
  const { data, error } = await supabase
    .from("macchinari")
    .select("*")
    .order("id");

  if (error) return [];
  return data;
}

// Inserisce un turno in Supabase e scrive su Google Sheets
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
      lavoro_id: Number(values.lavoro_id) ?? null,
      mezzo_id: macchinarioObj?.id ?? null,
      lavoro_finito: values.lavoro_finito ?? null,
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

  // 2. Scrive su Google Sheets tramite Apps Script
  try {
    await saveOreToSheets({
      data: values.data,
      cantiere: cantiereObj?.cantiere,
      codice: cantiereObj?.cod_cantiere,
      oreDecimali: ore_totali ?? null,
      pin: operaio?.pin,
      inizio: values.inizio ?? null,
      fine: values.fine ?? null,
    });
  } catch (err) {
    // Sheets fallito — rollback del turno in Supabase per evitare dati incoerenti
    console.error("[insertTurno] Errore Sheets:", err.message);
    await supabase.from("turni").delete().eq("id", data.id);
    return {
      success: false,
      error: "Errore sincronizzazione Sheets. Riprova.",
    };
  }

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

// Converte ore decimali float8 (es. 18.5) in stringa "HH:MM" per Apps Script
function decimalToTime(dec) {
  if (dec === null || dec === undefined) return null;
  const totalMin = Math.round(dec * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Elimina un turno per id — sincronizza la cancellazione su Sheets
export async function deleteTurno(id) {
  // Legge sessione per ottenere il PIN senza join incerto su dipendenti
  const operaio = await readSessionCookie();
  if (!operaio) return { success: false, error: "Sessione scaduta" };

  // Legge il turno completo prima di cancellarlo
  const { data: turno, error: fetchError } = await supabase
    .from("turni")
    .select(`*, cantieri ( cantiere, cod_cantiere )`)
    .eq("id", id)
    .single();

  if (fetchError) return { success: false, error: fetchError.message };

  // Sincronizza cancellazione su Sheets
  try {
    await saveOreToSheets({
      action: "delete",
      data: turno.data,
      cantiere: turno.cantieri?.cantiere,
      codice: turno.cantieri?.cod_cantiere,
      oreDecimali: turno.ore_totali,
      pin: operaio.pin,
      inizio: turno.orario_inizio ?? null,
      fine: turno.orario_fine ?? null,
    });
  } catch (err) {
    console.error("[deleteTurno] Errore Sheets:", err.message);
    return {
      success: false,
      error: "Errore sincronizzazione Sheets. Riprova.",
    };
  }

  // Cancella da Supabase
  const { error } = await supabase.from("turni").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
