"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { loginByPin } from "@/lib/actions";
import { Delete } from "lucide-react";
import Image from "next/image";

function PinDot({ filled }) {
  return (
    <div
      className="w-3 h-3 rounded-full border-2 transition-all duration-200"
      style={{
        background: filled ? "var(--primary)" : "transparent",
        borderColor: filled ? "var(--primary)" : "var(--border-strong)",
        transform: filled ? "scale(1.15)" : "scale(1)",
      }}
    />
  );
}

function Key({ children, onClick, faint }) {
  return (
    <button
      onClick={onClick}
      className="h-13 rounded-xl text-base font-semibold transition-all active:scale-95 select-none border"
      style={{
        background: "var(--bg-subtle)",
        borderColor: "var(--border)",
        color: faint ? "var(--text-muted)" : "var(--text)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--primary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect
  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";

  async function handleKey(k) {
    if (pin.length >= 4 || loading) return;
    const next = pin + k;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setLoading(true);
      const result = await loginByPin(next);
      setLoading(false);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setShake(true);
        setError("PIN non riconosciuto");
        setPin("");
        setTimeout(() => setShake(false), 500);
      }
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="grid place-items-center">
          <Image
            src={logoSrc}
            alt="COOP134"
            width={130}
            height={130}
            className="object-contain"
            priority
          />
        </div>
        <p
          className="text-[10px] font-semibold tracking-[0.5em] leading-none mt-3"
          style={{ color: "var(--text-muted)" }}
        >
          GESTIONE TURNI
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-xs rounded-2xl border p-6 shadow-lg"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      >
        <p
          className="text-sm text-center mb-5"
          style={{ color: "var(--text-muted)" }}
        >
          Inserisci il tuo PIN
        </p>

        {/* Dots */}
        <div className="flex justify-center gap-4 mb-2">
          {[0, 1, 2, 3].map((i) => (
            <PinDot key={i} filled={i < pin.length} />
          ))}
        </div>

        {/* Errore */}
        <div className="h-6 flex items-center justify-center mb-4">
          {error && (
            <p
              className="text-xs font-medium"
              style={{ color: "var(--destructive)" }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Tastiera */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Key key={n} onClick={() => handleKey(String(n))}>
              {n}
            </Key>
          ))}
          <Key
            faint
            onClick={() => {
              setPin((p) => p.slice(0, -1));
              setError("");
            }}
          >
            <Delete className="h-4 w-4 mx-auto" />
          </Key>
          <Key onClick={() => handleKey("0")}>0</Key>
          <Key
            faint
            onClick={() => {
              setPin("");
              setError("");
            }}
          >
            C
          </Key>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-7px)}
          40%{transform:translateX(7px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
      `}</style>
    </div>
  );
}
