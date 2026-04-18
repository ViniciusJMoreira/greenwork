"use client";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FileDown, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_ABB = ["dom","lun","mar","mer","gio","ven","sab"];

// Numero di giorni in un mese (es. "2026-04" → 30)
function giorniNelMese(meseStr) {
  const [y, m] = meseStr.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// Converte "YYYY-MM" in Date del primo giorno
function primoDelMese(meseStr) {
  const [y, m] = meseStr.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export default function TabExport({ turni: tuttiTurni, dipendenti, cantieri, macchinari }) {
  const today = new Date();
  const meseCorrente = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const mesiOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: `${MESI[d.getMonth()]} ${d.getFullYear()}`,
      };
    });
  }, []);

  const [mese,    setMese]    = useState(meseCorrente);
  const [loading, setLoading] = useState(false);

  const turniMese = useMemo(
    () => tuttiTurni.filter((t) => t.data?.startsWith(mese)),
    [tuttiTurni, mese],
  );

  async function generaExcel() {
    setLoading(true);
    try {
      const xlsxMod = await import("xlsx");
      const XLSX = xlsxMod.default ?? xlsxMod;
      const wb   = XLSX.utils.book_new();
      const nGiorni = giorniNelMese(mese);
      const [anno, mesNum] = mese.split("-").map(Number);

      // Date Excel per riga 1 (colonne giornaliere)
      const dateRiga1 = Array.from({ length: nGiorni }, (_, i) =>
        new Date(anno, mesNum - 1, i + 1)
      );

      // Riga 2: abbreviazioni giorno (lun/mar/mer...)
      const abbGiorni = dateRiga1.map((d) => GIORNI_ABB[d.getDay()]);

      // ── Foglio Cantieri (lookup) ───────────────────────────────────────
      const wsCantieri = XLSX.utils.aoa_to_sheet([
        ["Cantieri", "Codici"],
        ...cantieri.map((c) => [c.cantiere, c.cod_cantiere]),
      ]);
      wsCantieri["!cols"] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsCantieri, "Cantieri");

      // ── Foglio Contabilità ─────────────────────────────────────────────
      // Struttura: DIPENDENTE | COD. DIPENDENTE | CANTIERE | D..AG/AH(giorni) | TOT MESE
      const intestazioneContab = ["DIPENDENTE", "COD. DIPENDENTE", "CANTIERE", ...dateRiga1, "TOT MESE"];
      const riga2Contab        = ["", "", "", ...abbGiorni, ""];
      const righeContab        = [intestazioneContab, riga2Contab];

      dipendenti.forEach((dip) => {
        const turniDip = turniMese.filter((t) => String(t.dipendente_id) === String(dip.id));
        const orePerCantiere = {};
        turniDip.forEach((t) => {
          const key = t.cantiere || "—";
          if (!orePerCantiere[key]) orePerCantiere[key] = Array(nGiorni).fill(0);
          const giorno = parseInt(t.data?.split("-")[2]) - 1;
          if (giorno >= 0 && giorno < nGiorni) orePerCantiere[key][giorno] += t.ore_totali || 0;
        });
        Object.entries(orePerCantiere).forEach(([nomeCantiere, oreGiorni], idx) => {
          const totMese = oreGiorni.reduce((a, b) => a + b, 0);
          righeContab.push([
            idx === 0 ? `${dip.cognome?.toUpperCase()} ${dip.nome?.[0]}.` : "",
            idx === 0 ? (dip.cod_dipendente || "") : "",
            nomeCantiere,
            ...oreGiorni.map((v) => v > 0 ? v : ""),
            totMese > 0 ? totMese : "",
          ]);
        });
      });

      const wsContab = XLSX.utils.aoa_to_sheet(righeContab);
      wsContab["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 28 }, ...Array(nGiorni).fill({ wch: 5 }), { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsContab, `Contabilità ${mese}`);

      // ── Foglio Buste Paghe ─────────────────────────────────────────────
      // Struttura: DIPENDENTE | COD. DIPENDENTE | COD. CANTIERE | COD. MEZZO | E..AI(giorni) | TOT MESE
      const intestazioneBuste = ["DIPENDENTE", "COD. DIPENDENTE", "COD. CANTIERE", "COD. MEZZO", ...dateRiga1, "TOT MESE"];
      const riga2Buste        = ["", "", "", "", ...abbGiorni, ""];
      const righeBuste        = [intestazioneBuste, riga2Buste];

      dipendenti.forEach((dip) => {
        const turniDip = turniMese.filter((t) => String(t.dipendente_id) === String(dip.id));
        const orePerCantiere = {};
        turniDip.forEach((t) => {
          const cantiere = cantieri.find((c) => String(c.id) === String(t.cantiere_id));
          const mezzo    = macchinari.find((m) => String(m.id) === String(t.mezzo_id));
          const codCantiere = cantiere?.cod_cantiere || "—";
          const codMezzo    = mezzo?.cod_mezzo || "";
          const key = `${codCantiere}||${codMezzo}`;
          if (!orePerCantiere[key]) orePerCantiere[key] = { codCantiere, codMezzo, giorni: Array(nGiorni).fill(0) };
          const giorno = parseInt(t.data?.split("-")[2]) - 1;
          if (giorno >= 0 && giorno < nGiorni) orePerCantiere[key].giorni[giorno] += t.ore_totali || 0;
        });
        Object.values(orePerCantiere).forEach((v, idx) => {
          const totMese = v.giorni.reduce((a, b) => a + b, 0);
          righeBuste.push([
            idx === 0 ? `${dip.cognome?.toUpperCase()} ${dip.nome?.[0]}.` : "",
            idx === 0 ? (dip.cod_dipendente || "") : "",
            v.codCantiere,
            v.codMezzo,
            ...v.giorni.map((x) => x > 0 ? x : ""),
            totMese > 0 ? totMese : "",
          ]);
        });
      });

      const wsBuste = XLSX.utils.aoa_to_sheet(righeBuste);
      wsBuste["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, ...Array(nGiorni).fill({ wch: 5 }), { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsBuste, `Buste Paghe ${mese}`);

      // ── Foglio Mezzi ───────────────────────────────────────────────────
      const intestazioneMezzi = ["COD. MEZZI", "MEZZI", "", "", ...dateRiga1, "TOT MESE"];
      const riga2Mezzi        = ["", "", "", "", ...abbGiorni, ""];
      const righeMezzi        = [intestazioneMezzi, riga2Mezzi];

      macchinari.forEach((m) => {
        const turniMezzo = turniMese.filter((t) => String(t.mezzo_id) === String(m.id) && t.ore_mezzo > 0);
        const oreGiorni  = Array(nGiorni).fill(0);
        turniMezzo.forEach((t) => {
          const g = parseInt(t.data?.split("-")[2]) - 1;
          if (g >= 0 && g < nGiorni) oreGiorni[g] += t.ore_mezzo || 0;
        });
        const totMese = oreGiorni.reduce((a, b) => a + b, 0);
        if (totMese > 0) {
          righeMezzi.push([m.cod_mezzo, m.mezzo, "", "", ...oreGiorni.map((v) => v > 0 ? v : ""), totMese]);
        }
      });

      const wsMezzi = XLSX.utils.aoa_to_sheet(righeMezzi);
      wsMezzi["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 4 }, { wch: 4 }, ...Array(nGiorni).fill({ wch: 5 }), { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsMezzi, `Mezzi ${mese}`);

      // ── Foglio Km ──────────────────────────────────────────────────────
      const intestazioneKm = ["COD. DIPENDENTE", "DIPENDENTE", "", "", ...dateRiga1, "TOT MESE"];
      const riga2Km        = ["", "", "", "", ...abbGiorni, ""];
      const righeKm        = [intestazioneKm, riga2Km];

      dipendenti.forEach((dip) => {
        const turniKm = turniMese.filter((t) => String(t.dipendente_id) === String(dip.id) && t.km_totale > 0);
        if (!turniKm.length) return;
        const kmGiorni = Array(nGiorni).fill(0);
        turniKm.forEach((t) => {
          const g = parseInt(t.data?.split("-")[2]) - 1;
          if (g >= 0 && g < nGiorni) kmGiorni[g] += t.km_totale || 0;
        });
        const totMese = kmGiorni.reduce((a, b) => a + b, 0);
        righeKm.push([
          dip.cod_dipendente || "",
          `${dip.nome} ${dip.cognome}`,
          "", "",
          ...kmGiorni.map((v) => v > 0 ? v : ""),
          totMese > 0 ? totMese : "",
        ]);
      });

      const wsKm = XLSX.utils.aoa_to_sheet(righeKm);
      wsKm["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 4 }, { wch: 4 }, ...Array(nGiorni).fill({ wch: 5 }), { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsKm, `Km ${mese}`);

      // ── Download ───────────────────────────────────────────────────────
      const nomeMese = MESI[mesNum - 1];
      XLSX.writeFile(wb, `COOP134_${nomeMese}_${anno}.xlsx`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Export</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Genera il file Excel con la struttura originale COOP134
        </p>
      </div>

      {/* Card selezione mese + export */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border p-5 flex flex-col gap-5"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-faint)" }}>
            <FileDown className="h-5 w-5" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Report mensile</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>5 fogli: Contabilità, Buste Paghe, Mezzi, Km, Cantieri</p>
          </div>
        </div>

        {/* Selettore mese */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Mese da esportare</label>
          <select
            value={mese} onChange={(e) => setMese(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
            style={{ background: "var(--bg-subtle)", borderColor: "var(--border)", color: "var(--text)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          >
            {mesiOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Anteprima dati */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Turni",       value: turniMese.length },
            { label: "Operai",      value: new Set(turniMese.map((t) => t.dipendente_id)).size },
            { label: "Spostamenti", value: turniMese.filter((t) => t.km_totale > 0).length },
            { label: "Usi mezzo",   value: turniMese.filter((t) => t.mezzo_id).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg px-3 py-2.5 text-center" style={{ background: "var(--bg-subtle)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Bottone */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={generaExcel}
          disabled={loading || turniMese.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--primary)" }}
        >
          {loading ? <><Spinner /> Generazione...</> : <><Download className="h-4 w-4" /> Scarica Excel</>}
        </motion.button>

        {turniMese.length === 0 && (
          <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
            Nessun turno per {mesiOptions.find((m) => m.value === mese)?.label}
          </p>
        )}
      </motion.div>
    </div>
  );
}