"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  CalendarDays,
  UtensilsCrossed,
  Milestone,
  ChevronDown,
  CalendarOff,
  Moon,
  ArrowRight,
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

const ASSENZA_BG = "#3b82f6";

function HeatCell({ day, hours, assenza, selected, onClick, index = 0 }) {
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
  } else if (assenza) {
    bg = ASSENZA_BG;
    color = "white";
  }
  // Assenza + ore nello stesso giorno: metà blu e metà colore ore, taglio "/" sfumato
  const misto = assenza && hours > 0;
  if (misto) {
    bg = `linear-gradient(135deg, ${ASSENZA_BG} 0%, ${ASSENZA_BG} 40%, ${bg} 60%, ${bg} 100%)`;
    color = "white";
  }
  const ore = hours > 0 ? hours.toFixed(1) + "h" : "";
  const title = assenza
    ? `${day}: ${assenza}${ore ? " · " + ore : ""}`
    : `${day}: ${ore || "riposo"}`;
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
    >
      <motion.button
        type="button"
        onClick={onClick}
        animate={{ scale: selected ? 1.08 : 1 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        title={title}
        className="w-full aspect-square rounded flex items-center justify-center text-[9px] font-bold cursor-pointer"
        style={{
          background: bg,
          color,
          textShadow: misto ? "0 0 3px rgba(0,0,0,0.55)" : "none",
          boxShadow: selected
            ? "0 0 0 2px var(--bg-card), 0 0 0 4px var(--primary)"
            : "none",
        }}
      >
        {day}
      </motion.button>
    </motion.div>
  );
}

// Bolla animata con il dettaglio del giorno cliccato
function DayBubble({ info, onClose }) {
  const { label, hours, assenza, giorno, hasTurni } = info;
  let Icon = Moon;
  let accent = "var(--text-muted)";
  let bgIcon = "var(--bg-subtle)";
  let value = "Riposo";
  if (hours > 0) {
    Icon = Clock;
    accent = "var(--primary)";
    bgIcon = "var(--primary-faint)";
    value = hours.toFixed(1).replace(".", ",") + " ore";
  } else if (assenza) {
    Icon = CalendarOff;
    accent = ASSENZA_BG;
    bgIcon = "rgba(59,130,246,0.15)";
    value = assenza;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      onClick={onClose}
      className="absolute left-3 right-3 top-2 z-10 rounded-xl border px-4 py-3 flex items-center gap-3 shadow-xl cursor-pointer"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 16, delay: 0.05 }}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: bgIcon }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="text-base font-bold leading-tight" style={{ color: accent }}>
          {value}
          {hours > 0 && assenza && (
            <span className="text-xs font-semibold ml-2" style={{ color: ASSENZA_BG }}>
              + {assenza}
            </span>
          )}
        </p>
      </div>
      {hasTurni && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.12 }}
          className="shrink-0"
        >
          <Link
            href={`/storico?giorno=${giorno}`}
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              color: "var(--primary)",
              background: "var(--primary-faint)",
              borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          >
            Storico
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      )}
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
  // Per ogni giorno: ore lavorate + nome dell'eventuale assenza (Ferie, Permesso...)
  const giorniMap = useMemo(() => {
    const map = {};
    turniMese.forEach((t) => {
      const d = parseInt(t.data?.split("-")[2]);
      if (!d) return;
      if (!map[d]) map[d] = { hours: 0, assenza: null };
      map[d].hours += calcMin(t.inizio, t.fine) / 60;
      if (t.isAssenza) map[d].assenza = t.cantiere;
    });
    return map;
  }, [turniMese]);

  // Giorno cliccato nel calendario → bolla con il dettaglio, si chiude da sola
  const [selected, setSelected] = useState(null); // { mese, day }
  const selectedDay = selected?.mese === selectedMese ? selected.day : null;

  // Con turni nel giorno la bolla resta di più, per dare tempo di toccare "Storico"
  const bubbleMs = selectedDay && giorniMap[selectedDay] ? 5000 : 2500;
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => setSelected(null), bubbleMs);
    return () => clearTimeout(timer);
  }, [selected, bubbleMs]);

  function toggleDay(day) {
    setSelected((prev) =>
      prev?.mese === selectedMese && prev.day === day ? null : { mese: selectedMese, day },
    );
  }

  const bubbleInfo = selectedDay
    ? {
        ...(giorniMap[selectedDay] ?? { hours: 0, assenza: null }),
        hasTurni: !!giorniMap[selectedDay],
        giorno: `${selectedMese}-${String(selectedDay).padStart(2, "0")}`,
        label: `${GIORNI[new Date(selYear, selMonth - 1, selectedDay).getDay()]} ${selectedDay} ${MESI[selMonth - 1]}`,
      }
    : null;

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
        <div className="px-5 py-4 relative">
          {/* Bolla dettaglio giorno */}
          <AnimatePresence>
            {bubbleInfo && (
              <DayBubble
                key={`${selectedMese}-${selectedDay}`}
                info={bubbleInfo}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>

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
                hours={giorniMap[i + 1]?.hours || 0}
                assenza={giorniMap[i + 1]?.assenza}
                selected={selectedDay === i + 1}
                onClick={() => toggleDay(i + 1)}
                index={i}
              />
            ))}
          </div>
          {/* Legenda */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: ASSENZA_BG }}
            />
            <span
              className="text-[10px] mr-2"
              style={{ color: "var(--text-faint)" }}
            >
              Assenza
            </span>
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
