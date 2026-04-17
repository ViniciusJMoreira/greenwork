"use client";
import { useState, useRef } from "react";
import { MapPin } from "lucide-react";

const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

function parse(v) {
  const daMatch = v?.match(/^Da:\s*(.+?)(?:\s+A:\s*(.*))?$/i);
  return {
    da: daMatch?.[1]?.trim() ?? "",
    a:  daMatch?.[2]?.trim() ?? "",
  };
}

function build(da, a) {
  if (!da && !a) return "";
  if (!a) return `Da: ${da}`;
  return `Da: ${da} A: ${a}`;
}

function Dropdown({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <div
      className="absolute z-30 top-full left-0 right-0 mt-1 rounded-lg border shadow-xl overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {items.slice(0, 6).map((c) => (
        <button
          key={c.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(c.cantiere); }}
          className="w-full px-3 py-2 text-sm text-left transition-colors"
          style={{ color: "var(--text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {c.cantiere}
        </button>
      ))}
    </div>
  );
}

function KmPercorsoInput({ value, onChange, cantieri }) {
  const parsed = parse(value);
  const [da, setDa]       = useState(parsed.da);
  const [a, setA]         = useState(parsed.a);
  const [openDa, setOpenDa] = useState(false);
  const [openA, setOpenA]   = useState(false);
  const aRef = useRef(null);

  const filter = (q) =>
    q ? cantieri.filter((c) => c.cantiere.toLowerCase().includes(q.toLowerCase())) : cantieri;

  function handleDaChange(v) { setDa(v); setOpenDa(true); onChange(build(v, a)); }
  function selectDa(nome) { setDa(nome); setOpenDa(false); onChange(build(nome, a)); setTimeout(() => aRef.current?.focus(), 30); }
  function handleAChange(v) { setA(v); setOpenA(true); onChange(build(da, v)); }
  function selectA(nome) { setA(nome); setOpenA(false); onChange(build(da, nome)); }

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}
    >
      <div className="flex gap-3">
        {/* Icone percorso — cerchio, linea tratteggiata, pin */}
        <div className="flex flex-col items-center pt-2.5 shrink-0">
          {/* Cerchio partenza */}
          <div
            className="w-3 h-3 rounded-full border-2 shrink-0"
            style={{ borderColor: "var(--primary)", background: "var(--bg-card)" }}
          />
          {/* Linea tratteggiata */}
          <div className="flex flex-col gap-[3px] my-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-1 rounded-full mx-auto"
                style={{ background: "var(--text-faint)" }}
              />
            ))}
          </div>
          {/* Pin arrivo */}
          <MapPin className="h-4 w-4 shrink-0" style={{ color: "#dc2626" }} strokeWidth={2.2} />
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Da */}
          <div className="relative">
            <input
              type="text"
              value={da}
              placeholder="Partenza..."
              onChange={(e) => handleDaChange(e.target.value)}
              onFocus={() => setOpenDa(true)}
              onBlur={() => setTimeout(() => setOpenDa(false), 150)}
              className={inputCls}
              autoComplete="off"
            />
            {openDa && <Dropdown items={filter(da)} onSelect={selectDa} />}
          </div>

          {/* A */}
          <div className="relative">
            <input
              ref={aRef}
              type="text"
              value={a}
              placeholder="Arrivo..."
              onChange={(e) => handleAChange(e.target.value)}
              onFocus={() => setOpenA(true)}
              onBlur={() => setTimeout(() => setOpenA(false), 150)}
              className={inputCls}
              autoComplete="off"
            />
            {openA && <Dropdown items={filter(a)} onSelect={selectA} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KmPercorsoInput;
