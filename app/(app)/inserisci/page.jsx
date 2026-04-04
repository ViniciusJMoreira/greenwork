import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormInserimento from "@/app/_components/form/FormInserimento";

export default function InserisciPage() {
  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/storico"
          className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          onMouseEnter={undefined}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Inserisci Ore</h1>
      </div>

      {/* Card form */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Nuovo Turno</p>
        </div>
        <div className="px-5 py-5">
          <FormInserimento />
        </div>
      </div>

    </div>
  );
}