"use client";
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({
  children,
  operaio,
  cantieri,
  lavori,
  macchinari,
  turni: turniIniziali,
  tuttiTurni: tuttiTurniIniziali = [],
  dipendenti: dipendentiIniziali = [],
}) {
  // Turni del dipendente loggato (mutabili lato client)
  const [turni, setTurni] = useState(turniIniziali ?? []);
  // Tutti i turni di tutti (solo responsabile — immutabili, si ricaricano)
  const [tuttiTurni] = useState(tuttiTurniIniziali);
  // Lista dipendenti (solo responsabile)
  const [dipendenti] = useState(dipendentiIniziali);

  // Aggiunge un turno dopo insert riuscito
  function aggiungiTurno(turno) {
    setTurni((prev) => [turno, ...prev]);
  }

  // Rimuove un turno dopo delete riuscito
  function rimuoviTurno(id) {
    setTurni((prev) => prev.filter((t) => t.id !== id));
  }

  // Aggiorna un turno dopo edit riuscito
  function aggiornaTurno(turnoAggiornato) {
    setTurni((prev) =>
      prev.map((t) => (t.id === turnoAggiornato.id ? turnoAggiornato : t)),
    );
  }

  return (
    <AppContext.Provider
      value={{
        operaio,
        cantieri,
        lavori,
        macchinari,
        turni,
        aggiungiTurno,
        rimuoviTurno,
        aggiornaTurno,
        tuttiTurni,
        dipendenti,
      }}
    >
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