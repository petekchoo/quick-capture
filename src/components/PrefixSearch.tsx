import { useState, useEffect } from 'react';
import { PREFIXES, PrefixType, SYMBOL_TO_TYPE } from '../constants/prefixes';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PrefixSearchProps {
  onPrefixSelect: (prefixId: string) => void;
  onPrefixRemove: (prefixId: string) => void;
  onPrefixSymbol: (symbol: string) => void;
  selectedPrefixIds?: string[];
  typeFilter?: PrefixType | null;
}

interface AvailablePrefix {
  id: string;
  value: string;
  type: string;
  count: number;
}

export function PrefixSearch({ 
  onPrefixSelect, 
  onPrefixRemove,
  onPrefixSymbol,
  selectedPrefixIds = [],
  typeFilter = null
}: PrefixSearchProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [availablePrefixes, setAvailablePrefixes] = useState<AvailablePrefix[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Check if the input starts with a prefix symbol
    const firstChar = value[0];
    if (firstChar in SYMBOL_TO_TYPE) {
      // Clear the search term and trigger the modal
      setSearchTerm('');
      onPrefixSymbol(firstChar);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        className="w-full p-2 bg-gray-900 text-gray-100 rounded border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        placeholder="Type a prefix symbol (@, !, ?, #) to search..."
      />
    </div>
  );
} 