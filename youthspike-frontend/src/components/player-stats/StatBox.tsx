// Reusable Percentage Stat Box
function StatBox({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="w-full">
      <p className="uppercase bg-yellow-400 text-black text-center text-xs font-semibold py-1 rounded-t">{label}</p>
      <div className="flex justify-between items-center bg-gray-800 px-3 py-2 rounded-b text-sm">
        <span>{percent}%</span>
        <span>
          {value}/{total}
        </span>
      </div>
    </div>
  );
}



export default StatBox;