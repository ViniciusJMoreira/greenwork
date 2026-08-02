"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  CalendarDays,
  UtensilsCrossed,
  Milestone,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { getStats } from "@/lib/stats";
import { calcMin } from "@/lib/utils";

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
const GIORNI = [
  "domenica",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
];

function fmtMese(ym) {
  const [y, m] = ym.split("-");
  return `${MESI[parseInt(m) - 1]} ${y}`;
}

function KpiCard({ icon: Icon, value, label, index = 0, accent = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 290,
        delay: 0.1 + index * 0.08,
      }}
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        transformPerspective: 700,
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 18,
          delay: 0.2 + index * 0.08,
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "var(--primary-faint)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
      </motion.div>
      <div>
        <p
          className="text-xl font-bold tracking-tight"
          style={{ color: accent ? "var(--primary)" : "var(--text)" }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}

function HeatCell({ day, hours, index = 0 }) {
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
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 22,
        delay: 0.4 + index * 0.012,
      }}
      title={`${day}: ${hours > 0 ? hours.toFixed(1) + "h" : "riposo"}`}
      className="aspect-square rounded flex items-center justify-center text-[9px] font-bold cursor-default"
      style={{ background: bg, color }}
    >
      {day}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { operaio, turni } = useApp();
  const today = new Date();
  const meseCorrente = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [selectedMese, setSelectedMese] = useState(meseCorrente);

  // Mesi disponibili derivati dai turni dell'operaio + mese corrente
  const mesiOptions = useMemo(() => {
    const set = new Set(turni.map((t) => t.data?.slice(0, 7)).filter(Boolean));
    set.add(meseCorrente);
    return Array.from(set).sort().reverse();
  }, [turni, meseCorrente]);

  const [selYear, selMonth] = selectedMese.split("-").map(Number); // selMonth 1-based

  const turniMese = useMemo(
    () => turni.filter((t) => t.data?.startsWith(selectedMese)),
    [turni, selectedMese],
  );

  const stats = useMemo(() => getStats(turniMese), [turniMese]);

  // Valori KPI — se 0 mostra "-"
  const oreTot =
    stats.minutiTotali > 0 ? (stats.minutiTotali / 60).toFixed(1) + "h" : "—";
  const giorni = stats.giorniLavorati > 0 ? stats.giorniLavorati : "—";
  const media =
    stats.giorniLavorati > 0
      ? (stats.minutiTotali / 60 / stats.giorniLavorati).toFixed(1) + "h"
      : "—";
  const kmTot = useMemo(
    () => turniMese.reduce((acc, t) => acc + (t.km_totale || 0), 0),
    [turniMese],
  );
  const kmDisplay = kmTot > 0 ? kmTot.toFixed(1) + " km" : "—";

  // Buoni pasto — 1 per ogni giorno con ore totali >= 6.5h
  const buoniPasto = useMemo(() => {
    const orePerGiorno = {};
    turniMese.forEach((t) => {
      const min = calcMin(t.inizio, t.fine);
      if (min > 0) orePerGiorno[t.data] = (orePerGiorno[t.data] || 0) + min;
    });
    return Object.values(orePerGiorno).filter((min) => min >= 6.5 * 60).length;
  }, [turniMese]);

  // Heatmap mese selezionato
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const firstDayOffset = (() => {
    const d = new Date(selYear, selMonth - 1, 1).getDay();
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

  return (
    <div
      className="flex flex-col gap-4"
      style={{
        paddingBottom: "calc(max(16px, env(safe-area-inset-bottom)) + 16px)",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-1 flex items-start justify-between gap-3 flex-wrap"
      >
        <div>
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

        {/* Select mese — solo i mesi con dati disponibili */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedMese}
            onChange={(e) => setSelectedMese(e.target.value)}
            className="appearance-none rounded-lg pl-3 pr-8 py-2 text-sm outline-none border transition-colors cursor-pointer"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          >
            {mesiOptions.map((ym) => (
              <option key={ym} value={ym}>
                {fmtMese(ym)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="h-4 w-4 pointer-events-none absolute right-2.5"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </motion.div>

      {/* 4 KPI */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={Clock}
          value={oreTot}
          label={`Ore — ${MESI[selMonth - 1]}`}
          index={0}
          accent
        />
        <KpiCard
          icon={CalendarDays}
          value={giorni}
          label="Giorni Lavorati"
          index={1}
        />
        <KpiCard
          icon={UtensilsCrossed}
          value={buoniPasto > 0 ? buoniPasto : "—"}
          label="Buoni Pasto"
          index={2}
        />
        <KpiCard
          icon={Milestone}
          value={kmDisplay}
          label="Km Rimborso"
          index={3}
        />
      </div>

      {/* Calendario presenze */}
      <motion.div
        initial={{ opacity: 0, y: 18, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{
          type: "spring",
          damping: 22,
          stiffness: 280,
          delay: 0.45,
        }}
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          transformPerspective: 800,
        }}
      >
        <div
          className="flex items-center gap-2 px-5 py-3.5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            Presenze {fmtMese(selectedMese)}
          </span>
        </div>
        <div className="px-5 py-4">
          {/* Header giorni */}
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
          {/* Celle giorno */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => (
              <HeatCell
                key={i + 1}
                day={i + 1}
                hours={orePerGiornoMap[i + 1] || 0}
                index={i}
              />
            ))}
          </div>
          {/* Legenda */}
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
      </motion.div>
    </div>
  );
}
