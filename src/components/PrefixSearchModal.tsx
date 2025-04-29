import { useState, useEffect, useRef } from 'react';
import { PREFIXES, PrefixType } from '../constants/prefixes';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PrefixSearchModalProps {
  currentPrefix: PrefixType;
  onClose: () => void;
  onPrefixSelect: (prefixId: string) => void;
  selectedPrefixIds?: string[];
  typeFilter?: PrefixType | null;
}

interface AvailablePrefix {
  id: string;
  value: string;
  type: string;
  count: number;
}

export function PrefixSearchModal({ 
  currentPrefix, 
  onClose, 
  onPrefixSelect,
  selectedPrefixIds = [],
  typeFilter = null
}: PrefixSearchModalProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [availablePrefixes, setAvailablePrefixes] = useState<AvailablePrefix[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find the symbol by matching the type
  const symbol = Object.entries(PREFIXES).find(
    ([_, def]) => def.description === currentPrefix
  )?.[0] || '';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch available prefixes when filters change
  useEffect(() => {
    const fetchPrefixes = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data: prefixes, error } = await supabase
          .rpc('get_available_prefixes', {
            current_user_id: user.id,
            prefix_type: typeFilter,
            prefix_values: selectedPrefixIds.length > 0 
              ? selectedPrefixIds.map(id => {
                  const prefix = availablePrefixes.find(p => p.id === id);
                  return prefix?.value || '';
                })
              : null
          });

        if (error) throw error;
        setAvailablePrefixes(prefixes || []);
      } catch (err) {
        console.error('Error fetching prefixes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrefixes();
  }, [user, typeFilter, selectedPrefixIds]);

  // Filter prefixes based on search term and current prefix type
  const filteredPrefixes = availablePrefixes
    .filter(prefix => {
      const searchTermLower = searchTerm.toLowerCase();
      // Only show prefixes of the type matching the entered symbol
      return prefix.type === PREFIXES[currentPrefix].description && 
             prefix.value.toLowerCase().includes(searchTermLower);
    })
    .sort((a, b) => a.value.localeCompare(b.value));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredPrefixes[highlightedIndex]) {
        onPrefixSelect(filteredPrefixes[highlightedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredPrefixes.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
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
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-4"
      >
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            Add {PREFIXES[currentPrefix].description}
          </h3>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              placeholder={`Search ${PREFIXES[currentPrefix].description}s...`}
              autoFocus
            />
          </div>
        </div>
        
        {/* Results dropdown */}
        {loading ? (
          <div className="text-center text-gray-400 py-4">Loading...</div>
        ) : filteredPrefixes.length > 0 ? (
          <div className="mb-4 max-h-48 overflow-y-auto">
            {filteredPrefixes.map((prefix, index) => (
              <button
                key={prefix.id}
                onClick={() => {
                  onPrefixSelect(prefix.id);
                  onClose();
                }}
                className={`w-full p-2 text-left text-gray-100 hover:bg-gray-800 rounded ${
                  index === highlightedIndex ? 'bg-gray-800' : ''
                }`}
              >
                {prefix.value}
              </button>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center text-gray-400 py-4">
            No {PREFIXES[currentPrefix].description}s found
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 