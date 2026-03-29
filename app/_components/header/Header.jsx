"use client";
import { useApp } from "../AppContext";
import { logout } from "@/lib/actions";

function Header() {
  const { operaio, handleShowEmail } = useApp();
  const esci = () => logout();

  const nomeBreve = operaio?.nome.split(" ")[0];

  return (
    <header
      className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-gray-800"
      style={{ background: "#111827" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">🌿</span>
        <div>
          <p className="text-xs text-gray-500 leading-none">Bentornato</p>
          <p className="text-sm font-bold text-white leading-tight truncate max-w-40">
            {nomeBreve}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleShowEmail}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          aria-label="Invia email"
        >
          📧
        </button>
        <button
          onClick={esci}
          className="px-3 py-2 rounded-xl text-xs text-gray-400 font-medium hover:text-white hover:bg-gray-800 transition-all"
        >
          Esci
        </button>
      </div>
    </header>
  );
}

export default Header;
