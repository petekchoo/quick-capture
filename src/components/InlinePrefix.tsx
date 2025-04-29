import { PrefixType, PREFIXES } from '../constants/prefixes';

interface InlinePrefixProps {
  type: PrefixType;
  value: string;
  onEdit: () => void;
}

export function InlinePrefix({ type, value, onEdit }: InlinePrefixProps) {
  // Find the prefix key by matching the description
  const prefixKey = Object.entries(PREFIXES).find(
    ([_, def]) => def.description === type
  )?.[0] as PrefixType | undefined;

  const prefixInfo = prefixKey ? PREFIXES[prefixKey] : null;

  if (!prefixInfo) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800 text-sm cursor-pointer hover:bg-gray-700"
      onClick={onEdit}
    >
      <span className="text-green-500">{prefixInfo.symbol}</span>
      {value}
    </span>
  );
} 