import { useState, useEffect, useRef } from 'react';
import { PREFIXES, PrefixType } from '../constants/prefixes';
import { supabase } from '../services/supabase';
import type { PrefixType as EntryPrefixType } from '../types/entry';

interface PrefixOverlayProps {
  currentPrefix: PrefixType;
  onClose: () => void;
  onPrefixSelect: (prefix: string) => void;
}

export function PrefixOverlay({ currentPrefix, onClose, onPrefixSelect }: PrefixOverlayProps) {
  const [prefixInput, setPrefixInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; value: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find the symbol by matching the type
  const symbol = Object.entries(PREFIXES).find(
    ([_, def]) => def.type === currentPrefix
  )?.[0] || '';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onPrefixSelect(e.currentTarget.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        ref={overlayRef}
        className="relative bg-gray-900 rounded-xl p-6 shadow-2xl w-96"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-lg">{symbol}</span>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-b border-gray-600 text-gray-100 focus:outline-none focus:border-green-500 text-lg"
              onKeyDown={handleKeyDown}
              placeholder="Enter prefix value..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => onPrefixSelect(inputRef.current?.value || '')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 