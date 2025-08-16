import { useState, ChangeEvent } from 'react';

type StatFieldKey =
  | 'servingPercentage'
  | 'acePercentage'
  | 'receivingPercentage'
  | 'hittingPercentage'
  | 'settingPercentage'
  | 'defensiveConversionPercentage';

interface StatField {
  name: StatFieldKey;
  label: string;
}

const statFields: StatField[] = [
  { name: 'servingPercentage', label: 'Serving %' },
  { name: 'acePercentage', label: 'Ace %' },
  { name: 'receivingPercentage', label: 'Receiving %' },
  { name: 'hittingPercentage', label: 'Hitting %' },
  { name: 'settingPercentage', label: 'Setting %' },
  { name: 'defensiveConversionPercentage', label: 'Defensive Conversion %' },
];

export type ProStats = Record<StatFieldKey, number>;

interface ProStatsInputProps {
  label: string;
  namePrefix: string;
  defaultValue?: Partial<ProStats>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function ProStatsInput({
  label,
  namePrefix,
  defaultValue = {},
  handleInputChange,
}: ProStatsInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 shadow-md">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left text-lg font-semibold text-gray-200 hover:text-yellow-400 transition-colors"
      >
        {label}
        <span className="text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {/* Stats grid */}
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {statFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="uppercase text-sm font-semibold text-gray-300">
                {field.label}
              </label>
              <input
                type="number"
                step="0.01"
                name={`${namePrefix}.${field.name}`}
                defaultValue={defaultValue[field.name] ?? 0}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full p-3 bg-gray-900 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
