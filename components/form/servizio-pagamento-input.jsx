"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Trophy, X } from "lucide-react";
import { isCantiereServizioPagamento } from "@/lib/utils";

const SEP = " — ";
const MAX_SUGGERIMENTI = 5;

const inputCls =
  "w-full rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none border transition-colors bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

// Evidenzia in grassetto la parte del nome che corrisponde al testo scritto
function Evidenziato({ testo, query }) {
  const i = testo.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0 || !query) return testo;
  return (
    <>
      {testo.slice(0, i)}
      <strong style={{ color: "var(--primary)" }}>{testo.slice(i, i + query.length)}</strong>
      {testo.slice(i + query.length)}
    </>
  );
}

function ServizioPagamentoInput({ value, onChange, cantieri }) {
  const [focus, setFocus] = useState(false);
  const [attivo, setAttivo] = useState(0);
  const inputRef = useRef(null);

  const testo = value ?? "";
  // Suggerisce solo finché l'operaio sta scrivendo il campo (prima del separatore)
  const query = testo.includes(SEP.trim()) ? "" : testo.trim();
  const suggerimenti = query
    ? cantieri
        .filter((c) => !c.isAssenza && !isCantiereServizioPagamento(c.cantiere))
        .filter((c) => c.cantiere.toLowerCase().includes(query.toLowerCase()))
        .slice(0, MAX_SUGGERIMENTI)
    : [];
  const aperto = focus && suggerimenti.length > 0;

  function cambia(v) {
    setAttivo(0);
    onChange(v);
  }

  function seleziona(nome) {
    const nuovo = nome + SEP;
    onChange(nuovo);
    setAttivo(0);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nuovo.length, nuovo.length);
    }, 0);
  }

  function onKeyDown(e) {
    if (!aperto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAttivo((i) => (i + 1) % suggerimenti.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAttivo((i) => (i - 1 + suggerimenti.length) % suggerimenti.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      seleziona(suggerimenti[attivo]?.cantiere ?? suggerimenti[0].cantiere);
    } else if (e.key === "Escape") {
      setFocus(false);
    }
  }

  return (
    <div
      className="rounded-xl border px-4 py-3 flex flex-col gap-3"
      style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}
    >
      {/* Testata */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--primary-faint)" }}
        >
          <Trophy className="h-4 w-4" style={{ color: "var(--primary)" }} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
            Servizio a pagamento
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Campo sportivo e società da fatturare
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <MapPin
          className="h-4 w-4 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "#dc2626" }}
          strokeWidth={2.2}
        />
        <input
          ref={inputRef}
          type="text"
          value={testo}
          placeholder="es. Stadio Rugby — ASD Rimini Rugby"
          onChange={(e) => cambia(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onKeyDown={onKeyDown}
          className={inputCls}
          autoComplete="off"
        />
        <AnimatePresence>
          {testo && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileTap={{ scale: 0.85 }}
              transition={{ duration: 0.15 }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                cambia("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-subtle)", color: "var(--text-faint)" }}
              aria-label="Svuota"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggerimenti — nel flusso della card, così non vengono tagliati dal FadeField */}
      <AnimatePresence initial={false}>
        {aperto && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="rounded-lg border overflow-hidden"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              {suggerimenti.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    seleziona(c.cantiere);
                  }}
                  onMouseEnter={() => setAttivo(i)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                  style={{
                    color: "var(--text)",
                    background: i === attivo ? "var(--bg-subtle)" : "transparent",
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
                  <span className="truncate">
                    <Evidenziato testo={c.cantiere} query={query} />
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[11px] -mt-1" style={{ color: "var(--text-faint)" }}>
        Scegli un campo dalla lista o scrivilo, poi aggiungi la società sportiva
      </p>
    </div>
  );
}

export default ServizioPagamentoInput;
