import { readSessionCookie } from "@/lib/auth";
import { getAllTurni, getDipendenti, getCantieri, getMacchinari } from "@/lib/actions";
import ExcelJS from "exceljs";

const MESI       = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_ABB = ["dom","lun","mar","mer","gio","ven","sab"];

function giorniNelMese(meseStr) {
  const [y, m] = meseStr.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function fill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

const thin   = { style: "thin",   color: { argb: "FF000000" } };
const medium = { style: "medium", color: { argb: "FF000000" } };

function mkBorder(right = "thin") {
  return { top: thin, bottom: thin, left: thin, right: right === "medium" ? medium : thin };
}

// Ore tra le 22:00 e le 06:00 — identica alla logica AppScript
function calcolaOreNotte(inizioStr, fineStr) {
  if (!inizioStr || !fineStr) return 0;
  function toMin(s) {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  }
  let ini = toMin(inizioStr);
  let fin = toMin(fineStr);
  const overnight = fin <= ini;
  if (overnight) fin += 24 * 60;

  // fascia 22:00-24:00
  const n1 = Math.max(0, Math.min(fin, 24 * 60) - Math.max(ini, 22 * 60));
  // fascia 00:00-06:00 (solo se turno a cavallo della mezzanotte)
  const w2Start = overnight ? 24 * 60 : 0;
  const w2End   = overnight ? 30 * 60 : 6 * 60;
  const n2 = Math.max(0, Math.min(fin, w2End) - Math.max(ini, w2Start));

  return parseFloat(((n1 + n2) / 60).toFixed(4));
}

// ── Riga 1: labels + numeri giorno (interi, non Date) + TOT MESE ──────────
function addHeaderRow(ws, labels, nGiorni) {
  const nFixed = labels.length;
  const totCol = nFixed + nGiorni + 1;

  const row = ws.addRow([...labels, ...Array.from({ length: nGiorni }, (_, i) => i + 1), "TOT\nMESE"]);
  row.height = 28;

  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    if (col === totCol) {
      cell.fill   = fill("FF0C0C0C");
      cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Arial" };
      cell.border = mkBorder("medium");
    } else {
      cell.fill   = fill("FFFFFFFF");
      cell.font   = { bold: true, color: { argb: "FF000000" }, size: 9, name: "Arial" };
      cell.border = mkBorder(col === nFixed || col === totCol - 1 ? "medium" : "thin");
    }
  });
}

// ── Riga gialla dipendente: nome+cod nei fissi, abbreviazioni nei giorni ───
function addYellowRow(ws, fixedValues, nGiorni, anno, mese) {
  const nFixed = fixedValues.length;
  const totCol = nFixed + nGiorni + 1;
  const abbr   = Array.from({ length: nGiorni }, (_, i) =>
    GIORNI_ABB[new Date(anno, mese - 1, i + 1).getDay()]
  );

  const row = ws.addRow([...fixedValues, ...abbr, ""]);
  row.height = 18;

  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.fill   = fill("FFFFFF00"); // giallo originale
    cell.font   = { bold: true, color: { argb: "FF000000" }, size: 9, name: "Arial" };
    cell.border = mkBorder(col === nFixed || col === totCol - 1 ? "medium" : "thin");
    cell.alignment = { horizontal: col <= nFixed ? "left" : "center", vertical: "middle" };
  });
}

// ── Riga dati (cantiere/mezzo/km) ─────────────────────────────────────────
// opts.isNight = true  → colore rosso sulla colonna opts.redCol (1-based)
function addDataRow(ws, values, nGiorni, nFixed, opts = {}) {
  const totCol = nFixed + nGiorni + 1;
  const row    = ws.addRow(values);
  row.height   = 17;

  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.fill = fill("FFFFFFFF");

    if (col === totCol) {
      cell.font      = { bold: true, size: 9, name: "Arial", color: { argb: "FF000000" } };
      cell.border    = mkBorder("medium");
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (!cell.value) cell.value = null;
    } else if (col <= nFixed) {
      const isRed = opts.isNight && col === opts.redCol;
      cell.font      = { size: 9, name: "Arial", color: { argb: isRed ? "FFCC0000" : "FF000000" } };
      cell.border    = mkBorder(col === nFixed ? "medium" : "thin");
      cell.alignment = { horizontal: "left", vertical: "middle" };
    } else {
      if (!cell.value || cell.value === 0) cell.value = null;
      cell.font      = { size: 9, name: "Arial", color: { argb: "FF000000" } };
      cell.border    = mkBorder(col === totCol - 1 ? "medium" : "thin");
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });
}

// ── Foglio Contabilità ─────────────────────────────────────────────────────
// Assenze escluse; usa ore_totali (diurne + notturne sommate)
function addFoglioContabilita(wb, turniMese, dipendenti, cantieri, meseStr) {
  const ws      = wb.addWorksheet(`Contabilità ${meseStr}`);
  const nGiorni = giorniNelMese(meseStr);
  const [y, m]  = meseStr.split("-").map(Number);
  const nFixed  = 3;

  ws.columns = [
    { key: "a", width: 22 },
    { key: "b", width: 15 },
    { key: "c", width: 30 },
    ...Array.from({ length: nGiorni }, () => ({ width: 4.2 })),
    { key: "tot", width: 10 },
  ];

  addHeaderRow(ws, ["DIPENDENTE", "COD. DIPENDENTE", "CANTIERE"], nGiorni);

  dipendenti.forEach((dip) => {
    const turniDip = turniMese.filter((t) => String(t.dipendente_id) === String(dip.id));
    if (!turniDip.length) return;

    const map = {};
    turniDip.forEach((t) => {
      const cant = cantieri.find((c) => String(c.id) === String(t.cantiere_id));
      if (cant?.isAssenza) return; // assenze escluse dalla contabilità
      const key = t.cantiere || "—";
      if (!map[key]) map[key] = Array(nGiorni).fill(0);
      const g = parseInt(t.data?.split("-")[2]) - 1;
      if (g >= 0 && g < nGiorni) map[key][g] += t.ore_totali || 0;
    });

    if (!Object.keys(map).length) return;

    const nomeDip = `${dip.cognome?.toUpperCase()} ${dip.nome?.[0]}.`;
    addYellowRow(ws, [nomeDip, String(dip.pin || ""), ""], nGiorni, y, m);

    Object.entries(map).forEach(([nomeCantiere, ore]) => {
      const tot = ore.reduce((a, b) => a + b, 0);
      addDataRow(ws, ["", "", nomeCantiere, ...ore, tot || null], nGiorni, nFixed);
    });
  });

  ws.views = [{ state: "frozen", ySplit: 1, xSplit: nFixed }];
}

// ── Foglio Buste Paghe ─────────────────────────────────────────────────────
// Assenze → lettera nella cella giorno (riga LET)
// Ore notturne (22-06) → sub-riga con COD. CANTIERE in rosso
function addFoglioBustePaghe(wb, turniMese, dipendenti, cantieri, macchinari, meseStr) {
  const ws      = wb.addWorksheet(`Buste Paghe ${meseStr}`);
  const nGiorni = giorniNelMese(meseStr);
  const [y, m]  = meseStr.split("-").map(Number);
  const nFixed  = 4;

  ws.columns = [
    { key: "a", width: 22 },
    { key: "b", width: 15 },
    { key: "c", width: 20 },
    { key: "d", width: 13 },
    ...Array.from({ length: nGiorni }, () => ({ width: 4.2 })),
    { key: "tot", width: 10 },
  ];

  addHeaderRow(ws, ["DIPENDENTE", "COD. DIPENDENTE", "COD. CANTIERE", "COD. MEZZO"], nGiorni);

  dipendenti.forEach((dip) => {
    const turniDip = turniMese.filter((t) => String(t.dipendente_id) === String(dip.id));
    if (!turniDip.length) return;

    // Turni regolari: aggregati per (cod_cantiere || cod_mezzo)
    const mapReg = {};
    // Assenze: lettera per giorno (null = nessuna assenza quel giorno)
    const assenzaGiorni = Array(nGiorni).fill(null);

    turniDip.forEach((t) => {
      const cant      = cantieri.find((c) => String(c.id) === String(t.cantiere_id));
      const isAssenza = cant?.isAssenza || false;
      const g         = parseInt(t.data?.split("-")[2]) - 1;
      if (g < 0 || g >= nGiorni) return;

      if (isAssenza) {
        assenzaGiorni[g] = cant.cod_cantiere; // "BG", "PR", "FR"...
      } else {
        const mezzo       = macchinari.find((mc) => String(mc.id) === String(t.mezzo_id));
        const codCantiere = cant?.cod_cantiere || "—";
        const codMezzo    = mezzo?.cod_mezzo   || "";
        const key         = `${codCantiere}||${codMezzo}`;

        if (!mapReg[key]) mapReg[key] = {
          codCantiere,
          codMezzo,
          giorni:      Array(nGiorni).fill(0), // ore diurne
          giorniNotte: Array(nGiorni).fill(0), // ore notturne 22-06
        };

        const oreNotte  = calcolaOreNotte(t.inizio, t.fine);
        const oreGiorno = Math.max(0, parseFloat(((t.ore_totali || 0) - oreNotte).toFixed(4)));
        mapReg[key].giorni[g]      += oreGiorno;
        mapReg[key].giorniNotte[g] += oreNotte;
      }
    });

    const hasData = Object.keys(mapReg).length > 0 || assenzaGiorni.some(Boolean);
    if (!hasData) return;

    const nomeDip = `${dip.cognome?.toUpperCase()} ${dip.nome?.[0]}.`;
    addYellowRow(ws, [nomeDip, String(dip.pin || ""), "", ""], nGiorni, y, m);

    // Righe cantieri (ore diurne + eventuale sub-riga notturna in rosso)
    Object.values(mapReg).forEach((v) => {
      const tot = v.giorni.reduce((a, b) => a + b, 0);
      addDataRow(ws, ["", "", v.codCantiere, v.codMezzo, ...v.giorni, tot || null], nGiorni, nFixed);

      const totNotte = v.giorniNotte.reduce((a, b) => a + b, 0);
      if (totNotte > 0) {
        // Sub-riga notturna: stesso cantiere/mezzo, COD. CANTIERE in rosso
        addDataRow(
          ws,
          ["", "", v.codCantiere, v.codMezzo, ...v.giorniNotte, totNotte],
          nGiorni,
          nFixed,
          { isNight: true, redCol: 3 },
        );
      }
    });

    // Riga LET: codici assenza scritti nelle celle del giorno corrispondente
    if (assenzaGiorni.some(Boolean)) {
      const letRow = ws.addRow(["", "", "LET", "", ...assenzaGiorni, ""]);
      letRow.height = 17;
      letRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill   = fill("FFFFFFFF");
        cell.border = mkBorder(col === nFixed || col === nFixed + nGiorni ? "medium" : "thin");
        cell.alignment = { horizontal: "center", vertical: "middle" };
        // Lettere assenza in rosso scuro
        if (col > nFixed && col <= nFixed + nGiorni && cell.value) {
          cell.font = { bold: true, size: 9, name: "Arial", color: { argb: "FFCC0000" } };
        } else {
          cell.font = { size: 9, name: "Arial", color: { argb: "FF000000" } };
        }
      });
    }
  });

  ws.views = [{ state: "frozen", ySplit: 1, xSplit: nFixed }];
}

// ── Foglio Mezzi ──────────────────────────────────────────────────────────
function addFoglioMezzi(wb, turniMese, macchinari, meseStr) {
  const ws      = wb.addWorksheet(`Mezzi ${meseStr}`);
  const nGiorni = giorniNelMese(meseStr);
  const [y, m]  = meseStr.split("-").map(Number);
  const nFixed  = 4;

  ws.columns = [
    { key: "a", width: 13 },
    { key: "b", width: 30 },
    { key: "c", width: 4 },
    { key: "d", width: 4 },
    ...Array.from({ length: nGiorni }, () => ({ width: 4.2 })),
    { key: "tot", width: 10 },
  ];

  addHeaderRow(ws, ["COD. MEZZI", "MEZZI", "", ""], nGiorni);
  addYellowRow(ws, ["", "", "", ""], nGiorni, y, m);

  macchinari.forEach((mezzo) => {
    const turniMezzo = turniMese.filter((t) => String(t.mezzo_id) === String(mezzo.id) && (t.ore_mezzo || 0) > 0);
    const ore = Array(nGiorni).fill(0);
    turniMezzo.forEach((t) => {
      const g = parseInt(t.data?.split("-")[2]) - 1;
      if (g >= 0 && g < nGiorni) ore[g] += t.ore_mezzo || 0;
    });
    const tot = ore.reduce((a, b) => a + b, 0);
    if (!tot) return;
    addDataRow(ws, [mezzo.cod_mezzo, mezzo.mezzo, "", "", ...ore, tot], nGiorni, nFixed);
  });

  ws.views = [{ state: "frozen", ySplit: 2, xSplit: 2 }];
}

// ── Foglio Km ─────────────────────────────────────────────────────────────
function addFoglioKm(wb, turniMese, dipendenti, meseStr) {
  const ws      = wb.addWorksheet(`Km ${meseStr}`);
  const nGiorni = giorniNelMese(meseStr);
  const [y, m]  = meseStr.split("-").map(Number);
  const nFixed  = 4;

  ws.columns = [
    { key: "a", width: 17 },
    { key: "b", width: 26 },
    { key: "c", width: 4 },
    { key: "d", width: 4 },
    ...Array.from({ length: nGiorni }, () => ({ width: 4.2 })),
    { key: "tot", width: 10 },
  ];

  addHeaderRow(ws, ["COD. DIPENDENTE", "DIPENDENTE", "", ""], nGiorni);
  addYellowRow(ws, ["", "", "", ""], nGiorni, y, m);

  dipendenti.forEach((dip) => {
    const turniKm = turniMese.filter((t) => String(t.dipendente_id) === String(dip.id) && (t.km_totale || 0) > 0);
    if (!turniKm.length) return;
    const km = Array(nGiorni).fill(0);
    turniKm.forEach((t) => {
      const g = parseInt(t.data?.split("-")[2]) - 1;
      if (g >= 0 && g < nGiorni) km[g] += t.km_totale || 0;
    });
    const tot = km.reduce((a, b) => a + b, 0);
    addDataRow(ws, [String(dip.pin || ""), `${dip.nome} ${dip.cognome}`, "", "", ...km, tot || null], nGiorni, nFixed);
  });

  ws.views = [{ state: "frozen", ySplit: 2, xSplit: 2 }];
}

// ── Foglio Cantieri (riferimento) ─────────────────────────────────────────
function addFoglioCantieri(wb, cantieri) {
  const ws = wb.addWorksheet("Cantieri");
  ws.columns = [{ key: "a", width: 34 }, { key: "b", width: 24 }];

  const hRow = ws.addRow(["Cantieri", "Codici"]);
  hRow.height = 20;
  hRow.eachCell((cell) => {
    cell.fill      = fill("FF0C0C0C");
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Arial" };
    cell.border    = mkBorder("thin");
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });

  cantieri.forEach((c, i) => {
    const row = ws.addRow([c.cantiere, c.cod_cantiere]);
    row.height = 16;
    row.eachCell((cell) => {
      cell.border    = mkBorder("thin");
      cell.font      = { size: 9 };
      cell.fill      = fill(i % 2 === 0 ? "FFFFFFFF" : "FFF5F5F5");
      cell.alignment = { vertical: "middle" };
    });
  });
}

// ── Route Handler ─────────────────────────────────────────────────────────
export async function POST(request) {
  const operaio = await readSessionCookie();
  if (!operaio || operaio.ruolo !== "responsabile") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { mese } = await request.json();
  if (!mese) return Response.json({ error: "Mese mancante" }, { status: 400 });

  const [turni, dipendenti, cantieri, macchinari] = await Promise.all([
    getAllTurni(),
    getDipendenti(),
    getCantieri(),
    getMacchinari(),
  ]);

  const turniMese      = turni.filter((t) => t.data?.startsWith(mese));
  const [anno, mesNum] = mese.split("-").map(Number);
  const nomeFile       = `COOP134_${MESI[mesNum - 1]}_${anno}.xlsx`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "COOP134";
  wb.created = new Date();

  addFoglioContabilita(wb, turniMese, dipendenti, cantieri, mese);
  addFoglioBustePaghe(wb, turniMese, dipendenti, cantieri, macchinari, mese);
  addFoglioMezzi(wb, turniMese, macchinari, mese);
  addFoglioKm(wb, turniMese, dipendenti, mese);
  addFoglioCantieri(wb, cantieri);

  const buffer = await wb.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeFile}"`,
    },
  });
}