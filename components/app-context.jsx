"use client";
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children, operaio, cantieri, lavori, macchinari, turni: turniIniziali }) {
  // Stato UI
  const [showEmail, setShowEmail] = useState(false);
  const [tab, setTab] = useState("inserisci");

  // Turni mutabili lato client (aggiunta/rimozione senza reload)
  const [turni, setTurni] = useState(turniIniziali ?? []);

  const handleShowEmail = () => setShowEmail((v) => !v);

  // Aggiunge un turno dopo insert riuscito
  function aggiungiTurno(turno) {
    setTurni((prev) => [turno, ...prev]);
  }

  // Rimuove un turno dopo delete riuscito
  function rimuoviTurno(id) {
    setTurni((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <AppContext.Provider value={{
      // UI
      showEmail, handleShowEmail,
      tab, setTab,
      // Dati sessione
      operaio,
      // Dati statici
      cantieri,
      lavori,
      macchinari,
      // Turni
      turni, aggiungiTurno, rimuoviTurno,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}