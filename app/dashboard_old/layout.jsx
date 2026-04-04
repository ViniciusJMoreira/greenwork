import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth";
import {
  getCantieri,
  getLavori,
  getMacchinari,
  getTurniByDipendente,
} from "@/lib/actions";
import { AppProvider } from "@/app/_components/AppContext";

export default async function DashboardLayout({ children }) {
  // Legge la sessione dal cookie — se assente redirect al login
  const operaio = await readSessionCookie();
  if (!operaio) redirect("/login");

  // Fetch parallelo di tutti i dati necessari alle 3 tab
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
      {children}
    </AppProvider>
  );
}
