"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClockArrowUp, History, Home, Map } from "lucide-react";
import { useApp } from "@/components/app-context";

const baseLinks = [
  { href: "/principale", label: "Principale", icon: Home },
  { href: "/storico",   label: "Storico",    icon: History },
  { href: "/inserisci", label: "Inserisci",  icon: ClockArrowUp },
  { href: "/mappa",     label: "Mappa",      icon: Map           },
];

const responsabileLink = { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard };

export function BottomNav() {
  const pathname = usePathname();
  const { operaio } = useApp();
  const isResponsabile = operaio?.ruolo === "responsabile";

  const navLinks = isResponsabile
    ? [...baseLinks, responsabileLink]
    : baseLinks;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden border-t"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-stretch pt-3 pb-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ color: active ? "var(--primary)" : "var(--text-faint)" }}
            >
              <div
                className="w-10 h-7 rounded-full flex items-center justify-center transition-all"
                style={{ background: active ? "var(--primary-light)" : "transparent" }}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? "var(--primary)" : "var(--text-faint)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}