"use client";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Clock,
  CalendarDays,
  TrendingUp,
  Building2,
  TrendingDown,
  Wrench,
  HardHat,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { getStats, getOrePerGiorno, getPieData } from "@/lib/stats";
import { calcMin, fmtOre } from "@/lib/utils";

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
const MESI_S = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];
const GIORNI = [
  "domenica",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
];
const RED = ["#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5"];

// ── Componenti interni ───────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="flex items-center gap-2 px-5 py-3.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {Icon && (
          <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text)" }}
        >
          {title}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function KpiCard({ icon: Icon, value, label, trend }) {
  const up = trend > 0;
  const TI = up ? TrendingUp : TrendingDown;
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--primary-faint)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
        </div>
        {trend !== 0 && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5"
            style={{
              background: up ? "#f0fdf4" : "#fef2f2",
              color: up ? "#15803d" : "var(--destructive)",
            }}
          >
            <TI className="h-3 w-3" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

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

function HeatCell({ day, hours }) {
  let bg = "var(--bg-subtle)";
  let color = "var(--text-faint)";
  if (hours >= 8) {
    bg = "#b91c1c";
    color = "white";
  } else if (hours >= 4) {
    bg = "#fca5a5";
    color = "#7f1d1d";
  } else if (hours > 0) {
    bg = "#fee2e2";
    color = "#b91c1c";
  }
  return (
    <div
      title={`${day}: ${hours > 0 ? hours.toFixed(1) + "h" : "riposo"}`}
      className="aspect-square rounded flex items-center justify-center text-[9px] font-bold cursor-default transition-all"
      style={{ background: bg, color }}
    >
      {day}
    </div>
  );
}

// ── Pagina principale ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { operaio, turni } = useApp();
  const today = new Date();
  const meseStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMeseStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const turniMese = useMemo(
    () => turni.filter((t) => t.data?.startsWith(meseStr)),
    [turni, meseStr],
  );
  const turniPrev = useMemo(
    () => turni.filter((t) => t.data?.startsWith(prevMeseStr)),
    [turni, prevMeseStr],
  );

  const stats = useMemo(() => getStats(turniMese), [turniMese]);
  const statsPrev = useMemo(() => getStats(turniPrev), [turniPrev]);

  function trend(curr, prev) {
    if (!prev) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const oreTot = (stats.minutiTotali / 60).toFixed(1);
  const media = stats.giorniLavorati
    ? (stats.minutiTotali / 60 / stats.giorniLavorati).toFixed(1)
    : "0";
  const orePerGiorno = useMemo(
    () => getOrePerGiorno(turniMese, 14),
    [turniMese],
  );
  const pieData = useMemo(() => getPieData(turniMese).slice(0, 5), [turniMese]);
  const totMinPie = pieData.reduce((a, c) => a + c.min, 0);

  const lavoriData = useMemo(() => {
    const map = {};
    turniMese.forEach((t) => {
      if (t.lavoro)
        map[t.lavoro] = (map[t.lavoro] || 0) + calcMin(t.inizio, t.fine);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([lavoro, min]) => ({
        lavoro,
        min,
        pct: total ? Math.round((min / total) * 100) : 0,
      }))
      .sort((a, b) => b.min - a.min)
      .slice(0, 6);
  }, [turniMese]);

  const macchinariData = useMemo(() => {
    const map = {};
    turniMese.forEach((t) => {
      if (t.macchinario)
        map[t.macchinario] =
          (map[t.macchinario] || 0) + calcMin(t.inizio, t.fine);
    });
    return Object.entries(map)
      .map(([mezzo, min]) => ({
        mezzo,
        ore: parseFloat((min / 60).toFixed(1)),
      }))
      .sort((a, b) => b.ore - a.ore);
  }, [turniMese]);

  // Heatmap mese corrente
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOffset = (() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();
  const orePerGiornoMap = useMemo(() => {
    const map = {};
    turniMese.forEach((t) => {
      const d = parseInt(t.data?.split("-")[2]);
      if (d) map[d] = (map[d] || 0) + calcMin(t.inizio, t.fine) / 60;
    });
    return map;
  }, [turniMese]);

  const dateLabel = `${GIORNI[today.getDay()]} ${today.getDate()} ${MESI[today.getMonth()]} ${today.getFullYear()}`;

  const tickStyle = { fontSize: 11, fill: "var(--text-muted)" };
  const empty = (
    <p
      className="text-center text-sm py-6"
      style={{ color: "var(--text-faint)" }}
    >
      Nessun dato disponibile
    </p>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Bentornato, {operaio?.nome}
        </h1>
        <p
          className="text-sm capitalize mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {dateLabel}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Clock}
          value={`${oreTot}h`}
          label="Ore Totali"
          trend={trend(stats.minutiTotali, statsPrev.minutiTotali)}
        />
        <KpiCard
          icon={CalendarDays}
          value={stats.giorniLavorati}
          label="Giorni Lavorati"
          trend={trend(stats.giorniLavorati, statsPrev.giorniLavorati)}
        />
        <KpiCard
          icon={TrendingUp}
          value={`${media}h`}
          label="Media Giornaliera"
          trend={0}
        />
        <KpiCard
          icon={Building2}
          value={stats.numCantieri}
          label="Cantieri Attivi"
          trend={trend(stats.numCantieri, statsPrev.numCantieri)}
        />
      </div>

      {/* Andamento ore */}
      <Section title={`Andamento Ore — ${MESI[today.getMonth()]}`}>
        {orePerGiorno.length === 0 ? (
          empty
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={orePerGiorno}
              margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="oreGrad" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#oreGrad)"
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
      </Section>

      {/* Cantieri + Lavori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Distribuzione Cantieri" icon={HardHat}>
          {pieData.length === 0 ? (
            empty
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
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
              <div className="flex flex-col gap-1.5 mt-1">
                {pieData.map((c, i) => (
                  <div key={c.nome} className="flex items-center gap-2 text-xs">
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
        </Section>

        <Section title="Ore per Tipo Lavoro" icon={Wrench}>
          {lavoriData.length === 0 ? (
            empty
          ) : (
            <div className="flex flex-col gap-3">
              {lavoriData.map((l) => (
                <div key={l.lavoro}>
                  <div className="flex justify-between text-xs mb-1">
                    <span
                      className="truncate font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {l.lavoro}
                    </span>
                    <span
                      className="shrink-0 ml-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fmtOre(l.min)} · {l.pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${l.pct}%`,
                        background: "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Macchinari + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Utilizzo Macchinari">
          {macchinariData.length === 0 ? (
            <p
              className="text-center text-sm py-6"
              style={{ color: "var(--text-faint)" }}
            >
              Nessun macchinario registrato
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {macchinariData.map((m) => {
                const pct = (m.ore / macchinariData[0].ore) * 100;
                return (
                  <div key={m.mezzo}>
                    <div className="flex justify-between text-xs mb-1">
                      <span
                        className="truncate font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {m.mezzo}
                      </span>
                      <span
                        className="font-bold shrink-0 ml-2"
                        style={{ color: "var(--primary)" }}
                      >
                        {m.ore}h
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Heatmap */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Presenze {MESI[today.getMonth()]}
            </span>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-bold"
                  style={{ color: "var(--text-faint)" }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <HeatCell
                  key={i + 1}
                  day={i + 1}
                  hours={orePerGiornoMap[i + 1] || 0}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span
                className="text-[10px]"
                style={{ color: "var(--text-faint)" }}
              >
                Meno
              </span>
              {["var(--bg-subtle)", "#fee2e2", "#fca5a5", "#b91c1c"].map(
                (c, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{ background: c }}
                  />
                ),
              )}
              <span
                className="text-[10px]"
                style={{ color: "var(--text-faint)" }}
              >
                Più
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
