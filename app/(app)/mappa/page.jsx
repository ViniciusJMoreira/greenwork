"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { MapPin, Loader2 } from "lucide-react";
import { useApp } from "@/components/app-context";

function MapLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border"
      style={{ height: 420, background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Caricamento mappa…</p>
    </div>
  );
}

// Read-only map — no onEdit prop passed so the popup shows only "Naviga →"
const MappaView = dynamic(
  () => import("@/components/mappa/mappa-view"),
  { ssr: false, loading: () => <MapLoader /> },
);

export default function MappaPage() {
  const { cantieri } = useApp();

  const positioned   = useMemo(() => cantieri.filter((c) => c.lat && c.lng && !c.isAssenza), [cantieri]);
  const unpositioned = useMemo(() => cantieri.filter((c) => (!c.lat || !c.lng) && !c.isAssenza), [cantieri]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Cantieri</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {positioned.length} cantieri sulla mappa
        </p>
      </motion.div>

      {/* Mappa */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl border overflow-hidden"
        style={{ height: 420, borderColor: "var(--border)", isolation: "isolate" }}
      >
        <MappaView cantieri={cantieri} />
      </motion.div>

      {/* Lista cantieri posizionati */}
      {positioned.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <MapPin className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Cantieri attivi
            </span>
          </div>
          <div className="flex flex-col">
            {positioned.map((c, i) => (
              <motion.a
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04, duration: 0.2 }}
                href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 border-b last:border-0 transition-colors"
                style={{ borderColor: "var(--border)", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--primary-faint)" }}
                  >
                    <MapPin className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.cantiere}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{c.cod_cantiere}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: "var(--primary)" }}>
                  Naviga →
                </span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cantieri senza posizione — solo info, no azione */}
      {unpositioned.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.2 }}
          className="rounded-xl border px-4 py-3 flex items-center gap-3"
          style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {unpositioned.length} cantieri non ancora posizionati sulla mappa
          </p>
        </motion.div>
      )}
    </div>
  );
}