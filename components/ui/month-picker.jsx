"use client";
import { useRef, useEffect } from "react";
import { motion } from "motion/react";

const MESI_IT = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];

function fmtMese(ym) {
  const [y, m] = ym.split("-");
  return `${MESI_IT[parseInt(m) - 1]} ${y}`;
}

export function MonthPicker({ turni = [], value, onChange }) {
  const ref = useRef(null);

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ymSet = new Set(turni.map((t) => t.data?.slice(0, 7)).filter(Boolean));
  ymSet.add(currentYM);
  const mesi = Array.from(ymSet).sort().reverse();

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current.querySelector("[data-active='true']");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [value]);

  return (
    <div
      ref={ref}
      className="flex gap-2 overflow-x-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 2 }}
    >
      {mesi.map((ym) => {
        const active = value === ym;
        return (
          <motion.button
            key={ym}
            data-active={active ? "true" : "false"}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(ym)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all"
            style={{
              background: active ? "var(--primary)" : "var(--bg-card)",
              color: active ? "white" : "var(--text-muted)",
              borderColor: active ? "var(--primary)" : "var(--border)",
            }}
          >
            {fmtMese(ym)}
          </motion.button>
        );
      })}
    </div>
  );
}