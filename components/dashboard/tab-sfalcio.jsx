"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, ChevronDown, Tractor } from "lucide-react";

const MESI_IT = [
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
const MESI_FULL = [
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

function fmtMese(ym) {
  const [y, m] = ym.split("-");
  return `${MESI_IT[parseInt(m) - 1]} ${y}`;
}
function fmtMeseFull(ym) {
  const [y, m] = ym.split("-");
  return `${MESI_FULL[parseInt(m) - 1]} ${y}`;
}
function fmtDataShort(dataStr) {
  if (!dataStr) return "—";
  const [, m, d] = dataStr.split("-");
  return `${d}/${m}`;
}

const CAMPI_SFALCIO = [
  "Rivazzurra",
  "San Giuliano",
  "Viserba",
  "Torre Pedrera",
  "Miramare Naturale",
  "Spadarolo",
  "Miramare Sintetico",
  "Ina Casa",
  "Viserbella",
  "San Vito",
  "Rivabella",
  "Corpolò",
  "Stadio",
];

const SFALCIO_LAVORI = new Set([
  "Sfalcio CP",
  "Sfalcio AE",
  "Sfalcio CS",
  "Sfalcio CP + Rullo",
  "Sfalcio CS + Rullo",
  "Sabbia",
  "Rullatura",
  "Altre Manutenzioni",
  "Rigatura Extra",
  "Rigatura",
]);

const CS_LAVORI = new Set(["Sfalcio CS", "Sfalcio CS + Rullo"]);
const AE_LAVORI = new Set(["Sfalcio AE"]);

function getSezione(lavoro) {
  if (CS_LAVORI.has(lavoro)) return "CS";
  if (AE_LAVORI.has(lavoro)) return "AE";
  return "CP";
}

function getColonne(lavoro) {
  const l = lavoro || "";
  return {
    sfalcio: l.startsWith("Sfalcio"),
    rulloSabbia: l === "Rullatura" || l === "Sabbia" || l.includes("Rullo"),
    rigatura: l === "Rigatura" || l === "Rigatura Extra",
    manutenzioni: l === "Altre Manutenzioni",
  };
}

function Spunta() {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full"
      style={{ background: "var(--primary-faint)" }}
    >
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
        <path
          d="M1 4L4 7.5L10 1"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const SEZIONI = [
  {
    id: "CP",
    label: "Campo Principale",
    color: "var(--primary)",
    bg: "var(--primary)",
  },
  { id: "CS", label: "Campo Secondario", color: "#1d4ed8", bg: "#1d4ed8" },
  { id: "AE", label: "Aree Esterne", color: "#16a34a", bg: "#16a34a" },
];

function TabellaSezione({ sezione, turni }) {
  return (
    <div className="overflow-hidden">
      {/* Header sezione — replica barra colorata del modulo */}
      <div
        className="flex items-center justify-center py-2"
        style={{ background: sezione.bg }}
      >
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">
          {sezione.label}
        </span>
      </div>

      {/* Tabella */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontSize: 11 }}>
          <thead>
            <tr
              style={{
                background: "var(--bg-subtle)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th
                className="px-2 py-2 text-left font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 42 }}
              >
                Data
              </th>
              <th
                className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 44 }}
              >
                Ore
              </th>
              <th
                className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 52 }}
              >
                Sfalcio
              </th>
              <th
                className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 80 }}
              >
                Rullo / Sabbia
              </th>
              <th
                className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 60 }}
              >
                Rigatura
              </th>
              <th
                className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 84 }}
              >
                Manutenzioni
              </th>
              <th
                className="px-2 py-2 text-center font-semibold whitespace-nowrap"
                style={{ color: "var(--text-muted)", minWidth: 56 }}
              >
                Finito
              </th>
            </tr>
          </thead>
          <tbody>
            {turni.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-3 text-center"
                  style={{ color: "var(--text-faint)" }}
                >
                  —
                </td>
              </tr>
            ) : (
              turni
                .slice()
                .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
                .map((t, i) => {
                  const cols = getColonne(t.lavoro);
                  return (
                    <tr
                      key={t.id}
                      style={{
                        background:
                          i % 2 !== 0 ? "var(--bg-subtle)" : "transparent",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <td
                        className="px-2 py-2 font-mono tabular-nums font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {fmtDataShort(t.data)}
                      </td>
                      <td
                        className="px-2 py-2 text-center font-bold"
                        style={{ color: sezione.color }}
                      >
                        {t.ore_mezzo != null ? (
                          `${t.ore_mezzo}h`
                        ) : t.ore_totali != null ? (
                          `${t.ore_totali}h`
                        ) : (
                          <span style={{ color: "var(--text-faint)" }}>—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {cols.sfalcio ? <Spunta /> : null}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {cols.rulloSabbia ? <Spunta /> : null}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {cols.rigatura ? <Spunta /> : null}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {cols.manutenzioni ? <Spunta /> : null}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {t.lavoro_finito === true && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(34,197,94,0.15)",
                              color: "#22c55e",
                            }}
                          >
                            SI
                          </span>
                        )}
                        {t.lavoro_finito === false && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(239,68,68,0.12)",
                              color: "#ef4444",
                            }}
                          >
                            NO
                          </span>
                        )}
                        {t.lavoro_finito === null && (
                          <span style={{ color: "var(--text-faint)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampoCard({ campo, turni, index, mese }) {
  const [expanded, setExpanded] = useState(false);

  const cpTurni = turni.filter((t) => getSezione(t.lavoro) === "CP");
  const csTurni = turni.filter((t) => getSezione(t.lavoro) === "CS");
  const aeTurni = turni.filter((t) => getSezione(t.lavoro) === "AE");

  const totOre = turni.reduce((a, t) => a + (t.ore_mezzo || 0), 0);
  const conStato = turni.filter((t) => t.lavoro_finito !== null);
  const tuttiFiniti =
    conStato.length > 0 && conStato.every((t) => t.lavoro_finito === true);
  const inCorso = conStato.length > 0 && !tuttiFiniti;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.035 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Striscia top */}
      <div
        className="h-0.5"
        style={{
          background: turni.length > 0 ? "var(--primary)" : "var(--border)",
        }}
      />

      {/* Header collassabile */}
      <motion.button
        whileTap={{ scale: 0.995 }}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-subtle)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
            {campo}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {turni.length === 0
              ? "Nessun intervento"
              : `${turni.length} ${turni.length === 1 ? "intervento" : "interventi"}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totOre > 0 && (
            <span
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: "var(--primary)" }}
            >
              <Tractor className="h-3.5 w-3.5" />
              {totOre % 1 === 0 ? totOre : totOre.toFixed(1)}h
            </span>
          )}
          {tuttiFiniti && (
            <span
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
            >
              <CheckCircle2 className="h-3 w-3" /> Finito
            </span>
          )}
          {inCorso && (
            <span
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
            >
              <Clock className="h-3 w-3" /> In corso
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "var(--text-faint)" }}
            />
          </motion.div>
        </div>
      </motion.button>

      {/* Corpo espandibile */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            {/* Intestazione modulo */}
            <div
              className="border-t px-4 py-2 flex items-center justify-between"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-subtle)",
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-faint)" }}
              >
                Mese:{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  {fmtMeseFull(mese)}
                </span>
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-faint)" }}
              >
                Impianto:{" "}
                <span style={{ color: "var(--text-muted)" }}>{campo}</span>
              </span>
            </div>

            {/* Tre sezioni tabella */}
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {SEZIONI.map((s) => (
                <TabellaSezione
                  key={s.id}
                  sezione={s}
                  turni={
                    s.id === "CP" ? cpTurni : s.id === "CS" ? csTurni : aeTurni
                  }
                />
              ))}
            </div>

            {/* Footer firma */}
            <div
              className="px-4 py-2 border-t flex items-center justify-between"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-subtle)",
              }}
            >
              <span
                className="text-[10px]"
                style={{ color: "var(--text-faint)" }}
              >
                Firma responsabile: ___________________________
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TabSfalcio({ turni: tuttiTurni }) {
  const [selectedMese, setSelectedMese] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ymSet = new Set(
    tuttiTurni.map((t) => t.data?.slice(0, 7)).filter(Boolean),
  );
  ymSet.add(currentYM);
  const mesiOptions = Array.from(ymSet).sort().reverse();

  const turniMese = tuttiTurni.filter(
    (t) =>
      t.data?.startsWith(selectedMese) &&
      CAMPI_SFALCIO.includes(t.cantiere) &&
      SFALCIO_LAVORI.has(t.lavoro),
  );

  const campiMap = {};
  CAMPI_SFALCIO.forEach((c) => {
    campiMap[c] = [];
  });
  turniMese.forEach((t) => {
    if (campiMap[t.cantiere]) campiMap[t.cantiere].push(t);
  });

  const totInterventi = turniMese.length;
  const campiAttivi = CAMPI_SFALCIO.filter(
    (c) => campiMap[c].length > 0,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            Schede Sfalcio
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {campiAttivi} {campiAttivi === 1 ? "campo" : "campi"} ·{" "}
            {totInterventi} {totInterventi === 1 ? "intervento" : "interventi"}{" "}
            · {fmtMese(selectedMese)}
          </p>
        </div>
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
          <ChevronDown className="h-4 w-4 pointer-events-none absolute right-2.5" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {CAMPI_SFALCIO.map((campo, i) => (
          <CampoCard
            key={campo}
            campo={campo}
            turni={campiMap[campo]}
            index={i}
            mese={selectedMese}
          />
        ))}
      </div>
    </div>
  );
}
