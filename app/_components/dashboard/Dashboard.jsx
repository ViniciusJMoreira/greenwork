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
} from "recharts";

import StatCard from "./StatCard";

import { getOrePerGiorno, getPieData, getStats } from "@/lib/stats";
import { useApp } from "@/app/_components/AppContext";
import { fmtOre } from "@/lib/utils";

const PIE_COLORS = [
  "#16a34a",
  "#15803d",
  "#166534",
  "#4ade80",
  "#86efac",
  "#22c55e",
  "#bbf7d0",
  "#dcfce7",
  "#6ee7b7",
  "#a7f3d0",
];

function Dashboard() {
  const { turni: registri } = useApp();
  const { minutiTotali, giorniSet, numCantieri } = getStats(registri);
  const orePerGiorno = getOrePerGiorno(registri);
  const pieData = getPieData(registri);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon="⏱️"
          label="Ore Totali"
          value={fmtOre(minutiTotali)}
          accent="#4ade80"
        />
        <StatCard
          icon="📅"
          label="Giorni"
          value={giorniSet.size}
          accent="#60a5fa"
        />
        <StatCard
          icon="🏗️"
          label="Cantieri"
          value={numCantieri}
          accent="#fb923c"
        />
      </div>

      {/* Bar chart */}
      {orePerGiorno.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#1f2937" }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Ore per Giorno (ultimi 7)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={orePerGiorno}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <XAxis dataKey="data" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "none",
                  borderRadius: 8,
                  color: "#f9fafb",
                }}
                formatter={(v) => [`${v} h`, "Ore"]}
              />
              <Bar dataKey="ore" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#1f2937" }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Distribuzione Cantieri
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="ore"
                nameKey="nome"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "none",
                  borderRadius: 8,
                  color: "#f9fafb",
                }}
                formatter={(v) => [`${v} h`, "Ore"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Horizontal bars */}
      {pieData.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "#1f2937" }}
        >
          <h3 className="text-sm font-semibold text-gray-300">
            Ore per Cantiere
          </h3>
          {pieData.map((c, i) => {
            const pct =
              minutiTotali > 0 ? Math.round((c.min / minutiTotali) * 100) : 0;
            return (
              <div key={c.nome}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="truncate">{c.nome}</span>
                  <span className="ml-2 shrink-0 tabular-nums">
                    {c.ore} h · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {registri.length === 0 && (
        <p className="py-16 text-center text-sm text-gray-500">
          Nessuna ora inserita. Vai su Inserisci per cominciare.
        </p>
      )}
    </div>
  );
}
export default Dashboard;
