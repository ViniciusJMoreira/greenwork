import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth";
import { getAllTurni, getDipendenti, getCantieri, getLavori, getMacchinari } from "@/lib/actions";
import DashboardShell from "@/components/dashboard/dashboard-shell";

// Server Component — fetch parallelo direttamente da Supabase, zero waterfall
export default async function DashboardPage() {
  const operaio = await readSessionCookie();
  if (!operaio || operaio.ruolo !== "responsabile") redirect("/principale");

  const [turni, dipendenti, cantieri, lavori, macchinari] = await Promise.all([
    getAllTurni(),
    getDipendenti(),
    getCantieri(),
    getLavori(),
    getMacchinari(),
  ]);

  return (
    <DashboardShell
      turni={turni}
      dipendenti={dipendenti}
      cantieri={cantieri}
      lavori={lavori}
      macchinari={macchinari}
    />
  );
}