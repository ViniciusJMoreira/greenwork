import { calcMin, fmtOre, fmtData } from "@/lib/utils";
import { getStoricoGruppi } from "@/lib/stats";
import { useApp } from "@/app/_components/AppContext";
import { deleteTurno } from "@/lib/actions";

function Storico() {
  const { turni: registri, rimuoviTurno } = useApp();

  async function handleDelete(id) {
    const result = await deleteTurno(id);
    if (result.success) rimuoviTurno(id);
  }
  const gruppi = getStoricoGruppi(registri);

  if (gruppi.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-500">
        Nessun record trovato.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Storico Ore</h2>
      {gruppi.map(({ data, records, totMin }) => (
        <div key={data}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">
              {fmtData(data)}
            </h3>
            <span className="text-xs font-bold text-green-400 bg-green-950 px-2 py-0.5 rounded-full">
              {fmtOre(totMin)}
            </span>
          </div>
          <div className="space-y-2">
            {records.map((r) => (
              <div
                key={r.id}
                className="rounded-xl p-3 flex items-start justify-between gap-2"
                style={{ background: "#1f2937" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {r.cantiere}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                      {r.lavoro}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 font-mono">
                      {r.inizio} – {r.fine}
                    </span>
                    <span className="text-xs font-bold text-green-400">
                      {fmtOre(calcMin(r.inizio, r.fine))}
                    </span>
                  </div>
                  {r.note && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {r.note}
                    </p>
                  )}
                </div>
                {handleDelete && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-gray-600 hover:text-red-400 text-xs shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Storico;
