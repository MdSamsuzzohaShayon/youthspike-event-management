// Reusable Single Value Box
function StatSingle({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full">
      <p className="uppercase bg-yellow-400 text-black text-center text-xs font-semibold py-1 rounded-t">{label}</p>
      <div className="text-center bg-gray-800 py-3 text-sm rounded-b">{value}</div>
    </div>
  );
}

export default StatSingle;
