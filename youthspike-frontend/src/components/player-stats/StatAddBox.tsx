function StatAddBox({
  label,
  plus,
  minus,
}: {
  label: string;
  plus: number;
  minus: number;
}) {
  const total = plus + minus;
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="bg-yellow-logo text-black px-4 py-2">
        <p className="text-xs font-bold uppercase">{label}</p>
      </div>
      <div className="p-3 flex justify-between items-center">
        <span className="text-lg font-bold">
          {total === 0 ? "0" : total > 0 ? "+" : "-"}
          {total}
        </span>
        <span className="text-sm text-gray-400">
          {plus}/{minus}
        </span>
      </div>
    </div>
  );
}

export default StatAddBox;
