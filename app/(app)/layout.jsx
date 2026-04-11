import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth";
import {
  getCantieri,
  getLavori,
  getMacchinari,
  getTurniByDipendente,
  getAllTurni,
  getDipendenti,
} from "@/lib/actions";
import { AppProvider } from "@/components/app-context";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }) {
  // Auth guard — redirect al login se nessuna sessione
  const operaio = await readSessionCookie();
  if (!operaio) redirect("/login");

  const isResponsabile = operaio.ruolo === "responsabile";

  // Fetch parallelo — dati base per tutti + dati extra solo per responsabile
  const [cantieri, lavori, macchinari, turni, tuttiTurni, dipendenti] =
    await Promise.all([
      getCantieri(),
      getLavori(),
      getMacchinari(),
      getTurniByDipendente(operaio.id),
      isResponsabile ? getAllTurni() : Promise.resolve([]),
      isResponsabile ? getDipendenti() : Promise.resolve([]),
    ]);

  return (
    <AppProvider
      operaio={operaio}
      cantieri={cantieri}
      lavori={lavori}
      macchinari={macchinari}
      turni={turni}
      tuttiTurni={tuttiTurni}
      dipendenti={dipendenti}
    >
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="container mx-auto px-4 py-6 max-w-5xl pb-24 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}