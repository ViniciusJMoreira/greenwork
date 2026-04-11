"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Clock,
  CalendarDays,
  Building2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FileSearch,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { getStats, getOrePerGiorno, getPieData } from "@/lib/stats";
import { calcMin, fmtOre } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

const GIORNI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const RED = ["#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5"];
const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function formatHeader(dataStr) {
  const [y, m, d] = dataStr.split("-").map(Number);
  const dn = GIORNI[new Date(y, m - 1, d).getDay()];
  return `${dn} ${d} ${["", "gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"][m]}`;
}

// ── Stat card semplice ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        damping: 22,
        stiffness: 300,
        delay: 0.05 + index * 0.07,
      }}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        transformPerspective: 700,
      }}
      className="rounded-xl border p-4 flex items-center gap-4"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--primary-faint)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <p
          className="text-lg font-bold leading-none"
          style={{ color: "var(--text)" }}
        >
          {value}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}

// ── Chip pill per operaio su ogni turno ───────────────────────────────────
function OperaioPill({ nome }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border"
      style={{
        color: "var(--primary)",
        background: "var(--primary-faint)",
        borderColor: "var(--primary)" + "33",
      }}
    >
      {nome}
    </span>
  );
}

// ── Card singolo turno ────────────────────────────────────────────────────
function TurnoCard({ record, showOperaio = false, index = 0 }) {
  const min = calcMin(record.inizio, record.fine);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.035 }}
      className="rounded-xl border px-4 py-3 flex items-start gap-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5"
        style={{ background: "var(--primary)" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text)" }}
          >
            {record.cantiere}
          </span>
          {record.lavoro && (
            <span
              className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border"
              style={{
                color: "var(--primary)",
                background: "var(--primary-faint)",
                borderColor: "var(--primary)" + "33",
              }}
            >
              {record.lavoro}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {record.inizio} → {record.fine}
          </span>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--primary)" }}
          >
            {fmtOre(min)}
          </span>
          {showOperaio && record.nome_operaio && (
            <OperaioPill nome={record.nome_operaio} />
          )}
        </div>
        {(record.macchinario || record.note) && (
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {record.macchinario && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-faint)" }}
              >
                <Wrench className="h-3 w-3" /> {record.macchinario}
              </span>
            )}
            {record.note && (
              <span
                className="text-xs italic truncate"
                style={{ color: "var(--text-faint)" }}
              >
                {record.note}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Card operaio espandibile ──────────────────────────────────────────────
function OperaioCard({ dipendente, turni, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const min = turni.reduce((a, t) => a + calcMin(t.inizio, t.fine), 0);
  const giorni = new Set(turni.map((t) => t.data)).size;

  // Raggruppa per data, turni ordinati per orario (mattina → sera)
  const gruppiDate = turni
    .reduce((acc, t) => {
      if (!t.data) return acc;
      const existing = acc.find((g) => g.data === t.data);
      if (existing) {
        existing.records.push(t);
        existing.totMin += calcMin(t.inizio, t.fine);
      } else {
        acc.push({
          data: t.data,
          records: [t],
          totMin: calcMin(t.inizio, t.fine),
        });
      }
      return acc;
    }, [])
    .map((g) => ({
      ...g,
      records: g.records.sort((a, b) =>
        (a.inizio || "").localeCompare(b.inizio || ""),
      ),
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.06 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Header operaio */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-subtle)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          {/* Avatar iniziali */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "var(--primary)" }}
          >
            {dipendente.nome[0]}
            {dipendente.cognome[0]}
          </div>
          <div className="text-left">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              {dipendente.nome} {dipendente.cognome}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {turni.length} {turni.length === 1 ? "turno" : "turni"} · {giorni}{" "}
              {giorni === 1 ? "giorno" : "giorni"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--primary)" }}
          >
            {fmtOre(min)}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "var(--text-faint)" }}
            />
          </motion.div>
        </div>
      </motion.button>

      {/* Turni espansi — raggruppati per data come lo storico */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="border-t px-4 pb-4 pt-3 flex flex-col gap-4"
              style={{ borderColor: "var(--border)" }}
            >
              {gruppiDate.map(({ data, records, totMin: dayMin }) => (
                <div key={data}>
                  {/* Header data */}
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span
                      className="text-xs font-semibold capitalize"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatHeader(data)}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "var(--border)" }}
                    />
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--primary)", color: "white" }}
                    >
                      {fmtOre(dayMin)}
                    </span>
                  </div>
                  {/* Turni del giorno */}
                  <div className="flex flex-col gap-2">
                    {records.map((t, i) => (
                      <TurnoCard key={t.id} record={t} index={i} />
                    ))}
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

// ── Tooltip grafici ───────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--primary)" }}>
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────
export default function PersonalePage() {
  const { tuttiTurni, dipendenti, cantieri, lavori } = useApp();
  const today = new Date();
  const meseStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Filtri
  const [filterOperaio, setFilterOperaio] = useState("all");
  const [filterCantiere, setFilterCantiere] = useState("all");
  const [filterLavoro, setFilterLavoro] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [view, setView] = useState("operaio"); // "operaio" | "data"

  // Turni del mese corrente per grafici
  const turniMese = useMemo(
    () => tuttiTurni.filter((t) => t.data?.startsWith(meseStr)),
    [tuttiTurni, meseStr],
  );

  // Turni filtrati per lista
  const filtered = useMemo(() => {
    return tuttiTurni.filter((t) => {
      if (startDate && t.data < startDate) return false;
      if (endDate && t.data > endDate) return false;
      if (filterOperaio !== "all" && String(t.dipendente_id) !== filterOperaio)
        return false;
      if (filterCantiere !== "all" && String(t.cantiere_id) !== filterCantiere)
        return false;
      if (filterLavoro !== "all" && String(t.lavoro_id) !== filterLavoro)
        return false;
      return true;
    });
  }, [
    tuttiTurni,
    startDate,
    endDate,
    filterOperaio,
    filterCantiere,
    filterLavoro,
  ]);

  // KPI aggregate mese
  const stats = useMemo(() => getStats(turniMese), [turniMese]);
  const operaiAttivi = useMemo(
    () => new Set(turniMese.map((t) => t.dipendente_id)).size,
    [turniMese],
  );

  // Ore per operaio (bar chart)
  const orePerOperaio = useMemo(() => {
    const map = {};
    turniMese.forEach((t) => {
      const k = t.nome_operaio || "—";
      map[k] = (map[k] || 0) + calcMin(t.inizio, t.fine) / 60;
    });
    return Object.entries(map)
      .map(([nome, ore]) => ({
        nome: nome.split(" ")[0],
        ore: parseFloat(ore.toFixed(1)),
      }))
      .sort((a, b) => b.ore - a.ore);
  }, [turniMese]);

  // Distribuzione cantieri
  const pieData = useMemo(() => getPieData(turniMese).slice(0, 5), [turniMese]);
  const totMinPie = pieData.reduce((a, c) => a + c.min, 0);

  // Andamento ore ultimi 14 giorni
  const orePerGiorno = useMemo(
    () => getOrePerGiorno(turniMese, 14),
    [turniMese],
  );

  // Raggruppamento per OPERAIO
  const gruppiOperaio = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const id = String(t.dipendente_id);
      if (!map[id]) {
        const dip = dipendenti.find((d) => String(d.id) === id);
        map[id] = {
          dipendente: dip || {
            id,
            nome: t.nome_operaio?.split(" ")[0] || "—",
            cognome: t.nome_operaio?.split(" ")[1] || "",
            ruolo: "",
          },
          turni: [],
        };
      }
      map[id].turni.push(t);
    });
    return Object.values(map).sort((a, b) =>
      (a.dipendente.nome + a.dipendente.cognome).localeCompare(
        b.dipendente.nome + b.dipendente.cognome,
      ),
    );
  }, [filtered, dipendenti]);

  // Raggruppamento per DATA
  const gruppiData = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (!t.data) return;
      if (!map[t.data]) map[t.data] = { data: t.data, records: [], totMin: 0 };
      map[t.data].records.push(t);
      map[t.data].totMin += calcMin(t.inizio, t.fine);
    });
    // Turni di ogni giorno ordinati per orario (mattina → sera)
    return Object.values(map)
      .map((g) => ({
        ...g,
        records: g.records.sort((a, b) =>
          (a.inizio || "").localeCompare(b.inizio || ""),
        ),
      }))
      .sort((a, b) => (a.data > b.data ? -1 : 1));
  }, [filtered]);

  const hasFilters =
    startDate ||
    endDate ||
    filterOperaio !== "all" ||
    filterCantiere !== "all" ||
    filterLavoro !== "all";
  const activeCount = [
    startDate,
    endDate,
    filterOperaio !== "all",
    filterCantiere !== "all",
    filterLavoro !== "all",
  ].filter(Boolean).length;
  const tickStyle = { fontSize: 11, fill: "var(--text-muted)" };

  function resetFilters() {
    setStartDate("");
    setEndDate("");
    setFilterOperaio("all");
    setFilterCantiere("all");
    setFilterLavoro("all");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Personale
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {MESI[today.getMonth()]} {today.getFullYear()} — {tuttiTurni.length}{" "}
          turni totali
        </p>
      </motion.div>

      {/* KPI aggregate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Clock}
          value={`${(stats.minutiTotali / 60).toFixed(1)}`}
          label="Ore campi sportivi (mese)"
          index={0}
        />
        <StatCard
          icon={Users}
          value={operaiAttivi}
          label="Operai attivi"
          index={1}
        />
        <StatCard
          icon={CalendarDays}
          value={stats.giorniLavorati}
          label="Giorni con turni"
          index={2}
        />
        <StatCard
          icon={Building2}
          value={stats.numCantieri}
          label="Cantieri coperti"
          index={3}
        />
      </div>

      {/* Filtri */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.25 }}
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{ color: "var(--text)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-subtle)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4"
              style={{ color: "var(--text-muted)" }}
            />
            <span className="text-sm font-medium">Filtri</span>
            {activeCount > 0 && (
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--primary)", color: "white" }}
              >
                {activeCount}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: filtersOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp
              className="h-4 w-4"
              style={{ color: "var(--text-faint)" }}
            />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="border-t px-4 pb-4 pt-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Operaio */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Operaio
                    </label>
                    <select
                      value={filterOperaio}
                      onChange={(e) => setFilterOperaio(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none border"
                      style={{
                        background: "var(--bg-subtle)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    >
                      <option value="all">Tutti</option>
                      {dipendenti.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.nome} {d.cognome}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Cantiere */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Cantiere
                    </label>
                    <select
                      value={filterCantiere}
                      onChange={(e) => setFilterCantiere(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none border"
                      style={{
                        background: "var(--bg-subtle)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    >
                      <option value="all">Tutti</option>
                      {cantieri.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.cantiere}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Tipo lavoro */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Tipo Lavoro
                    </label>
                    <select
                      value={filterLavoro}
                      onChange={(e) => setFilterLavoro(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none border"
                      style={{
                        background: "var(--bg-subtle)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    >
                      <option value="all">Tutti</option>
                      {lavori.map((l) => (
                        <option key={l.id} value={String(l.id)}>
                          {l.lavoro}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Dal */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Dal
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none border appearance-none min-w-0"
                      style={{
                        background: "var(--bg-subtle)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                  {/* Al */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Al
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none border appearance-none min-w-0"
                      style={{
                        background: "var(--bg-subtle)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                </div>
                {hasFilters && (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={resetFilters}
                    className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--destructive)";
                      e.currentTarget.style.borderColor = "var(--destructive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    Azzera filtri ✕
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toggle vista + contatore */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "turno" : "turni"}
        </span>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {[
            { id: "operaio", label: "Per operaio" },
            { id: "data", label: "Per data" },
          ].map(({ id, label }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setView(id)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: view === id ? "var(--primary)" : "transparent",
                color: view === id ? "white" : "var(--text-muted)",
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <FileSearch
              className="h-10 w-10"
              style={{ color: "var(--text-faint)" }}
            />
            <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
              Nessun turno trovato
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {hasFilters
                ? "Prova a modificare i filtri"
                : "Nessun dato disponibile"}
            </p>
          </motion.div>
        ) : view === "operaio" ? (
          <motion.div
            key="by-operaio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            {gruppiOperaio.map(({ dipendente, turni }, i) => (
              <OperaioCard
                key={dipendente.id}
                dipendente={dipendente}
                turni={turni}
                index={i}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="by-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-6"
          >
            {gruppiData.map(({ data, records, totMin }) => (
              <div key={data}>
                {/* Header data */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span
                    className="text-xs font-semibold capitalize"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatHeader(data)}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--border)" }}
                  />
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    {fmtOre(totMin)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {records.map((r, i) => (
                    <TurnoCard key={r.id} record={r} showOperaio index={i} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ore per operaio */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3.5 border-b flex items-center gap-2"
            style={{ borderColor: "var(--border)" }}
          >
            <Users className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Ore per Operaio
            </span>
          </div>
          <div className="px-5 py-4">
            {orePerOperaio.length === 0 ? (
              <p
                className="text-center text-sm py-6"
                style={{ color: "var(--text-faint)" }}
              >
                Nessun dato
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={orePerOperaio}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="ore"
                    name="Ore"
                    fill="var(--primary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Distribuzione cantieri */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.3 }}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3.5 border-b flex items-center gap-2"
            style={{ borderColor: "var(--border)" }}
          >
            <Building2
              className="h-4 w-4"
              style={{ color: "var(--primary)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Distribuzione Cantieri
            </span>
          </div>
          <div className="px-5 py-4">
            {pieData.length === 0 ? (
              <p
                className="text-center text-sm py-6"
                style={{ color: "var(--text-faint)" }}
              >
                Nessun dato
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={58}
                      dataKey="ore"
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={RED[i % RED.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v}h`, "Ore"]}
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 mt-1">
                  {pieData.map((c, i) => (
                    <div
                      key={c.nome}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: RED[i % RED.length] }}
                      />
                      <span
                        className="flex-1 truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {c.nome}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {c.ore}h
                      </span>
                      <span style={{ color: "var(--text-faint)" }}>
                        {totMinPie ? Math.round((c.min / totMinPie) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Andamento ore */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.3 }}
          className="rounded-xl border overflow-hidden lg:col-span-2"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Andamento Ore Team — {MESI[today.getMonth()]}
            </span>
          </div>
          <div className="px-5 py-4">
            {orePerGiorno.length === 0 ? (
              <p
                className="text-center text-sm py-6"
                style={{ color: "var(--text-faint)" }}
              >
                Nessun dato
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={orePerGiorno}
                  margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="data"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ore"
                    name="Ore"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#teamGrad)"
                    dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{
                      r: 5,
                      fill: "var(--primary)",
                      strokeWidth: 2,
                      stroke: "var(--bg-card)",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
