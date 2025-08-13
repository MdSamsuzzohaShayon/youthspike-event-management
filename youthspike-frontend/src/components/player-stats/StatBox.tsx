// Reusable Percentage Stat Box
function StatBox({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="bg-yellow-logo text-black px-4 py-2">
        <p className="text-xs font-bold uppercase">{label}</p>
      </div>
      <div className="p-3 flex justify-between items-center">
        <span className="text-lg font-bold">{percent}%</span>
        <span className="text-sm text-gray-400">
          {value}/{total}
        </span>
      </div>
    </div>
  );
}

export default StatBox;
