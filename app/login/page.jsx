"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OPERAI } from "@/lib/data";
import { findByPin, saveSession } from "@/lib/auth";

function PinDot({ filled }) {
  return (
    <div
      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
        filled
          ? "bg-green-400 border-green-400 scale-110"
          : "border-green-600"
      }`}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function handleKey(k) {
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      const found = findByPin(next);
      if (found) {
        setTimeout(() => {
          saveSession(found);
          router.push("/dashboard");
        }, 300);
      } else {
        setTimeout(() => {
          setShake(true);
          setError("PIN non riconosciuto");
          setPin("");
          setTimeout(() => setShake(false), 500);
        }, 200);
      }
    }
  }

  function loginDemo(operaio) {
    saveSession(operaio);
    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse at 60% 20%, #052e16 0%, #111827 60%, #030712 100%)",
      }}
    >
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🌿</div>
        <h1 className="text-white text-3xl font-black tracking-tight">
          GreenWork
        </h1>
        <p className="text-green-400 text-sm mt-1 tracking-widest uppercase font-medium">
          Gestione Ore Operai
        </p>
      </div>

      <div
        className={`bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl transition-transform ${
          shake ? "animate-bounce" : ""
        }`}
      >
        <p className="text-gray-400 text-center text-sm mb-6">
          Inserisci il tuo PIN a 4 cifre
        </p>

        {/* PIN display */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <PinDot key={i} filled={i < pin.length} />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mb-4">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(String(n))}
              className="h-14 rounded-2xl bg-gray-800 text-white text-xl font-bold hover:bg-green-800 active:scale-95 transition-all border border-gray-700"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => {
              setPin((p) => p.slice(0, -1));
              setError("");
            }}
            className="h-14 rounded-2xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700 active:scale-95 transition-all border border-gray-700"
          >
            ⌫
          </button>
          <button
            onClick={() => handleKey("0")}
            className="h-14 rounded-2xl bg-gray-800 text-white text-xl font-bold hover:bg-green-800 active:scale-95 transition-all border border-gray-700"
          >
            0
          </button>
          <button
            onClick={() => {
              setPin("");
              setError("");
            }}
            className="h-14 rounded-2xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700 active:scale-95 transition-all border border-gray-700"
          >
            C
          </button>
        </div>

        {/* Demo hints */}
        <div className="mt-6 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <p className="text-gray-500 text-xs text-center mb-2">PIN Demo</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {OPERAI.slice(0, 4).map((o) => (
              <button
                key={o.pin}
                onClick={() => loginDemo(o)}
                className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-lg hover:bg-green-800 transition-all"
              >
                {o.nome.split(" ")[0]} ({o.pin})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
