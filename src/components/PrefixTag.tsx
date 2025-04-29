import React from 'react';
import { TYPE_TO_SYMBOL } from '../constants/prefixes';
import { PrefixType } from '../types/database';

interface PrefixTagProps {
  id: string;
  type: PrefixType;
  value: string;
  onRemove?: () => void;
  inline?: boolean;
}

export function PrefixTag({ id, type, value, onRemove, inline = false }: PrefixTagProps) {
  const className = inline 
    ? 'inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded-full text-gray-300'
    : 'prefix-tag';

  return (
    <span className={className}>
      <span className={inline ? 'text-gray-400' : 'prefix-symbol'}>
        {TYPE_TO_SYMBOL[type]}
      </span>
      <span className={inline ? '' : 'prefix-value'}>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className={inline ? 'ml-1 text-gray-400 hover:text-gray-300' : 'prefix-remove'}
        >
          ×
        </button>
      )}
    </span>
  );
} 