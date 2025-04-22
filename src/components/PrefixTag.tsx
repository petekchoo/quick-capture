import { useState } from 'react';
import { PrefixType } from '../types/database';
import { PREFIXES } from '../constants/prefixes';

interface PrefixTagProps {
  type: PrefixType;
  value: string;
  onEdit: () => void;
}

export function PrefixTag({ type, value, onEdit }: PrefixTagProps) {
  const prefixInfo = PREFIXES[type === 'person' ? '@' : 
                          type === 'action' ? '!' : 
                          type === 'idea' ? '?' : '#'];

  return (
    <span
      onClick={onEdit}
      className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-mono cursor-pointer
        bg-${prefixInfo.type}-500/10 text-${prefixInfo.type}-500
        hover:bg-${prefixInfo.type}-500/20 transition-colors`}
    >
      {prefixInfo.symbol}{value}
    </span>
  );
} 