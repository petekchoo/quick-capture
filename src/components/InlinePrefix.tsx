import { PrefixType } from '../types/database';
import { PREFIXES } from '../constants/prefixes';

interface InlinePrefixProps {
  type: PrefixType;
  value: string;
  onEdit: () => void;
}

export function InlinePrefix({ type, value, onEdit }: InlinePrefixProps) {
  const prefixInfo = PREFIXES[type === 'person' ? '@' : 
                          type === 'action' ? '!' : 
                          type === 'idea' ? '?' : '#'];

  return (
    <span
      onClick={onEdit}
      contentEditable={false}
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-sm font-mono cursor-pointer
        bg-${prefixInfo.type}-500/10 text-${prefixInfo.type}-500
        hover:bg-${prefixInfo.type}-500/20 transition-colors
        border border-${prefixInfo.type}-500/20`}
    >
      {prefixInfo.symbol}{value}
    </span>
  );
} 