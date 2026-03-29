"use client";
import { useApp } from "./AppContext";

import Dashboard from "./dashboard/Dashboard";
import FormInserimento from "./form/FormInserimento";
import Storico from "./storico/Storico";

function TabContent() {
  const { tab } = useApp();

  return (
    <section className="px-4 py-5 max-w-2xl mx-auto pb-10">
      {tab === "dashboard" && <Dashboard />}
      {tab === "inserisci" && <FormInserimento />}
      {tab === "storico" && <Storico />}
    </section>
  );
}

export default TabContent;
