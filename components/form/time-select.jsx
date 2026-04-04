// Select unico con tutti gli orari della giornata a step di 30 minuti.
// Produce un valore "HH:MM" — i minuti possono essere solo 00 o 30.
const _ORARI = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});
const ORARI = [..._ORARI.slice(12), ..._ORARI.slice(0, 12)];
// 06:00 → 23:30 → 00:00 → 05:30

function TimeSelect({ value, onChange, placeholder, minTime }) {
  const startIdx = minTime ? ORARI.indexOf(minTime) + 1 : 0;
  const orari = startIdx > 0 ? ORARI.slice(startIdx) : ORARI;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors cursor-pointer"
      style={{
        background: "var(--bg-subtle)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
    >
      <option value="" disabled>{placeholder}</option>
      {orari.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

export default TimeSelect;