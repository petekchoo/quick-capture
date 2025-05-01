import { useState, useEffect, useRef } from 'react';
import { PREFIXES, PrefixType } from '../constants/prefixes';
import { supabase } from '../services/supabase';

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!prefixInput) {
        setSuggestions([]);
        return;
      }

      const { data: suggestions } = await supabase
        .from('prefixes')
        .select('id, value, type')
        .eq('type', PREFIXES[currentPrefix].description)
        .ilike('value', `%${prefixInput}%`)
        .order('value')
        .limit(5);

      setSuggestions(suggestions || []);
    };

    fetchSuggestions();
  }, [prefixInput, currentPrefix]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        onPrefixSelect(suggestions[selectedIndex].id);
      } else if (prefixInput.trim()) {
        // Create a new prefix if one doesn't exist
        onPrefixSelect(prefixInput.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        ref={overlayRef}
        className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-4"
      >
        <div className="mb-3">
          <h3 className="text-base font-medium text-gray-100 mb-2">
            Add {PREFIXES[currentPrefix].description}
          </h3>
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-base"
              placeholder={`Search or create ${PREFIXES[currentPrefix].description}...`}
              autoFocus
            />
          </div>
        </div>
        
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="mb-3 max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => onPrefixSelect(suggestion.id)}
                className={`w-full p-3 text-left text-gray-100 hover:bg-gray-800 rounded ${
                  index === selectedIndex ? 'bg-gray-800' : ''
                }`}
              >
                {suggestion.value}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-300 hover:text-gray-100 text-base"
          >
            Cancel
          </button>
          {prefixInput && suggestions.length === 0 && (
            <button
              onClick={() => onPrefixSelect(prefixInput)}
              className="px-4 py-2.5 bg-green-500 text-white rounded hover:bg-green-600 text-base"
            >
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 