// Sub-component: Detail Item
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-yellow-500/10 last:border-b-0">
    <span className="text-yellow-400 font-medium text-sm">{label}:</span>
    <span className="text-white font-semibold">{value}</span>
  </div>
);


export default DetailItem;
