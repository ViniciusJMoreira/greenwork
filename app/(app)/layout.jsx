import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth";
import { getCantieri, getLavori, getMacchinari, getTurniByDipendente } from "@/lib/actions";
import { AppProvider } from "@/components/app-context";
import { TopBar } from "@/components/top-bar"
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }) {
  // Auth guard — redirect al login se nessuna sessione
  const operaio = await readSessionCookie();
  if (!operaio) redirect("/login");

  // Fetch parallelo di tutti i dati necessari
  const [cantieri, lavori, macchinari, turni] = await Promise.all([
    getCantieri(),
    getLavori(),
    getMacchinari(),
    getTurniByDipendente(operaio.id),
  ]);

  return (
    <AppProvider
      operaio={operaio}
      cantieri={cantieri}
      lavori={lavori}
      macchinari={macchinari}
      turni={turni}
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