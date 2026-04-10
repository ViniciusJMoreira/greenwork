"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ theme: "dark", setTheme: () => {}, resolvedTheme: "dark" });

// Legge il tema salvato in localStorage (safe per SSR — ritorna "dark" di default)
function readStored() {
  try { return localStorage.getItem("theme") || "dark"; } catch { return "dark"; }
}

export function ThemeProvider({ children, defaultTheme = "dark" }) {
  // Inizia sempre con defaultTheme per evitare hydration mismatch
  const [theme, setThemeState] = useState(defaultTheme);

  // Dopo il mount: applica il tema salvato
  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    const stored = readStored();
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  function setTheme(next) {
    setThemeState(next);
    try { localStorage.setItem("theme", next); } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// Drop-in replacement per useTheme() di next-themes
export function useTheme() {
  return useContext(ThemeCtx);
}