"use client";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FileDown, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

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
      const res = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mese }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || "Errore generazione Excel");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const [anno, mesNum] = mese.split("-").map(Number);
      a.href     = url;
      a.download = `COOP134_${MESI[mesNum - 1]}_${anno}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.message);
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