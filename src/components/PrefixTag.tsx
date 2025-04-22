import { PREFIXES } from '../constants/prefixes';
import type { PrefixType } from '../types/entry';

interface PrefixTagProps {
  type: PrefixType;
  value: string;
  onRemove?: () => void;
}

export function PrefixTag({ type, value, onRemove }: PrefixTagProps) {
  const prefixDef = PREFIXES[type];
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded-full text-gray-300">
      <span className="text-gray-400">{prefixDef.symbol}</span>
      <span>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-gray-300"
        >
          ×
        </button>
      )}
    </span>
  );
} 