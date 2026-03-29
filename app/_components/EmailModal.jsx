"use client";
import { useState } from "react";

import Row from "./Row";
import { getPieData, getStats } from "@/lib/stats";
import { fmtOre } from "@/lib/utils";
import { useApp } from "./AppContext";

function EmailModal() {
  const { showEmail, handleShowEmail, operaio, turni: registri } = useApp();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { minutiTotali, giorniSet } = getStats(registri);

  // Codice per cantiere ricavato dai turni normalizzati (campo codice)
  const codiceMap = {};
  registri.forEach((r) => { codiceMap[r.cantiere] = r.codice; });
  const cantieri = getPieData(registri).map((c) => ({
    ...c,
    codice: codiceMap[c.nome] ?? "",
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
      handleShowEmail();
    }, 2000);
  }

  if (!showEmail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleShowEmail}
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
            onClick={handleShowEmail}
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
            onClick={handleShowEmail}
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

export default EmailModal;
