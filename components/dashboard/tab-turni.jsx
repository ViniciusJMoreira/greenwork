"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SlidersHorizontal, ChevronDown, ChevronUp, FileSearch, Wrench,
} from "lucide-react";
import { calcMin, fmtOre } from "@/lib/utils";

const GIORNI = ["dom","lun","mar","mer","gio","ven","sab"];

function formatHeader(dataStr) {
  const [y, m, d] = dataStr.split("-").map(Number);
  const dn = GIORNI[new Date(y, m - 1, d).getDay()];
  return `${dn} ${d} ${["","gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"][m]}`;
}

function OperaioPill({ nome }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: "var(--primary)", background: "var(--primary-faint)", borderColor: "var(--primary)" + "33" }}>
      {nome}
    </span>
  );
}

function TurnoCard({ record, showOperaio = false, index = 0 }) {
  const min = calcMin(record.inizio, record.fine);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.035 }}
      className="rounded-xl border px-4 py-3 flex items-start gap-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: "var(--primary)" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{record.cantiere}</span>
          {record.lavoro && (
            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border"
              style={{ color: "var(--primary)", background: "var(--primary-faint)", borderColor: "var(--primary)" + "33" }}>
              {record.lavoro}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{record.inizio} → {record.fine}</span>
          <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{fmtOre(min)}</span>
          {showOperaio && record.nome_operaio && <OperaioPill nome={record.nome_operaio} />}
        </div>
        {(record.macchinario || record.note) && (
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {record.macchinario && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-faint)" }}>
                <Wrench className="h-3 w-3" /> {record.macchinario}
              </span>
            )}
            {record.note && <span className="text-xs italic truncate" style={{ color: "var(--text-faint)" }}>{record.note}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OperaioCard({ dipendente, turni, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const min    = turni.reduce((a, t) => a + calcMin(t.inizio, t.fine), 0);
  const giorni = new Set(turni.map((t) => t.data)).size;

  const gruppiDate = turni
    .reduce((acc, t) => {
      if (!t.data) return acc;
      const ex = acc.find((g) => g.data === t.data);
      if (ex) { ex.records.push(t); ex.totMin += calcMin(t.inizio, t.fine); }
      else acc.push({ data: t.data, records: [t], totMin: calcMin(t.inizio, t.fine) });
      return acc;
    }, [])
    .map((g) => ({ ...g, records: g.records.sort((a, b) => (a.inizio || "").localeCompare(b.inizio || "")) }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.06 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--primary)" }}>
            {dipendente.nome[0]}{dipendente.cognome[0]}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{dipendente.nome} {dipendente.cognome}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{turni.length} {turni.length === 1 ? "turno" : "turni"} · {giorni} {giorni === 1 ? "giorno" : "giorni"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{fmtOre(min)}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}
          >
            <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-4" style={{ borderColor: "var(--border)" }}>
              {gruppiDate.map(({ data, records, totMin: dayMin }) => (
                <div key={data}>
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-muted)" }}>{formatHeader(data)}</span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "white" }}>{fmtOre(dayMin)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {records.map((t, i) => <TurnoCard key={t.id} record={t} index={i} />)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TabTurni({ turni: tuttiTurni, dipendenti, cantieri, lavori }) {
  const [filterOperaio,  setFilterOperaio]  = useState("all");
  const [filterCantiere, setFilterCantiere] = useState("all");
  const [filterLavoro,   setFilterLavoro]   = useState("all");
  const [startDate,      setStartDate]      = useState("");
  const [endDate,        setEndDate]        = useState("");
  const [filtersOpen,    setFiltersOpen]    = useState(true);
  const [view,           setView]           = useState("operaio");

  const inputCls = "rounded-lg px-3 py-2 text-sm outline-none border";
  const inputStyle = { background: "var(--bg-subtle)", borderColor: "var(--border)", color: "var(--text)" };

  const filtered = useMemo(() => tuttiTurni.filter((t) => {
    if (startDate && t.data < startDate) return false;
    if (endDate   && t.data > endDate)   return false;
    if (filterOperaio  !== "all" && String(t.dipendente_id) !== filterOperaio)  return false;
    if (filterCantiere !== "all" && String(t.cantiere_id)   !== filterCantiere) return false;
    if (filterLavoro   !== "all" && String(t.lavoro_id)     !== filterLavoro)   return false;
    return true;
  }), [tuttiTurni, startDate, endDate, filterOperaio, filterCantiere, filterLavoro]);

  const gruppiOperaio = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const id = String(t.dipendente_id);
      if (!map[id]) {
        const dip = dipendenti.find((d) => String(d.id) === id);
        map[id] = { dipendente: dip || { id, nome: t.nome_operaio?.split(" ")[0] || "—", cognome: t.nome_operaio?.split(" ")[1] || "", ruolo: "" }, turni: [] };
      }
      map[id].turni.push(t);
    });
    return Object.values(map).sort((a, b) => (a.dipendente.nome + a.dipendente.cognome).localeCompare(b.dipendente.nome + b.dipendente.cognome));
  }, [filtered, dipendenti]);

  const gruppiData = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (!t.data) return;
      if (!map[t.data]) map[t.data] = { data: t.data, records: [], totMin: 0 };
      map[t.data].records.push(t);
      map[t.data].totMin += calcMin(t.inizio, t.fine);
    });
    return Object.values(map)
      .map((g) => ({ ...g, records: g.records.sort((a, b) => (a.inizio || "").localeCompare(b.inizio || "")) }))
      .sort((a, b) => (a.data > b.data ? -1 : 1));
  }, [filtered]);

  const hasFilters  = startDate || endDate || filterOperaio !== "all" || filterCantiere !== "all" || filterLavoro !== "all";
  const activeCount = [startDate, endDate, filterOperaio !== "all", filterCantiere !== "all", filterLavoro !== "all"].filter(Boolean).length;

  function resetFilters() {
    setStartDate(""); setEndDate("");
    setFilterOperaio("all"); setFilterCantiere("all"); setFilterLavoro("all");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Turni</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{tuttiTurni.length} turni totali</p>
      </div>

      {/* Filtri */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{ color: "var(--text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <span className="text-sm font-medium">Filtri</span>
            {activeCount > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "white" }}>{activeCount}</span>
            )}
          </div>
          <motion.div animate={{ rotate: filtersOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <ChevronUp className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}
            >
              <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Operaio",     value: filterOperaio,  set: setFilterOperaio,  options: dipendenti.map((d) => ({ value: String(d.id), label: `${d.nome} ${d.cognome}` })) },
                    { label: "Cantiere",    value: filterCantiere, set: setFilterCantiere, options: cantieri.map((c) => ({ value: String(c.id), label: c.cantiere })) },
                    { label: "Tipo Lavoro", value: filterLavoro,   set: setFilterLavoro,   options: lavori.map((l) => ({ value: String(l.id), label: l.lavoro })) },
                  ].map(({ label, value, set, options }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
                      <select value={value} onChange={(e) => set(e.target.value)} className={inputCls} style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                        onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}>
                        <option value="all">Tutti</option>
                        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                  {[
                    { label: "Dal", value: startDate, set: setStartDate },
                    { label: "Al",  value: endDate,   set: setEndDate   },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
                      <input type="date" value={value} onChange={(e) => set(e.target.value)} className={inputCls + " appearance-none min-w-0"} style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                        onBlur={(e)  => (e.target.style.borderColor = "var(--border)")} />
                    </div>
                  ))}
                </div>
                {hasFilters && (
                  <motion.button whileTap={{ scale: 0.94 }} onClick={resetFilters}
                    className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.borderColor = "var(--destructive)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
                    Azzera filtri ✕
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle vista */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{filtered.length} {filtered.length === 1 ? "turno" : "turni"}</span>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          {[{ id: "operaio", label: "Per operaio" }, { id: "data", label: "Per data" }].map(({ id, label }) => (
            <motion.button key={id} whileTap={{ scale: 0.96 }} onClick={() => setView(id)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: view === id ? "var(--primary)" : "transparent", color: view === id ? "white" : "var(--text-muted)" }}>
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <FileSearch className="h-10 w-10" style={{ color: "var(--text-faint)" }} />
            <p className="font-medium text-sm" style={{ color: "var(--text)" }}>Nessun turno trovato</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hasFilters ? "Prova a modificare i filtri" : "Nessun dato disponibile"}</p>
          </motion.div>
        ) : view === "operaio" ? (
          <motion.div key="by-operaio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">
            {gruppiOperaio.map(({ dipendente, turni }, i) => <OperaioCard key={dipendente.id} dipendente={dipendente} turni={turni} index={i} />)}
          </motion.div>
        ) : (
          <motion.div key="by-data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-6">
            {gruppiData.map(({ data, records, totMin }) => (
              <div key={data}>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-muted)" }}>{formatHeader(data)}</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "white" }}>{fmtOre(totMin)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {records.map((r, i) => <TurnoCard key={r.id} record={r} showOperaio index={i} />)}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}