import { useState } from 'react';
import { PREFIXES, PrefixType } from '../constants/prefixes';

interface PrefixSearchProps {
  availablePrefixes: { id: string; value: string; type: string }[];
  selectedPrefixIds: string[];
  onPrefixSelect: (prefixId: string) => void;
  onPrefixRemove: (prefixId: string) => void;
  currentSymbol?: string | null;
}

export function PrefixSearch({ 
  availablePrefixes, 
  selectedPrefixIds, 
  onPrefixSelect, 
  onPrefixRemove,
  currentSymbol 
}: PrefixSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Detect if search term starts with a prefix symbol
  const getSymbolFromSearch = (term: string): PrefixType | null => {
    const firstChar = term[0];
    return Object.keys(PREFIXES).includes(firstChar) ? firstChar as PrefixType : null;
  };

  // Filter prefixes based on search term and current symbol
  const filteredPrefixes = availablePrefixes.filter(prefix => {
    const symbolFromSearch = getSymbolFromSearch(searchTerm);
    const prefixType = PREFIXES[prefix.type as PrefixType];
    
    // If search term starts with a symbol, filter by both type and the rest of the search term
    if (symbolFromSearch) {
      // Get the type description for the entered symbol
      const symbolTypeDescription = PREFIXES[symbolFromSearch]?.description;
      // Get the search term without the symbol
      const searchTermWithoutSymbol = searchTerm.slice(1).toLowerCase();
      // Compare with the prefix's type and filter by the search term
      return prefix.type === symbolTypeDescription && 
             prefix.value.toLowerCase().includes(searchTermWithoutSymbol);
    }
    
    // Otherwise, just filter by text within available prefixes
    return prefix.value.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => a.value.localeCompare(b.value));

  // Get the current filter description for the placeholder
  const getPlaceholderText = () => {
    if (currentSymbol) {
      return `Search ${PREFIXES[currentSymbol as PrefixType].description}s...`;
    }
    return "Search prefixes or type @, !, ?, # to filter by type...";
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredPrefixes.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selectedPrefix = filteredPrefixes[highlightedIndex];
      onPrefixSelect(selectedPrefix.id);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative">
      {/* Selected Prefix Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedPrefixIds.map(prefixId => {
          const prefix = availablePrefixes.find(p => p.id === prefixId);
          if (!prefix) return null;
          return (
            <div
              key={prefixId}
              className="flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-full text-sm"
            >
              <span className="text-green-500">
                {PREFIXES[prefix.type as PrefixType]?.symbol}
              </span>
              <span>{prefix.value}</span>
              <button
                onClick={() => onPrefixRemove(prefixId)}
                className="ml-1 text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholderText()}
        className="w-full p-2 text-gray-100 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-sm font-mono"
      />

      {/* Results Dropdown */}
      {filteredPrefixes.length > 0 && searchTerm && (
        <div
          className="absolute z-10 w-full mt-2 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 max-h-60 overflow-y-auto"
        >
          {filteredPrefixes.map((prefix, index) => (
            <div
              key={prefix.id}
              className={`px-4 py-2 text-gray-100 hover:bg-gray-800 focus:outline-none cursor-pointer ${
                index === highlightedIndex ? 'bg-gray-800' : ''
              }`}
              onClick={() => {
                onPrefixSelect(prefix.id);
                setSearchTerm('');
                setHighlightedIndex(-1);
              }}
            >
              <span className="text-green-500 mr-2">
                {PREFIXES[prefix.type as PrefixType]?.symbol}
              </span>
              <span>{prefix.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 