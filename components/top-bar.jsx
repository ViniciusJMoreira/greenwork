"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, LogOut, ChevronDown, Home, History, ClockArrowUp, LayoutDashboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/components/app-context";
import Image from "next/image";

const baseNavLinks = [
  { href: "/principale", label: "Principale", icon: Home },
  { href: "/storico",    label: "Storico",    icon: History },
  { href: "/inserisci",  label: "Inserisci",  icon: ClockArrowUp },
];

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect
  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";
  const { operaio } = useApp();
  const isResponsabile = operaio?.ruolo === "responsabile";
  const navLinks = isResponsabile
    ? [...baseNavLinks, { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
    : baseNavLinks;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Chiude il menu cliccando fuori
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const iniziale = operaio?.nome?.[0]?.toUpperCase() ?? "O";

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Riga principale: logo + nav + user */}
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link href="/principale" className="flex items-center gap-2.5 shrink-0">
              <div className="grid place-items-center">
                <Image src={logoSrc} alt="COOP134" width={60} height={60} className="object-contain" priority />
              </div>
              <span
                className="text-[10px] font-semibold tracking-widest uppercase border rounded px-1.5 py-0.5"
                style={{ color: "var(--text-faint)", borderColor: "var(--border)" }}
              >
                Cooperativa
              </span>
            </Link>
          </motion.div>

          {/* Nav desktop — pill con indicatore scorrevole */}
          <nav
            className="hidden md:flex items-center gap-1 rounded-xl p-1"
            style={{ background: "var(--bg-subtle)" }}
          >
            {navLinks.map((link, i) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.05, duration: 0.2 }}
                  className="relative"
                >
                  {/* Pill attivo scorrevole */}
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "var(--bg-card)" }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Link
                    href={link.href}
                    className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors z-10"
                    style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 16 }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "var(--primary)" }}
              >
                {iniziale}
              </motion.div>
              <span className="hidden sm:inline">{operaio?.nome ?? "Operaio"}</span>
              <motion.div
                animate={{ rotate: menuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </motion.div>
            </motion.button>

            {/* Dropdown — AnimatePresence pop-in 3D */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -10, rotateX: -12 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -10, rotateX: -12 }}
                  transition={{ type: "spring", damping: 22, stiffness: 340 }}
                  style={{ transformPerspective: 600, transformOrigin: "top right" }}
                  className="absolute right-0 top-11 w-52 rounded-xl border shadow-xl py-1 z-50"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    transformPerspective: 600,
                    transformOrigin: "top right",
                  }}
                >
                  {/* Info operaio */}
                  <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {operaio?.nome} {operaio?.cognome}
                    </p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
                      {operaio?.ruolo}
                    </p>
                  </div>

                  {/* Toggle tema */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                    style={{ color: "var(--text)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <AnimatePresence mode="wait">
                      {theme === "dark" ? (
                        <motion.span
                          key="sun"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center gap-2.5"
                        >
                          <Sun className="h-4 w-4" /> Tema Chiaro
                        </motion.span>
                      ) : (
                        <motion.span
                          key="moon"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center gap-2.5"
                        >
                          <Moon className="h-4 w-4" /> Tema Scuro
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <div className="mx-2 my-1 h-px" style={{ background: "var(--border)" }} />

                  {/* Logout */}
                  <motion.button
                    whileTap={{ scale: 0.97, x: 4 }}
                    onClick={() => { router.push("/login"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                    style={{ color: "var(--destructive)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-faint)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut className="h-4 w-4" />
                    Esci
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}