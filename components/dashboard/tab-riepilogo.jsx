"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Clock, CalendarDays, Building2, ChevronLeft, ChevronRight, Scissors, ShieldCheck } from "lucide-react";
import { getStats, getOrePerGiorno, getPieData, getOreLavori } from "@/lib/stats";
import { calcMin } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area,
} from "recharts";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

const SFALCIO_LAVORI = [
  "Sfalcio CP","Sfalcio AE","Sfalcio CP+CS","Sfalcio CS","Sfalcio AE+CP",
  "Sfalcio CP + Rullo","Sfalcio CS + Rullo","Sabbia","Rullatura",
  "Altre Manutenzioni","Rigatura Extra","Rigatura",
];
const CUSTODIA_LAVORI = [
  "Custodia","Pulizia Spogliatoi","Custodia Partita","Pulizie GENERALI","Innaffiatura",
];

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

function redGradient(ratio) {
  const l = Math.round(88 - ratio * 52);
  return `hsl(0, 72%, ${l}%)`;
}
function greenGradient(ratio) {
  const l = Math.round(82 - ratio * 44);
  return `hsl(142, 65%, ${l}%)`;
}
function blueGradient(ratio) {
  const l = Math.round(82 - ratio * 44);
  return `hsl(217, 72%, ${l}%)`;
}

function StatCard({ icon: Icon, value, label, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 300, delay: 0.05 + index * 0.07 }}
      style={{ background: "var(--bg-card)", borderColor: "var(--border)", transformPerspective: 700 }}
      className="rounded-xl border p-4 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-faint)" }}>
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <p className="text-lg font-bold leading-none" style={{ color: "var(--text)" }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || "var(--primary)" }}>{p.name}: {p.value}h</p>)}
    </div>
  );
}

// Carosello riutilizzabile: pagina 0 = lista barre, pagina 1 = pie chart
function OreCarousel({ title, icon: Icon, data, colorFn, delay = 0.38 }) {
  const [page, setPage] = useState(0);
  const [dir,  setDir]  = useState(1);

  function goPage(p) {
    setDir(p > page ? 1 : -1);
    setPage(p);
  }

  const totMin = data.reduce((a, c) => a + c.min, 0);
  const maxOre = data[0]?.ore || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {title} — {page === 0 ? "Ore effettive" : "Grafico"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => goPage(0)} className="p-0.5 rounded" style={{ opacity: page === 0 ? 0.3 : 1 }}>
            <ChevronLeft className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
          {[0, 1].map((p) => (
            <button key={p} onClick={() => goPage(p)}
              className="rounded-full transition-all"
              style={{ width: page === p ? 16 : 6, height: 6, background: page === p ? "var(--primary)" : "var(--border)" }}
            />
          ))}
          <button onClick={() => goPage(1)} className="p-0.5 rounded" style={{ opacity: page === 1 ? 0.3 : 1 }}>
            <ChevronRight className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div className="overflow-hidden relative" style={{ minHeight: 220 }}>
        {data.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "var(--text-faint)" }}>Nessun dato</p>
        ) : (
          <AnimatePresence mode="wait" custom={dir}>

            {/* Pagina 0 — Lista barre */}
            {page === 0 && (
              <motion.div key="list" custom={dir}
                variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
                onDragEnd={(_, info) => { if (info.offset.x < -40) goPage(1); }}
                className="px-5 pt-4 pb-2"
              >
                {/* onPointerDown stopPropagation impedisce al drag di catturare lo scroll verticale su mobile */}
                <div
                  className="flex flex-col gap-2.5 overflow-y-auto pr-1"
                  style={{ maxHeight: 210 }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {data.map((c) => {
                    const ratio = c.ore / maxOre;
                    const color = colorFn(ratio);
                    const pct   = totMin ? Math.round((c.min / totMin) * 100) : 0;
                    return (
                      <div key={c.nome}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs truncate max-w-[65%]" style={{ color: "var(--text)" }}>{c.nome}</span>
                          <span className="text-xs font-semibold shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                            {c.ore}h · {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio * 100}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Pagina 1 — PieChart */}
            {page === 1 && (
              <motion.div key="pie" custom={dir}
                variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
                onDragEnd={(_, info) => { if (info.offset.x > 40) goPage(0); }}
                className="px-5 py-4"
              >
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%" cy="50%"
                      innerRadius={38} outerRadius={64}
                      dataKey="ore" paddingAngle={2}
                    >
                      {data.map((c, i) => (
                        <Cell key={c.nome} fill={colorFn(1 - i / Math.max(data.length - 1, 1))} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v}h`, "Ore"]}
                      contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 max-h-16 overflow-y-auto pr-1">
                  {data.map((c, i) => (
                    <div key={c.nome} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colorFn(1 - i / Math.max(data.length - 1, 1)) }} />
                      <span className="flex-1 truncate" style={{ color: "var(--text-muted)" }}>{c.nome}</span>
                      <span className="font-semibold shrink-0" style={{ color: "var(--text)" }}>{c.ore}h</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export default function TabRiepilogo({ turni: tuttiTurni, dipendenti }) {
  const today   = new Date();
  const meseStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const tickStyle = { fontSize: 11, fill: "var(--text-muted)" };

  const turniMese = useMemo(() => tuttiTurni.filter((t) => t.data?.startsWith(meseStr)), [tuttiTurni, meseStr]);

  const stats        = useMemo(() => getStats(turniMese), [turniMese]);
  const operaiAttivi = useMemo(() => new Set(turniMese.map((t) => t.dipendente_id)).size, [turniMese]);

  const orePerOperaio = useMemo(() => {
    const map = {};
    turniMese.forEach((t) => {
      const k = t.nome_operaio || "—";
      map[k] = (map[k] || 0) + calcMin(t.inizio, t.fine) / 60;
    });
    return Object.entries(map)
      .map(([nome, ore]) => ({ nome: nome.split(" ")[0], ore: parseFloat(ore.toFixed(1)) }))
      .sort((a, b) => b.ore - a.ore);
  }, [turniMese]);

  const allCantieri  = useMemo(() => getPieData(turniMese), [turniMese]);
  const oreSfalcio   = useMemo(() => getOreLavori(turniMese, SFALCIO_LAVORI), [turniMese]);
  const oreCustodia  = useMemo(() => getOreLavori(turniMese, CUSTODIA_LAVORI), [turniMese]);
  const orePerGiorno = useMemo(() => getOrePerGiorno(turniMese, 14), [turniMese]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Riepilogo</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {MESI[today.getMonth()]} {today.getFullYear()} — {tuttiTurni.length} turni totali
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Clock}        value={`${(stats.minutiTotali / 60).toFixed(1)}h`} label="Ore totali (mese)" index={0} />
        <StatCard icon={Users}        value={operaiAttivi}          label="Operai attivi"    index={1} />
        <StatCard icon={CalendarDays} value={stats.giorniLavorati}  label="Giorni con turni" index={2} />
        <StatCard icon={Building2}    value={stats.numCantieri}     label="Cantieri coperti" index={3} />
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ore per operaio */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}
          className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <Users className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Ore per Operaio</span>
          </div>
          <div className="px-5 py-4">
            {orePerOperaio.length === 0 ? (
              <p className="text-center text-sm py-6" style={{ color: "var(--text-faint)" }}>Nessun dato</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={orePerOperaio} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nome" tick={tickStyle} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ore" name="Ore" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Cantieri */}
        <OreCarousel
          title="Cantieri"
          icon={Building2}
          data={allCantieri}
          colorFn={redGradient}
          delay={0.38}
        />

        {/* Sfalcio */}
        <OreCarousel
          title="Sfalcio"
          icon={Scissors}
          data={oreSfalcio}
          colorFn={greenGradient}
          delay={0.44}
        />

        {/* Custodia */}
        <OreCarousel
          title="Custodia"
          icon={ShieldCheck}
          data={oreCustodia}
          colorFn={blueGradient}
          delay={0.50}
        />

        {/* Andamento ore — full width */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56, duration: 0.3 }}
          className="rounded-xl border overflow-hidden lg:col-span-2" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Andamento Ore Team — {MESI[today.getMonth()]}</span>
          </div>
          <div className="px-5 py-4">
            {orePerGiorno.length === 0 ? (
              <p className="text-center text-sm py-6" style={{ color: "var(--text-faint)" }}>Nessun dato</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={orePerGiorno} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="data" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="ore" name="Ore" stroke="var(--primary)" strokeWidth={2} fill="url(#teamGrad)"
                    dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--bg-card)" }}
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