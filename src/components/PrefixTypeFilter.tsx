import React from 'react';
import { PREFIXES, SYMBOL_TO_TYPE, PrefixType } from '../constants/prefixes';

interface PrefixTypeFilterProps {
  selectedType: PrefixType | null;
  onTypeChange?: (type: PrefixType | null) => void;
  disabled?: boolean;
}

export function PrefixTypeFilter({ selectedType, onTypeChange, disabled = false }: PrefixTypeFilterProps) {
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const type = value ? SYMBOL_TO_TYPE[value as keyof typeof SYMBOL_TO_TYPE] : null;
    onTypeChange?.(type);
  };

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm">
      <div className="flex items-center">
        <input
          type="radio"
          name="prefixType"
          value=""
          checked={selectedType === null}
          onChange={handleTypeChange}
          className="hidden"
          id="no-filter"
          disabled={disabled}
        />
        <label
          htmlFor="no-filter"
          className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors text-sm ${
            selectedType === null
              ? 'bg-gray-800 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          All
        </label>
      </div>
      {Object.entries(PREFIXES).map(([type, { symbol, description }]) => (
        <div key={type} className="flex items-center">
          <input
            type="radio"
            name="prefixType"
            value={symbol}
            checked={selectedType === SYMBOL_TO_TYPE[symbol as keyof typeof SYMBOL_TO_TYPE]}
            onChange={handleTypeChange}
            className="hidden"
            id={`filter-${type}`}
            disabled={disabled}
          />
          <label
            htmlFor={`filter-${type}`}
            className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors text-sm ${
              selectedType === SYMBOL_TO_TYPE[symbol as keyof typeof SYMBOL_TO_TYPE]
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-green-500">{symbol}</span>
            <span className="ml-0.5">{description}</span>
          </label>
        </div>
      ))}
    </div>
  );
} 