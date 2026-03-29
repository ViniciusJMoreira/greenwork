function Row({ label, value, mono, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium ${mono ? "font-mono text-xs text-gray-400" : ""} ${accent ? "text-green-400 font-bold" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
export default Row;
