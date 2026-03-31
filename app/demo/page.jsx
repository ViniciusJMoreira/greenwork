"use client";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const kpi = [
  { icon: "⏱", label: "Ore Totali", value: "168,5h", trend: +10.5, sub: "vs 152h mese scorso" },
  { icon: "📅", label: "Giorni Lavorati", value: "22", trend: +10.0, sub: "vs 20 mese scorso" },
  { icon: "📊", label: "Media Giornaliera", value: "7,66h", trend: +1.2, sub: "per giorno lavorato" },
  { icon: "🏗", label: "Cantieri Attivi", value: "5", trend: 0, sub: "questo mese" },
];

const monthlyData = [
  { week: "Sett 1", corrente: 38, precedente: 32 },
  { week: "Sett 2", corrente: 42, precedente: 38 },
  { week: "Sett 3", corrente: 45, precedente: 40 },
  { week: "Sett 4", corrente: 43, precedente: 42 },
];

const cantieriData = [
  { name: "San Giuliano", value: 52 },
  { name: "Rimini Nord", value: 38 },
  { name: "Cesena Est", value: 30 },
  { name: "Bellaria", value: 22 },
  { name: "Riccione", value: 18 },
];

const notteData = [
  { week: "Sett 1", diurne: 34, notturne: 4 },
  { week: "Sett 2", diurne: 38, notturne: 4 },
  { week: "Sett 3", diurne: 41, notturne: 4 },
  { week: "Sett 4", diurne: 40, notturne: 3 },
];

const lavoriData = [
  { lavoro: "Muratura", ore: 48, pct: 28 },
  { lavoro: "Carpenteria", ore: 36, pct: 21 },
  { lavoro: "Scavi", ore: 28, pct: 17 },
  { lavoro: "Fondazioni", ore: 24, pct: 14 },
  { lavoro: "Finiture", ore: 20, pct: 12 },
  { lavoro: "Demolizioni", ore: 12, pct: 8 },
];

const macchinariData = [
  { mezzo: "Escavatore CAT", ore: 24 },
  { mezzo: "Gru Liebherr", ore: 18 },
  { mezzo: "Betoniera", ore: 12 },
  { mezzo: "Compattatore", ore: 8 },
];

// March 2026: day 1 = Sunday → offset 6 (Mon-based grid)
const CAL_OFFSET = 6;
const CAL_HOURS = [
  0,8.5,7,8,8.5,7,0, 0,7.5,8,9,8,7,0, 0,8.5,7,8,8.5,7,0, 0,8,8.5,7,8,8,0, 0,8,7.5,0
];

const PIE_COLORS = ["#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"];

function heatColor(h, dark) {
  if (!h) return dark ? "#1e293b" : "#f1f5f9";
  if (h < 4) return dark ? "#7f1d1d" : "#fecaca";
  if (h < 8) return dark ? "#991b1b" : "#f87171";
  return dark ? "#b91c1c" : "#dc2626";
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, trend, sub, dark }) {
  const bg = dark ? "#0f172a" : "#ffffff";
  const border = dark ? "#1e293b" : "#e2e8f0";
  const textMain = dark ? "#f8fafc" : "#0f172a";
  const textSub = dark ? "#94a3b8" : "#64748b";
  const trendColor = trend > 0 ? "#16a34a" : trend < 0 ? "#dc2626" : "#94a3b8";

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        {trend !== 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trendColor, background: trend > 0 ? (dark ? "#14532d" : "#dcfce7") : (dark ? "#7f1d1d" : "#fee2e2"), borderRadius: 20, padding: "2px 8px" }}>
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, color: textMain, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: textSub }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 11, color: textSub }}>{sub}</div>
    </div>
  );
}

function SectionCard({ title, children, dark }) {
  return (
    <div style={{ background: dark ? "#0f172a" : "#ffffff", border: `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#f8fafc" : "#0f172a", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const bg = dark ? "#020617" : "#f8fafc";
  const topbar = dark ? "#0f172a" : "#ffffff";
  const topbarBorder = dark ? "#1e293b" : "#e2e8f0";
  const text = dark ? "#f8fafc" : "#0f172a";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const navActive = "#b91c1c";
  const tooltipBg = dark ? "#1e293b" : "#ffffff";

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: tooltipBg, border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: text }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {p.value}h</div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "system-ui, sans-serif" }}>

      {/* TOPBAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: topbar, borderBottom: `1px solid ${topbarBorder}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontWeight: 900, fontSize: 18, color: "#b91c1c", letterSpacing: "-0.5px" }}>COOP134</span>
              <span style={{ fontSize: 9, color: textMuted, fontWeight: 600, letterSpacing: 1 }}>COOPERATIVA SOCIALE</span>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 4 }}>
            {["Dashboard","Storico","Inserisci Ore"].map((n, i) => (
              <button key={n} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: i === 0 ? (dark ? "#1e293b" : "#f1f5f9") : "transparent",
                color: i === 0 ? navActive : textMuted,
                borderBottom: i === 0 ? `2px solid ${navActive}` : "2px solid transparent",
              }}>{n}</button>
            ))}
          </div>

          {/* User menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, border: `1px solid ${topbarBorder}`, background: "transparent", cursor: "pointer" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>V</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Vinicius</span>
              <span style={{ color: textMuted, fontSize: 10 }}>▾</span>
            </button>

            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: 44, background: topbar, border: `1px solid ${topbarBorder}`, borderRadius: 12, padding: 8, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 100 }}>
                <div style={{ padding: "8px 12px", fontSize: 12, color: textMuted, borderBottom: `1px solid ${topbarBorder}`, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, color: text }}>Vinicius Junqueira</div>
                  <div>PIN: ••••</div>
                </div>
                <button
                  onClick={() => { setDark(!dark); setMenuOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: text, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
                >
                  {dark ? "☀️" : "🌙"} {dark ? "Modalità Chiara" : "Modalità Scura"}
                </button>
                <button style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  🚪 Esci
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: text, margin: 0 }}>Buongiorno, Vinicius 👋</h1>
          <p style={{ fontSize: 13, color: textMuted, margin: "4px 0 0" }}>Marzo 2026 · Riepilogo mensile</p>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
          {kpi.map((k) => <KpiCard key={k.label} {...k} dark={dark} />)}
        </div>

        {/* ROW 2: Monthly + Notte/Giorno */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <SectionCard title="📈 Andamento Mensile — Mar vs Feb 2026" dark={dark}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize: 12, color: textMuted }} />
                <Bar dataKey="corrente" name="Marzo" fill="#b91c1c" radius={[4,4,0,0]} />
                <Bar dataKey="precedente" name="Febbraio" fill={dark ? "#334155" : "#cbd5e1"} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="🌙 Ore Notturne vs Diurne" dark={dark}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={notteData}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize: 12, color: textMuted }} />
                <Bar dataKey="diurne" name="Diurne" stackId="a" fill="#b91c1c" radius={[0,0,0,0]} />
                <Bar dataKey="notturne" name="Notturne" stackId="a" fill={dark ? "#475569" : "#94a3b8"} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* ROW 3: Cantieri pie + Lavori */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <SectionCard title="🏗 Distribuzione Cantieri" dark={dark}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cantieriData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {cantieriData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}h`, "Ore"]} contentStyle={{ background: tooltipBg, border: "none", borderRadius: 10, fontSize: 12, color: text }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {cantieriData.map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: textMuted, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: text }}>{c.value}h</span>
                  <span style={{ fontSize: 11, color: textMuted }}>{Math.round(c.value / 160 * 100)}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="🔧 Ore per Tipo Lavoro" dark={dark}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lavoriData.map((l) => (
                <div key={l.lavoro}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: text, fontWeight: 600 }}>{l.lavoro}</span>
                    <span style={{ fontSize: 12, color: textMuted }}>{l.ore}h · {l.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: dark ? "#1e293b" : "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${l.pct}%`, background: `#b91c1c`, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ROW 4: Macchinari + Calendar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <SectionCard title="🚜 Utilizzo Macchinari" dark={dark}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              {macchinariData.map((m) => (
                <div key={m.mezzo}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: text, fontWeight: 600 }}>{m.mezzo}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c" }}>{m.ore}h</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: dark ? "#1e293b" : "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(m.ore / 24) * 100}%`, background: "linear-gradient(90deg, #b91c1c, #ef4444)", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 10, background: dark ? "#1e293b" : "#f8fafc", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: textMuted }}>Totale ore macchine</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#b91c1c" }}>62h</span>
            </div>
          </SectionCard>

          <SectionCard title="📆 Presenze Marzo 2026" dark={dark}>
            {/* Day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
              {["L","M","M","G","V","S","D"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: textMuted }}>{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {Array.from({ length: CAL_OFFSET }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {CAL_HOURS.map((h, i) => {
                const day = i + 1;
                return (
                  <div
                    key={day}
                    title={h ? `${day} Mar: ${h}h` : `${day} Mar: riposo`}
                    style={{
                      aspectRatio: "1", borderRadius: 5, background: heatColor(h, dark),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700,
                      color: h >= 8 ? "white" : h >= 4 ? (dark ? "#fecaca" : "#7f1d1d") : textMuted,
                      cursor: "default",
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, color: textMuted }}>Meno</span>
              {[0, 2, 6, 8].map((h) => (
                <div key={h} style={{ width: 12, height: 12, borderRadius: 3, background: heatColor(h, dark) }} />
              ))}
              <span style={{ fontSize: 10, color: textMuted }}>Più</span>
            </div>
          </SectionCard>
        </div>

        {/* DEMO BADGE */}
        <div style={{ marginTop: 32, textAlign: "center", padding: "12px 20px", borderRadius: 12, background: dark ? "#0f172a" : "#ffffff", border: `1px dashed ${dark ? "#334155" : "#cbd5e1"}` }}>
          <span style={{ fontSize: 12, color: textMuted }}>
            🎨 Questa è una pagina demo con dati mock — va su{" "}
            <strong style={{ color: "#b91c1c" }}>/demo</strong> · nessun dato reale coinvolto
          </span>
        </div>
      </div>
    </div>
  );
}