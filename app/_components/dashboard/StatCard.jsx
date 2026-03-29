function StatCard({ icon, label, value, accent }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "#1f2937" }}
    >
      <span className="text-xl">{icon}</span>
      <p className="text-2xl font-black" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

export default StatCard;
