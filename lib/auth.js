import { cookies } from "next/headers";

const COOKIE_NAME = "gw_operaio";

/**
 * Salva il dipendente in un cookie httpOnly (solo server).
 * @param {{ id, nome, cognome, pin }} operaio
 */
export async function saveSessionCookie(operaio) {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(operaio), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 ore
  });
}

/**
 * Legge il dipendente dal cookie. Restituisce null se assente.
 * @returns {{ id, nome, cognome, pin } | null}
 */
export async function readSessionCookie() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  return raw ? JSON.parse(raw) : null;
}

/**
 * Cancella il cookie di sessione.
 */
export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}