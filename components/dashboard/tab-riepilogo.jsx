"use client";
import { useMemo } from "react";
import { motion } from "motion/react";
import { Users, Clock, CalendarDays, Building2 } from "lucide-react";
import { getStats, getOrePerGiorno, getPieData } from "@/lib/stats";
import { calcMin } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area,
} from "recharts";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const RED  = ["#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"];

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

  const pieData    = useMemo(() => getPieData(turniMese).slice(0, 5), [turniMese]);
  const totMinPie  = pieData.reduce((a, c) => a + c.min, 0);
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
        <StatCard icon={Clock}       value={`${(stats.minutiTotali / 60).toFixed(1)}h`} label="Ore totali (mese)" index={0} />
        <StatCard icon={Users}       value={operaiAttivi}          label="Operai attivi"    index={1} />
        <StatCard icon={CalendarDays} value={stats.giorniLavorati} label="Giorni con turni" index={2} />
        <StatCard icon={Building2}   value={stats.numCantieri}     label="Cantieri coperti" index={3} />
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

        {/* Distribuzione cantieri */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.3 }}
          className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <Building2 className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Distribuzione Cantieri</span>
          </div>
          <div className="px-5 py-4">
            {pieData.length === 0 ? (
              <p className="text-center text-sm py-6" style={{ color: "var(--text-faint)" }}>Nessun dato</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="ore" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={RED[i % RED.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}h`, "Ore"]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 mt-1">
                  {pieData.map((c, i) => (
                    <div key={c.nome} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RED[i % RED.length] }} />
                      <span className="flex-1 truncate" style={{ color: "var(--text-muted)" }}>{c.nome}</span>
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{c.ore}h</span>
                      <span style={{ color: "var(--text-faint)" }}>{totMinPie ? Math.round((c.min / totMinPie) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Andamento ore */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.3 }}
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