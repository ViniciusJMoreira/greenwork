"use client";
import { useState, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { MapPin, Loader2 } from "lucide-react";
import { updateCantierePosizione } from "@/lib/actions";

function MapLoader() {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: "#111827" }}>
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
    </div>
  );
}

const MappaView = dynamic(
  () => import("@/components/mappa/mappa-view"),
  { ssr: false, loading: () => <MapLoader /> },
);
const MappaEditor = dynamic(
  () => import("@/components/mappa/mappa-editor"),
  { ssr: false, loading: () => <MapLoader /> },
);

export default function TabMappa({ cantieri: initialCantieri }) {
  const [cantieri, setCantieri]   = useState(initialCantieri);
  const [editing,  setEditing]    = useState(null);
  const [isPending, startTransition] = useTransition();

  const positioned   = useMemo(() => cantieri.filter((c) => c.lat && c.lng), [cantieri]);
  const unpositioned = useMemo(
    () => cantieri.filter((c) => (!c.lat || !c.lng) && !c.isAssenza),
    [cantieri],
  );

  function handleSave({ lat, lng, area_geojson }) {
    startTransition(async () => {
      const res = await updateCantierePosizione(editing.id, { lat, lng, area_geojson });
      if (res.success) {
        setCantieri((prev) =>
          prev.map((c) => (c.id === editing.id ? { ...c, lat, lng, area_geojson } : c)),
        );
        setEditing(null);
      } else {
        alert(res.error || "Errore durante il salvataggio");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Mappa Cantieri</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {editing
            ? `Posizionamento: ${editing.cantiere}`
            : `${positioned.length} cantieri posizionati`}
        </p>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="rounded-xl border overflow-hidden"
        style={{ height: 420, background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {editing ? (
          <MappaEditor
            cantiere={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={isPending}
          />
        ) : (
          <MappaView cantieri={cantieri} onEdit={setEditing} />
        )}
      </motion.div>

      {/* Cantieri da posizionare */}
      {!editing && unpositioned.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.2 }}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <MapPin className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Cantieri da posizionare ({unpositioned.length})
            </span>
          </div>
          <div className="flex flex-col">
            {unpositioned.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.cantiere}</p>
                  <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{c.cod_cantiere}</p>
                </div>
                <button
                  onClick={() => setEditing(c)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--primary-faint)", color: "var(--primary)" }}
                >
                  Posiziona
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}