"use client";

import { useState } from "react";
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

import { CANTIERI, LAVORI } from "@/lib/data";
import { calcMin, fmtOre, fmtOreDecimale, fmtData, minToDecimal } from "@/lib/utils";
import { getStats, getOrePerGiorno, getPieData, getStoricoGruppi } from "@/lib/stats";
import { useSession, useRegistri } from "@/lib/hooks";

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

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "#1f2937" }}
    >
      <span className="text-xl">{icon}</span>
      <p className="text-2xl font-black" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// ─── Dashboard tab ───────────────────────────────────────────────────────────
function Dashboard({ registri }) {
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

// ─── TimeSelect ───────────────────────────────────────────────────────────────
// Select unico con tutti gli orari della giornata a step di 30 minuti.
// Produce un valore "HH:MM" — i minuti possono essere solo 00 o 30.
const ORARI = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function TimeSelect({ value, onChange, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-green-500"
      style={{ background: "#374151" }}
    >
      <option value="" disabled>{placeholder}</option>
      {ORARI.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}

// ─── FormInserimento tab ──────────────────────────────────────────────────────
function FormInserimento({ operaio, onSave }) {
  const [cantiere, setCantiere] = useState(CANTIERI[0].nome);
  const [lavoro, setLavoro] = useState(LAVORI[0]);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [inizio, setInizio] = useState("");
  const [fine, setFine] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [salvato, setSalvato] = useState(false);
  const [errore, setErrore] = useState("");

  // Cantiere selezionato (oggetto completo) e durata calcolata in minuti
  const cantiereObj = CANTIERI.find((c) => c.nome === cantiere);
  const minutiForm = calcMin(inizio, fine);

  // Limita il selettore data al mese corrente:
  // meseMin = primo giorno del mese (es. "2026-03-01")
  // meseMax = ultimo giorno del mese (es. "2026-03-31")
  const oggi = new Date();
  const meseMin = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, "0")}-01`;
  const meseMax = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Classi e stile comuni per tutti gli input/select del form
  const inputCls =
    "w-full rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-green-500";
  const inputStyle = { background: "#374151" };

  // Salva il record in localStorage (via onSave) e lo invia a Google Sheets via API
  async function handleSalva() {
    if (!inizio || !fine || minutiForm <= 0) return;
    setSaving(true);
    setErrore("");

    // Costruisce il record completo da salvare in localStorage
    const record = {
      id: crypto.randomUUID(),
      data,
      cantiere,
      codice: cantiereObj?.codice ?? "",
      lavoro,
      inizio,
      fine,
      note,
      operaio: operaio?.nome ?? "",
    };

    // Invia solo i campi necessari ad Apps Script tramite l'API Route
    try {
      const res = await fetch("/api/save-ore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: record.data,
          cantiere: record.cantiere,
          codice: record.codice,
          oreDecimali: minToDecimal(minutiForm),
          operaio: record.operaio,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setErrore(json.error ?? "Errore salvataggio su Sheets");
        setSaving(false);
        return;
      }
    } catch (err) {
      setErrore(err.message ?? "Errore di rete");
      setSaving(false);
      return;
    }

    // Salvataggio riuscito: aggiorna stato locale e resetta il form
    onSave(record);
    setInizio("");
    setFine("");
    setNote("");
    setData(new Date().toISOString().slice(0, 10));
    setCantiere(CANTIERI[0].nome);
    setLavoro(LAVORI[0]);
    setSaving(false);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 2500);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Inserisci Ore</h2>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Data</label>
        <input
          type="date"
          value={data}
          min={meseMin}
          max={meseMax}
          onChange={(e) => setData(e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Cantiere</label>
        <select
          value={cantiere}
          onChange={(e) => setCantiere(e.target.value)}
          className={inputCls}
          style={inputStyle}
        >
          {CANTIERI.map((c) => (
            <option key={c.nome} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
        {cantiereObj && (
          <p className="mt-1 text-xs text-gray-500 font-mono">
            {cantiereObj.codice}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Tipo Lavoro
        </label>
        <select
          value={lavoro}
          onChange={(e) => setLavoro(e.target.value)}
          className={inputCls}
          style={inputStyle}
        >
          {LAVORI.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Inizio</label>
          <TimeSelect value={inizio} onChange={setInizio} placeholder="Seleziona ora" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Fine</label>
          <TimeSelect value={fine} onChange={setFine} placeholder="Seleziona ora" />
        </div>
      </div>

      {minutiForm > 0 && (
        <div className="rounded-xl p-4 text-center border border-green-800 bg-green-950">
          <p className="text-xs text-green-400 mb-1">Ore calcolate</p>
          <p className="text-3xl font-black text-green-300">
            {fmtOre(minutiForm)}
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Note (opzionale)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Aggiungi note..."
          className={`${inputCls} resize-none`}
          style={inputStyle}
        />
      </div>

      <button
        onClick={handleSalva}
        disabled={!inizio || !fine || minutiForm <= 0 || saving}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40"
        style={{ background: "#16a34a" }}
      >
        {saving ? "Salvataggio..." : "💾 Salva Ore"}
      </button>

      {salvato && (
        <p className="text-center text-sm font-medium text-green-400">
          ✓ Salvato con successo!
        </p>
      )}
      {errore && (
        <p className="text-center text-sm font-medium text-red-400">
          ✗ {errore}
        </p>
      )}
    </div>
  );
}

// ─── Storico tab ─────────────────────────────────────────────────────────────
function Storico({ registri, onDelete }) {
  const gruppi = getStoricoGruppi(registri);

  if (gruppi.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-500">
        Nessun record trovato.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Storico Ore</h2>
      {gruppi.map(({ data, records, totMin }) => (
        <div key={data}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">
              {fmtData(data)}
            </h3>
            <span className="text-xs font-bold text-green-400 bg-green-950 px-2 py-0.5 rounded-full">
              {fmtOre(totMin)}
            </span>
          </div>
          <div className="space-y-2">
            {records.map((r) => (
              <div
                key={r.id}
                className="rounded-xl p-3 flex items-start justify-between gap-2"
                style={{ background: "#1f2937" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {r.cantiere}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                      {r.lavoro}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 font-mono">
                      {r.inizio} – {r.fine}
                    </span>
                    <span className="text-xs font-bold text-green-400">
                      {fmtOre(calcMin(r.inizio, r.fine))}
                    </span>
                  </div>
                  {r.note && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {r.note}
                    </p>
                  )}
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(r.id)}
                    className="text-gray-600 hover:text-red-400 text-xs shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EmailModal ───────────────────────────────────────────────────────────────
function EmailModal({ operaio, registri, onClose }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { minutiTotali, giorniSet } = getStats(registri);
  const cantieri = getPieData(registri).map((c) => ({
    ...c,
    codice: CANTIERI.find((x) => x.nome === c.nome)?.codice ?? "",
  }));

  async function handleInvia() {
    setSending(true);
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operaio: operaio?.nome, registri }),
      });
      setSent(true);
    } catch (_) {}
    setSending(false);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 z-10"
        style={{ background: "#111827" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            📧 Riepilogo via Email
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <Row label="Operaio" value={operaio?.nome} />
          <Row label="Destinatario" value="viniciusit.moreira@gmail.com" mono />
          <Row label="Ore Totali" value={fmtOre(minutiTotali)} accent />
          <Row label="Giorni lavorati" value={giorniSet.size} />
        </div>

        {cantieri.length > 0 && (
          <div
            className="rounded-xl p-3 mb-5 space-y-1.5"
            style={{ background: "#1f2937" }}
          >
            <p className="text-xs text-gray-500 mb-2">Dettaglio cantieri</p>
            {cantieri.map((c) => (
              <div key={c.nome} className="flex justify-between text-xs">
                <span className="text-gray-300 truncate">{c.nome}</span>
                <span className="ml-2 shrink-0 text-gray-500 font-mono">
                  {c.codice} · {c.ore} h
                </span>
              </div>
            ))}
          </div>
        )}

        {sent && (
          <p className="text-center text-sm font-medium text-green-400 mb-3">
            ✓ Email inviata con successo!
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm text-gray-400 font-medium transition-all"
            style={{ background: "#1f2937" }}
          >
            Annulla
          </button>
          <button
            onClick={handleInvia}
            disabled={sending || sent}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "#16a34a" }}
          >
            {sending ? "Invio..." : "Invia Riepilogo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium ${mono ? "font-mono text-xs text-gray-400" : ""} ${accent ? "text-green-400 font-bold" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "inserisci", label: "Inserisci", emoji: "➕" },
  { id: "storico", label: "Storico", emoji: "📋" },
];

export default function DashboardPage() {
  const { operaio, esci } = useSession();
  const { registri, aggiungi, rimuovi } = useRegistri();
  const [tab, setTab] = useState("dashboard");
  const [showEmail, setShowEmail] = useState(false);

  if (!operaio) return null;

  const nomeBreve = operaio.nome.split(" ")[0];

  return (
    <div className="min-h-screen" style={{ background: "#030712" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-gray-800"
        style={{ background: "#111827" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <div>
            <p className="text-xs text-gray-500 leading-none">Bentornato</p>
            <p className="text-sm font-bold text-white leading-tight truncate max-w-40">
              {nomeBreve}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmail(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            aria-label="Invia email"
          >
            📧
          </button>
          <button
            onClick={esci}
            className="px-3 py-2 rounded-xl text-xs text-gray-400 font-medium hover:text-white hover:bg-gray-800 transition-all"
          >
            Esci
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav
        className="sticky top-15 z-30 px-4 py-2 flex gap-2 border-b border-gray-800"
        style={{ background: "#111827" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={
              tab === t.id
                ? { background: "#16a34a", color: "#fff" }
                : { background: "#1f2937", color: "#9ca3af" }
            }
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="px-4 py-5 max-w-2xl mx-auto pb-10">
        {tab === "dashboard" && <Dashboard registri={registri} />}
        {tab === "inserisci" && (
          <FormInserimento operaio={operaio} onSave={aggiungi} />
        )}
        {tab === "storico" && (
          <Storico registri={registri} onDelete={rimuovi} />
        )}
      </main>

      {/* Email Modal */}
      {showEmail && (
        <EmailModal
          operaio={operaio}
          registri={registri}
          onClose={() => setShowEmail(false)}
        />
      )}
    </div>
  );
}
