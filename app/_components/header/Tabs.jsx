"use client";
import { useApp } from "../AppContext";

const TABS = [
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "inserisci", label: "Inserisci", emoji: "➕" },
  { id: "storico", label: "Storico", emoji: "📋" },
];

function Tabs() {
  const { tab, setTab } = useApp();
  return (
    <nav
      className="sticky top-15 z-30 px-4 py-2 flex gap-2 border-b border-gray-800"
      style={{ background: "#111827" }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            tab === t.id
              ? { background: "#16a34a", color: "#fff" }
              : { background: "#1f2937", color: "#9ca3af" }
          }
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </nav>
  );
}

export default Tabs;
