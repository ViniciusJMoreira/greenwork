"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimate } from "motion/react";
import { useTheme } from "@/components/theme-provider";
import { useRouter } from "next/navigation";
import { loginByPin } from "@/lib/actions";
import { Delete } from "lucide-react";
import Image from "next/image";

// Dot PIN — animazione spring quando si riempie
function PinDot({ filled }) {
  return (
    <motion.div
      animate={{
        scale: filled ? 1.25 : 1,
        background: filled ? "var(--primary)" : "transparent",
        borderColor: filled ? "var(--primary)" : "var(--border-strong)",
      }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="w-3 h-3 rounded-full border-2"
    />
  );
}

// Tasto tastierino — tap 3D + stagger entrance
function Key({ children, onClick, faint, index = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.6, rotateX: -25 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ type: "spring", damping: 16, stiffness: 280, delay: 0.25 + index * 0.035 }}
      whileTap={{ scale: 0.82, rotateX: 18, rotateY: -6 }}
      style={{ transformPerspective: 500 }}
      onClick={onClick}
      className="h-13 rounded-xl text-base font-semibold transition-colors select-none border"
      style={{
        background: "var(--bg-subtle)",
        borderColor: "var(--border)",
        color: faint ? "var(--text-muted)" : "var(--text)",
        transformPerspective: 500,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--primary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {children}
    </motion.button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Ref card per animazione shake con useAnimate
  const [cardRef, animateCard] = useAnimate();

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
        // Shake 3D con motion invece di CSS animation
        animateCard(
          cardRef.current,
          { x: [-10, 10, -8, 8, -5, 5, 0], rotateY: [-4, 4, -3, 3, 0] },
          { duration: 0.45, ease: "easeInOut" },
        );
        setError("PIN non riconosciuto");
        setPin("");
      }
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Logo — fade + scale dall'alto */}
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260, delay: 0.05 }}
        className="mb-8 text-center"
      >
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
      </motion.div>

      {/* Card — pop-in 3D */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.85, y: 32, rotateX: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280, delay: 0.12 }}
        style={{ transformPerspective: 900 }}
        className="w-full max-w-xs rounded-2xl border p-6 shadow-lg"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          transformPerspective: 900,
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

        {/* Errore — AnimatePresence */}
        <div className="h-6 flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="text-xs font-medium"
                style={{ color: "var(--destructive)" }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Tastiera — stagger 3D */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Key key={n} index={n - 1} onClick={() => handleKey(String(n))}>
              {n}
            </Key>
          ))}
          <Key
            faint
            index={9}
            onClick={() => {
              setPin((p) => p.slice(0, -1));
              setError("");
            }}
          >
            <Delete className="h-4 w-4 mx-auto" />
          </Key>
          <Key index={10} onClick={() => handleKey("0")}>0</Key>
          <Key
            faint
            index={11}
            onClick={() => {
              setPin("");
              setError("");
            }}
          >
            C
          </Key>
        </div>
      </motion.div>
    </div>
  );
}