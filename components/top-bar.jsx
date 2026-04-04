"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, ChevronDown, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/components/app-context";
import Image from "next/image";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/storico", label: "Storico" },
  { href: "/inserisci", label: "Inserisci Ore" },
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
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Riga principale: logo + user */}
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="grid place-items-center">
              <Image
                src={logoSrc}
                alt="COOP134"
                width={60}
                height={60}
                className="object-contain"
                priority
              />
            </div>
            {/* <span
              className="font-black text-base tracking-tight"
              style={{ color: "var(--text)" }}
            >
              COOP<span style={{ color: "var(--primary)" }}>134</span>
            </span> */}
            <span
              className="text-[10px] font-semibold tracking-widest uppercase border rounded px-1.5 py-0.5"
              style={{
                color: "var(--text-faint)",
                borderColor: "var(--border)",
              }}
            >
              Cooperativa
            </span>
          </Link>

          {/* Nav desktop — visibile solo da sm in su */}
          <nav className="hidden md:flex gap-0.5">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: active ? "var(--bg-subtle)" : "transparent",
                    color: active ? "var(--primary)" : "var(--text-muted)",
                    borderBottom: active
                      ? "2px solid var(--primary)"
                      : "2px solid transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-subtle)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "var(--primary)" }}
              >
                {iniziale}
              </div>
              <span className="hidden sm:inline">
                {operaio?.nome ?? "Operaio"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-11 w-52 rounded-xl border shadow-xl py-1 z-50"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                {/* Info operaio */}
                <div
                  className="px-3 py-2.5 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {operaio?.nome} {operaio?.cognome}
                  </p>
                  <p
                    className="text-xs mt-0.5 capitalize"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {operaio?.ruolo}
                  </p>
                </div>

                {/* Toggle tema */}
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-subtle)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4" /> Tema Chiaro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" /> Tema Scuro
                    </>
                  )}
                </button>

                <div
                  className="mx-2 my-1 h-px"
                  style={{ background: "var(--border)" }}
                />

                {/* Logout */}
                <button
                  onClick={() => {
                    router.push("/login");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                  style={{ color: "var(--destructive)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--primary-faint)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut className="h-4 w-4" />
                  Esci
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
