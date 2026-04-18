"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart2,
  CalendarDays,
  Milestone,
  Wrench,
  BookUser,
  FileDown,
} from "lucide-react";
import TabRiepilogo   from "./tab-riepilogo";
import TabTurni       from "./tab-turni";
import TabKm          from "./tab-km";
import TabMacchinari  from "./tab-macchinari";
import TabAnagrafica  from "./tab-anagrafica";
import TabExport      from "./tab-export";

const TABS = [
  { id: "riepilogo",   label: "Riepilogo",    icon: BarChart2    },
  { id: "turni",       label: "Turni",        icon: CalendarDays },
  { id: "km",          label: "Km / Rimborsi",icon: Milestone    },
  { id: "macchinari",  label: "Macchinari",   icon: Wrench       },
  { id: "anagrafica",  label: "Anagrafica",   icon: BookUser     },
  { id: "export",      label: "Export",       icon: FileDown     },
];

export default function DashboardShell({ turni, dipendenti, cantieri, lavori, macchinari }) {
  const [activeTab, setActiveTab] = useState("riepilogo");

  const tabProps = { turni, dipendenti, cantieri, lavori, macchinari };

  return (
    <div className="flex gap-6 min-h-screen">

      {/* ── Sidebar desktop ───────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col gap-1 w-52 shrink-0 pt-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(id)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full"
              style={{
                color: active ? "var(--primary)" : "var(--text-muted)",
                background: active ? "var(--primary-faint)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--bg-subtle)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--primary-faint)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4 shrink-0 relative z-10" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          );
        })}
      </aside>

      {/* ── Contenuto principale ──────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Tab bar mobile */}
        <nav
          className="md:hidden flex gap-1 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(id)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors"
                style={{
                  color: active ? "white" : "var(--text-muted)",
                  background: active ? "var(--primary)" : "var(--bg-subtle)",
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </motion.button>
            );
          })}
        </nav>

        {/* Pannello tab attivo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeTab === "riepilogo"  && <TabRiepilogo  {...tabProps} />}
            {activeTab === "turni"      && <TabTurni      {...tabProps} />}
            {activeTab === "km"         && <TabKm         {...tabProps} />}
            {activeTab === "macchinari" && <TabMacchinari {...tabProps} />}
            {activeTab === "anagrafica" && <TabAnagrafica {...tabProps} />}
            {activeTab === "export"     && <TabExport     {...tabProps} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}