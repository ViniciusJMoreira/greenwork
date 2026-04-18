"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Milestone, ChevronDown } from "lucide-react";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

export default function TabKm({ turni: tuttiTurni, dipendenti }) {
  const today   = new Date();
  const meseCorrente = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Selettore mese — genera ultimi 6 mesi
  const mesiOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: `${MESI[d.getMonth()]} ${d.getFullYear()}`,
      };
    });
  }, []);

  const [mese, setMese] = useState(meseCorrente);

  // Turni del mese selezionato che hanno km
  const turniKm = useMemo(
    () => tuttiTurni.filter((t) => t.data?.startsWith(mese) && t.km_totale > 0),
    [tuttiTurni, mese],
  );

  // Aggrega per operaio
  const righe = useMemo(() => {
    const map = {};
    turniKm.forEach((t) => {
      const id = String(t.dipendente_id);
      if (!map[id]) {
        const dip = dipendenti.find((d) => String(d.id) === id);
        map[id] = {
          nome: dip ? `${dip.nome} ${dip.cognome}` : (t.nome_operaio || "—"),
          codice: dip?.cod_dipendente || "—",
          kmTot: 0,
          spostamenti: [],
        };
      }
      map[id].kmTot += t.km_totale || 0;
      if (t.km_percorso) map[id].spostamenti.push({ data: t.data, km: t.km_totale, percorso: t.km_percorso });
    });
    return Object.values(map).sort((a, b) => b.kmTot - a.kmTot);
  }, [turniKm, dipendenti]);

  const totaleKm = righe.reduce((a, r) => a + r.kmTot, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Km / Rimborsi</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {turniKm.length} spostamenti · {totaleKm.toFixed(1)} km totali
          </p>
        </div>
        {/* Selettore mese */}
        <select
          value={mese}
          onChange={(e) => setMese(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none border"
          style={{ background: "var(--bg-subtle)", borderColor: "var(--border)", color: "var(--text)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
        >
          {mesiOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {righe.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <Milestone className="h-10 w-10" style={{ color: "var(--text-faint)" }} />
          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>Nessuno spostamento registrato</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>per {mesiOptions.find((m) => m.value === mese)?.label}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {righe.map((r, i) => <RigaOperaio key={r.nome} riga={r} index={i} />)}
        </div>
      )}
    </div>
  );
}

function RigaOperaio({ riga, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--primary)" }}>
            {riga.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{riga.nome}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{riga.spostamenti.length} spostamenti</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{riga.kmTot.toFixed(1)} km</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
          </motion.div>
        </div>
      </motion.button>

      {expanded && (
        <div className="border-t px-4 pb-3 pt-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-1.5">
            {riga.spostamenti.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span className="w-20 shrink-0 font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{s.data}</span>
                <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{s.percorso}</span>
                <span className="font-semibold shrink-0" style={{ color: "var(--primary)" }}>{s.km.toFixed(1)} km</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}