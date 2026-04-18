"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Wrench, ChevronDown } from "lucide-react";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

export default function TabMacchinari({ turni: tuttiTurni, macchinari }) {
  const today = new Date();
  const meseCorrente = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

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

  const turniMezzo = useMemo(
    () => tuttiTurni.filter((t) => t.data?.startsWith(mese) && t.mezzo_id),
    [tuttiTurni, mese],
  );

  // Aggrega per macchinario
  const righe = useMemo(() => {
    const map = {};
    turniMezzo.forEach((t) => {
      const id = String(t.mezzo_id);
      const mezzo = macchinari.find((m) => String(m.id) === id);
      if (!map[id]) {
        map[id] = {
          nome:    mezzo?.mezzo    || t.macchinario || "—",
          codice:  mezzo?.cod_mezzo || "—",
          oreTot:  0,
          utilizzi: [],
        };
      }
      map[id].oreTot += t.ore_mezzo || 0;
      map[id].utilizzi.push({
        data:     t.data,
        ore:      t.ore_mezzo || 0,
        operaio:  t.nome_operaio || "—",
        cantiere: t.cantiere    || "—",
        finito:   t.lavoro_finito,
      });
    });
    return Object.values(map).sort((a, b) => b.oreTot - a.oreTot);
  }, [turniMezzo, macchinari]);

  const totaleOre = righe.reduce((a, r) => a + r.oreTot, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Macchinari</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {turniMezzo.length} utilizzi · {totaleOre.toFixed(1)}h totali
          </p>
        </div>
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
          <Wrench className="h-10 w-10" style={{ color: "var(--text-faint)" }} />
          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>Nessun macchinario utilizzato</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>per {mesiOptions.find((m) => m.value === mese)?.label}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {righe.map((r, i) => <RigaMezzo key={r.codice + r.nome} riga={r} index={i} />)}
        </div>
      )}
    </div>
  );
}

function RigaMezzo({ riga, index }) {
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-faint)" }}>
            <Wrench className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{riga.nome}</p>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{riga.codice} · {riga.utilizzi.length} utilizzi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{riga.oreTot.toFixed(1)}h</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
          </motion.div>
        </div>
      </motion.button>

      {expanded && (
        <div className="border-t px-4 pb-3 pt-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-1">
            {riga.utilizzi.map((u, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span className="w-20 shrink-0 font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{u.data}</span>
                <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{u.cantiere}</span>
                <span className="truncate max-w-[80px]" style={{ color: "var(--text-muted)" }}>{u.operaio.split(" ")[0]}</span>
                <span className="font-semibold shrink-0" style={{ color: "var(--primary)" }}>{u.ore.toFixed(1)}h</span>
                {u.finito === true  && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#dcfce7", color: "#166534" }}>✓</span>}
                {u.finito === false && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#fee2e2", color: "#991b1b" }}>✗</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}