import { PREFIXES, PrefixType } from '../constants/prefixes';

interface PrefixTypeFilterProps {
  selectedType: PrefixType | null;
  onTypeSelect: (type: PrefixType | null) => void;
}

export function PrefixTypeFilter({ selectedType, onTypeSelect }: PrefixTypeFilterProps) {
  return (
    <div className="flex gap-4 justify-center py-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="prefixType"
          checked={selectedType === null}
          onChange={() => onTypeSelect(null)}
          className="w-4 h-4 text-green-500 border-gray-300 rounded-full focus:ring-green-500"
        />
        <span className="text-sm font-medium text-gray-700">
          No filters
        </span>
      </label>
      {Object.entries(PREFIXES).map(([symbol, { description }]) => (
        <label key={symbol} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="prefixType"
            checked={selectedType === symbol}
            onChange={() => onTypeSelect(symbol as PrefixType)}
            className="w-4 h-4 text-green-500 border-gray-300 rounded-full focus:ring-green-500"
          />
          <span className="text-sm font-medium text-gray-700">
            All {description}s
          </span>
        </label>
      ))}
    </div>
  );
} 