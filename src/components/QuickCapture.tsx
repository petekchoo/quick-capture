import { useState, useRef, useEffect } from 'react';
import { EntryService } from '../services/entryService';
import { parseEntry } from '../utils/entryParser';
import { PREFIXES, SYMBOL_TO_TYPE, PrefixType } from '../constants/prefixes';
import './QuickCapture.css';
import { FilteredEntries } from './FilteredEntries';
import { PrefixTypeFilter } from './PrefixTypeFilter';
import { PrefixOverlay } from './PrefixOverlay';
import { PrefixSearch } from './PrefixSearch';
//import { Prefix } from '../types/database';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PrefixSearchModal } from './PrefixSearchModal';
import { ErrorBoundary } from './ErrorBoundary';

interface QuickCaptureState {
  content: string;
  selectedPrefixType: PrefixType | null;
  currentPrefix: PrefixType | null;
  isPrefixOverlayOpen: boolean;
  prefixSuggestions: { value: string; id: string }[];
  prefixInput: string;
  selectedPrefixes: PrefixType[];
  typeFilter: PrefixType | null;
  showPrefixModal: boolean;
}

export function QuickCapture() {
  const { user } = useAuth();
  const [entryState, setEntryState] = useState<QuickCaptureState>({
    content: '',
    selectedPrefixType: null,
    currentPrefix: null,
    isPrefixOverlayOpen: false,
    prefixSuggestions: [],
    prefixInput: '',
    selectedPrefixes: [],
    typeFilter: null,
    showPrefixModal: false
  });
  const [filterPrefixIds, setFilterPrefixIds] = useState<string[]>([]);
  //const [overlayPrefixIds, setOverlayPrefixIds] = useState<string[]>([]);
  const [overlayPrefixes, setOverlayPrefixes] = useState<{ id: string; value: string; type: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch all available prefixes on component mount
  useEffect(() => {
    const fetchAvailablePrefixes = async () => {
      try {
        const prefixes = await EntryService.getAvailablePrefixes();
        setOverlayPrefixes(prefixes);
      } catch (err) {
        setError('Failed to fetch prefixes');
      }
    };

    fetchAvailablePrefixes();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!entryState.currentPrefix) return;

    const filterPrefixes = () => {
      const searchTerm = entryState.prefixInput.toLowerCase();
      const currentType = PREFIXES[entryState.currentPrefix!].description;
      
      // Filter by type and search term, then sort alphabetically
      const filtered = overlayPrefixes
        .filter(prefix => 
          prefix.type === currentType && 
          prefix.value.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => a.value.localeCompare(b.value))
        .map(p => ({
          value: p.value,
          id: p.id
        }));

      setEntryState(prev => ({
        ...prev,
        prefixSuggestions: filtered
      }));
    };

    filterPrefixes();
  }, [entryState.prefixInput, overlayPrefixes, entryState.currentPrefix]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEntryState(prev => ({ ...prev, content: value }));

    // Get the last character of the text
    const lastChar = value[value.length - 1];
    
    // If it's a prefix symbol, open the overlay and remove the symbol
    if (['@', '!', '?', '#'].includes(lastChar)) {
      // Convert symbol to type using SYMBOL_TO_TYPE
      const prefixType = SYMBOL_TO_TYPE[lastChar as keyof typeof SYMBOL_TO_TYPE];
      setEntryState(prev => ({
        ...prev,
        currentPrefix: prefixType,
        isPrefixOverlayOpen: true,
        prefixInput: '',
        // Remove the last character (the symbol) from the content
        content: value.slice(0, -1)
      }));
    }
  };

  const handlePrefixSelect = (prefixId: string) => {
    // Add the prefix to the filter list
    setFilterPrefixIds(prev => [...prev, prefixId]);
    setRefreshTrigger(prev => prev + 1);
    
    // Close the modal and reset state
    setEntryState(prev => ({
      ...prev,
      showPrefixModal: false,
      currentPrefix: null
    }));
  };

  const handleOverlayPrefixSelect = async (prefixId: string) => {
    if (!entryState.currentPrefix) return;
    
    // Check if this is a new prefix (string) or existing prefix (ID)
    let prefixValue: string;

    if (typeof prefixId === 'string' && !prefixId.includes('-')) {
      // This is a new prefix value
      prefixValue = prefixId;
      
      // Create the new prefix
      const { error } = await supabase
        .from('prefixes')
        .insert({
          value: prefixValue,
          type: PREFIXES[entryState.currentPrefix].description,
          user_id: user?.id
        });

      if (error) {
        console.error('Failed to create prefix:', error);
        return;
      }
    } else {
      // This is an existing prefix ID
      const selectedPrefix = overlayPrefixes.find(p => p.id === prefixId);
      if (!selectedPrefix) return;
      prefixValue = selectedPrefix.value;
    }

    // Get the symbol for the current prefix type
    const symbol = PREFIXES[entryState.currentPrefix].symbol;
    
    // Add the prefix to the content in the format [symbolprefixtext]
    const newContent = entryState.content + `[${symbol}${prefixValue}]`;
    
    setEntryState(prev => ({
      ...prev,
      content: newContent,
      isPrefixOverlayOpen: false,
      currentPrefix: null,
      prefixInput: '',
      prefixSuggestions: []
    }));

    // Set focus and cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Set cursor position to the end of the new content
        textareaRef.current.setSelectionRange(newContent.length, newContent.length);
      }
    }, 0);
  };

  const handlePrefixRemove = (prefixId: string) => {
    setFilterPrefixIds(prev => prev.filter(id => id !== prefixId));
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePrefixSymbol = (symbol: string) => {
    // Convert symbol to prefix type using SYMBOL_TO_TYPE
    const prefixType = SYMBOL_TO_TYPE[symbol as keyof typeof SYMBOL_TO_TYPE];
    
    if (prefixType) {
      setEntryState(prev => ({
        ...prev,
        currentPrefix: prefixType,
        prefixInput: '',
        showPrefixModal: true
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!entryState.content.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Parse the entry to extract prefixes from the content
      const parsedEntry = parseEntry(entryState.content);

      await EntryService.createEntry(parsedEntry);
      
      setEntryState(prev => ({
        ...prev,
        content: '',
        selectedPrefixes: []
      }));
      setSuccess('Entry saved successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeSelect = (type: PrefixType | null) => {
    setEntryState(prev => ({
      ...prev,
      selectedPrefixType: type,
      typeFilter: type
    }));
    setFilterPrefixIds([]);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="relative h-[30%] min-h-[200px]">
        <textarea
          ref={textareaRef}
          value={entryState.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 text-base leading-relaxed border border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-black/50 backdrop-blur-sm text-gray-100 font-mono whitespace-pre-wrap text-[16px]"
          placeholder="Type your entry here..."
        />
        {entryState.isPrefixOverlayOpen && entryState.currentPrefix && (
          <PrefixOverlay
            currentPrefix={entryState.currentPrefix}
            onClose={() => {
              setEntryState(prev => ({
                ...prev,
                isPrefixOverlayOpen: false,
                currentPrefix: null,
                prefixInput: '',
                prefixSuggestions: []
              }));
              setTimeout(() => {
                textareaRef.current?.focus();
              }, 0);
            }}
            onPrefixSelect={handleOverlayPrefixSelect}
          />
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm font-mono">
            Press ⌘ + Enter to save
          </span>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm font-mono p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-400 text-sm font-mono p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          {success}
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!entryState.content.trim() || isSubmitting}
          className="px-5 py-2.5 bg-gray-100 text-black rounded-xl hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      <PrefixTypeFilter
        selectedType={entryState.selectedPrefixType}
        onTypeChange={handleTypeSelect}
      />

      <div className="space-y-2">
        <PrefixSearch
          selectedPrefixIds={filterPrefixIds}
          typeFilter={entryState.selectedPrefixType}
          onPrefixSymbol={handlePrefixSymbol}
        />
        
        {/* Selected prefix tags */}
        {filterPrefixIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterPrefixIds.map(prefixId => {
              const prefix = overlayPrefixes.find(p => p.id === prefixId);
              if (!prefix) return null;
              return (
                <div
                  key={prefixId}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-gray-100 text-sm"
                >
                  <span className="text-green-500">
                    {PREFIXES[prefix.type as PrefixType]?.symbol}
                  </span>
                  <span>{prefix.value}</span>
                  <button
                    onClick={() => handlePrefixRemove(prefixId)}
                    className="text-gray-400 hover:text-gray-100"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="mb-2 text-sm text-gray-400 font-mono">
          {entriesCount} {entriesCount === 1 ? 'entry' : 'entries'} returned
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <ErrorBoundary>
            <FilteredEntries
              onEntriesCountChange={setEntriesCount}
              selectedPrefixType={entryState.selectedPrefixType}
              selectedPrefixIds={filterPrefixIds.map(prefixId => {
                const prefix = overlayPrefixes.find(p => p.id === prefixId);
                return prefix ? prefix.value : '';
              }).filter(Boolean)}
              refreshTrigger={refreshTrigger}
            />
          </ErrorBoundary>
        </div>
      </div>

      {entryState.showPrefixModal && entryState.currentPrefix && (
        <PrefixSearchModal
          currentPrefix={entryState.currentPrefix}
          onClose={() => {
            setEntryState(prev => ({
              ...prev,
              showPrefixModal: false,
              currentPrefix: null
            }));
          }}
          onPrefixSelect={handlePrefixSelect}
          selectedPrefixIds={filterPrefixIds}
          typeFilter={entryState.selectedPrefixType}
        />
      )}
    </div>
  );
} 