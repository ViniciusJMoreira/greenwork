import Image from "next/image";

// Schermata di caricamento globale — logo + spinner centrati
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      {/* Logo COOP134 */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        <Image
          src="/coop2.png"
          alt="COOP134"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Spinner */}
      <svg
        className="animate-spin h-8 w-8 sm:h-10 sm:w-10"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ color: "var(--primary)" }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}
