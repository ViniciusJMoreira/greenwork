"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { deleteTurno } from "@/lib/actions";
import { calcMin, fmtOre, fmtData } from "@/lib/utils";

const GIORNI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];

function formatHeader(dataStr) {
  const [y, m, d] = dataStr.split("-").map(Number);
  const dn = GIORNI[new Date(y, m - 1, d).getDay()];
  return `${dn} ${fmtData(dataStr)}`;
}

function Pill({
  children,
  color = "var(--primary)",
  bg = "var(--primary-faint)",
}) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border"
      style={{ color, background: bg, borderColor: color + "33" }}
    >
      {children}
    </span>
  );
}

function ShiftCard({ record, onDelete }) {
  const min = calcMin(record.inizio, record.fine);
  return (
    <div
      className="group rounded-xl border px-4 py-3 flex items-start gap-3 transition-colors"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--border-strong)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {/* Left accent */}
      <div
        className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5"
        style={{ background: "var(--primary)" }}
      />

      <div className="flex-1 min-w-0">
        {/* Riga 1: cantiere + badge lavoro */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text)" }}
          >
            {record.cantiere}
          </span>
          {record.lavoro && <Pill>{record.lavoro}</Pill>}
        </div>

        {/* Riga 2: orario + ore */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {record.inizio} → {record.fine}
          </span>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--primary)" }}
          >
            {fmtOre(min)}
          </span>
        </div>

        {/* Riga 3: macchinario + note */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {record.macchinario && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-faint)" }}
            >
              <Wrench className="h-3 w-3" /> {record.macchinario}
            </span>
          )}
          {record.note && (
            <span
              className="text-xs italic truncate"
              style={{ color: "var(--text-faint)" }}
            >
              {record.note}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(record)}
        className="shrink-0 transition-colors p-1.5 rounded-lg"
        style={{ color: "var(--text-faint)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--destructive)";
          e.currentTarget.style.background = "var(--primary-faint)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-faint)";
          e.currentTarget.style.background = "transparent";
        }}
        title="Elimina turno"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm outline-none border transition-colors cursor-pointer"
        style={{
          background: "var(--bg-subtle)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      >
        {children}
      </select>
    </div>
  );
}

function FilterInput({ label, value, onChange, type = "date" }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm outline-none border transition-colors"
        style={{
          background: "var(--bg-subtle)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

/* Dialog di conferma eliminazione — bottom sheet su mobile, modal centrato su desktop */
function ConfirmDialog({ record, onConfirm, onCancel }) {
  if (!record) return null;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      {/* Card — mb-16 su mobile per stare sopra il bottom nav */}
      <div
        className="w-full sm:max-w-sm rounded-2xl p-6 mb-16 sm:mb-0 flex flex-col gap-4"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icona + titolo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--primary-faint)" }}
          >
            <AlertTriangle
              className="h-6 w-6"
              style={{ color: "var(--destructive)" }}
            />
          </div>
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Elimina turno
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Sei sicuro di voler eliminare il turno{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              &ldquo;{record.cantiere}&rdquo;
            </span>{" "}
            del{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {fmtData(record.data)}
            </span>
            ?<br />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              Verrà sincronizzato con Google Sheets.
            </span>
          </p>
        </div>

        {/* Bottoni */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border)",
              background: "transparent",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-subtle)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ background: "var(--destructive)", color: "white" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoricoPage() {
  const { turni, rimuoviTurno, cantieri, lavori } = useApp();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCantiere, setSelectedCantiere] = useState("all");
  const [selectedLavoro, setSelectedLavoro] = useState("all");
  const [open, setOpen] = useState(true);
  const [confirmRecord, setConfirmRecord] = useState(null);

  // Blocca/sblocca scroll body quando il dialog è aperto
  useEffect(() => {
    document.body.style.overflow = confirmRecord ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmRecord]);

  const hasFilters =
    startDate ||
    endDate ||
    selectedCantiere !== "all" ||
    selectedLavoro !== "all";
  const activeCount = [
    startDate,
    endDate,
    selectedCantiere !== "all",
    selectedLavoro !== "all",
  ].filter(Boolean).length;

  // Apre il dialog di conferma passando il record completo
  function handleDelete(record) {
    setConfirmRecord(record);
  }

  // Eseguito dopo conferma — chiama deleteTurno e aggiorna lo stato locale
  async function handleConfirmDelete() {
    const record = confirmRecord;
    setConfirmRecord(null);
    const result = await deleteTurno(record.id);
    if (result.success) rimuoviTurno(record.id);
  }

  function reset() {
    setStartDate("");
    setEndDate("");
    setSelectedCantiere("all");
    setSelectedLavoro("all");
  }

  const filtered = useMemo(
    () =>
      turni.filter((t) => {
        if (startDate && t.data < startDate) return false;
        if (endDate && t.data > endDate) return false;
        if (
          selectedCantiere !== "all" &&
          String(t.cantiere_id) !== selectedCantiere
        )
          return false;
        if (selectedLavoro !== "all" && String(t.lavoro_id) !== selectedLavoro)
          return false;
        return true;
      }),
    [turni, startDate, endDate, selectedCantiere, selectedLavoro],
  );

  const gruppi = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (!t.data) return;
      if (!map[t.data]) map[t.data] = { data: t.data, records: [], totMin: 0 };
      map[t.data].records.push(t);
      map[t.data].totMin += calcMin(t.inizio, t.fine);
    });
    return Object.values(map).sort((a, b) => (a.data > b.data ? -1 : 1));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Storico Turni
        </h1>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "turno" : "turni"}
        </span>
      </div>

      {/* Filtri */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Header filtri */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{ color: "var(--text)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-subtle)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4"
              style={{ color: "var(--text-muted)" }}
            />
            <span className="text-sm font-medium">Filtri</span>
            {activeCount > 0 && (
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--primary)", color: "white" }}
              >
                {activeCount}
              </span>
            )}
          </div>
          {open ? (
            <ChevronUp
              className="h-4 w-4"
              style={{ color: "var(--text-faint)" }}
            />
          ) : (
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "var(--text-faint)" }}
            />
          )}
        </button>

        {/* Body filtri */}
        {open && (
          <div
            className="border-t px-4 pb-4 pt-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FilterInput
                label="Dal"
                value={startDate}
                onChange={setStartDate}
              />
              <FilterInput label="Al" value={endDate} onChange={setEndDate} />
              <FilterSelect
                label="Cantiere"
                value={selectedCantiere}
                onChange={setSelectedCantiere}
              >
                <option value="all">Tutti i cantieri</option>
                {(cantieri ?? []).map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.cantiere}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Tipo Lavoro"
                value={selectedLavoro}
                onChange={setSelectedLavoro}
              >
                <option value="all">Tutti i tipi</option>
                {(lavori ?? []).map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.lavoro}
                  </option>
                ))}
              </FilterSelect>
            </div>
            {hasFilters && (
              <button
                onClick={reset}
                className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{
                  color: "var(--text-muted)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--destructive)";
                  e.currentTarget.style.borderColor = "var(--destructive)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                Azzera filtri ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Risultati */}
      {gruppi.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <FileSearch
            className="h-10 w-10"
            style={{ color: "var(--text-faint)" }}
          />
          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
            Nessun turno trovato
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {hasFilters
              ? "Prova a modificare i filtri"
              : "Inserisci il tuo primo turno"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {gruppi.map(({ data, records, totMin }) => (
            <div key={data}>
              {/* Data header */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <span
                  className="text-xs font-semibold capitalize"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatHeader(data)}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border)" }}
                />
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  {fmtOre(totMin)}
                </span>
              </div>
              {/* Cards */}
              <div className="flex flex-col gap-2">
                {records.map((r) => (
                  <ShiftCard key={r.id} record={r} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog conferma eliminazione */}
      <ConfirmDialog
        record={confirmRecord}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmRecord(null)}
      />
    </div>
  );
}
