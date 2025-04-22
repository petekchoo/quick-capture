import { useState, useEffect, useRef } from 'react';
import { PrefixType, PREFIXES } from '../constants/prefixes';
import { supabase } from '../services/supabase';

interface PrefixSearchProps {
  onPrefixSelect: (prefixes: string[]) => void;
}

interface Prefix {
  id: string;
  type: PrefixType;
  value: string;
}

// Helper to get symbol from type
const getSymbolFromType = (type: PrefixType): string => {
  return type;
};

export function PrefixSearch({ onPrefixSelect }: PrefixSearchProps) {
  const [searchText, setSearchText] = useState('');
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [selectedPrefixes, setSelectedPrefixes] = useState<Prefix[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Extract prefix type and search value from input
  const getPrefixInfo = (text: string) => {
    if (text.length === 0) return null;
    
    const symbol = text[0];
    if (!PREFIXES[symbol]) return null;
    
    return {
      type: symbol as PrefixType,
      value: text.slice(1).trim()
    };
  };

  // Fetch prefixes from database
  const fetchPrefixes = async (type: PrefixType) => {
    setIsLoading(true);
    setError(null);
    setHighlightedIndex(-1);
    
    try {
      // Get the description for the prefix type
      const prefixDescription = PREFIXES[type]?.description;
      
      const { data, error } = await supabase
        .from('prefixes')
        .select('*')
        .eq('type', prefixDescription)
        .order('value', { ascending: true });

      if (error) throw error;
      
      setPrefixes(data || []);
    } catch (err) {
      setError('Failed to load prefixes');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    setHighlightedIndex(-1);
    
    const prefixInfo = getPrefixInfo(text);
    if (prefixInfo) {
      fetchPrefixes(prefixInfo.type);
    } else {
      setPrefixes([]);
    }
  };

  // Handle prefix selection
  const handlePrefixSelect = (prefix: Prefix) => {
    // Add to selected prefixes if not already selected
    if (!selectedPrefixes.some(p => p.id === prefix.id)) {
      const newSelectedPrefixes = [...selectedPrefixes, prefix];
      setSelectedPrefixes(newSelectedPrefixes);
      onPrefixSelect(newSelectedPrefixes.map(p => p.value));
    }
    setSearchText('');
    setPrefixes([]);
    setHighlightedIndex(-1);
  };

  // Handle removing a selected prefix
  const handleRemovePrefix = (prefixId: string) => {
    const newSelectedPrefixes = selectedPrefixes.filter(p => p.id !== prefixId);
    setSelectedPrefixes(newSelectedPrefixes);
    onPrefixSelect(newSelectedPrefixes.map(p => p.value));
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchText('');
      setPrefixes([]);
      setHighlightedIndex(-1);
      return;
    }

    if (!filteredPrefixes.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredPrefixes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredPrefixes.length) {
          handlePrefixSelect(filteredPrefixes[highlightedIndex]);
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && resultsRef.current) {
      const highlightedItem = resultsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Filter prefixes based on search text
  const filteredPrefixes = prefixes.filter(prefix => {
    const searchValue = searchText.slice(1).toLowerCase();
    return prefix.value.toLowerCase().includes(searchValue);
  });

  return (
    <div className="space-y-2">
      {/* Selected prefixes display */}
      {selectedPrefixes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPrefixes.map(prefix => (
            <div
              key={prefix.id}
              className="flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-full text-sm"
            >
              <span className="text-gray-300">{getSymbolFromType(prefix.type)}</span>
              <span className="text-gray-100">{prefix.value}</span>
              <button
                onClick={() => handleRemovePrefix(prefix.id)}
                className="ml-1 text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search prefixes (@person, !action, ?idea, #tag)"
          className="w-full p-3 text-base border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-black/50 backdrop-blur-sm text-gray-100 font-mono"
        />
        
        {searchText && filteredPrefixes.length > 0 && (
          <div 
            ref={resultsRef}
            className="absolute z-50 w-full mt-2 bg-gray-900 rounded-xl shadow-2xl border border-gray-800"
          >
            <div className="max-h-60 overflow-y-auto">
              {filteredPrefixes.map((prefix, index) => (
                <button
                  key={prefix.id}
                  onClick={() => handlePrefixSelect(prefix)}
                  className={`w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-800 focus:outline-none ${
                    index === highlightedIndex ? 'bg-gray-800' : ''
                  }`}
                >
                  {prefix.value}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-green-500" />
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 