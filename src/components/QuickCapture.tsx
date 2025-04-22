import { useState, useRef, useEffect, useCallback } from 'react';
import { EntryService } from '../services/entryService';
import { parseEntry } from '../utils/entryParser';
import { supabase } from '../services/supabase';
import { debounce } from 'lodash';
import { PrefixOverlay } from './PrefixOverlay';
import { EntryState, TextSegment, PrefixType } from '../types/entry';
import { PREFIXES, getPrefixType } from '../constants/prefixes';
import './QuickCapture.css';
import { PrefixSearch } from './PrefixSearch';
import { FilteredEntries } from './FilteredEntries';

interface Prefix {
  id: string;
  type: PrefixType;
  value: string;
}

export function QuickCapture() {
  const [entryState, setEntryState] = useState<EntryState>({
    content: '',
    currentPrefix: null,
    selectedPrefixes: [],
    isPrefixOverlayOpen: false,
    prefixSuggestions: [],
    prefixInput: ''
  });
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch prefix suggestions when prefix type changes
  useEffect(() => {
    const fetchPrefixes = async () => {
      if (entryState.currentPrefix) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // Get the description for the prefix type
          const prefixDescription = PREFIXES[entryState.currentPrefix]?.description;

          const { data, error } = await supabase
            .from('prefixes')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', prefixDescription)
            .order('value', { ascending: true });

          if (error) throw error;
          
          // Update both the full prefix list and suggestions
          const prefixValues = data?.map(p => p.value) || [];
          setPrefixes(data || []);
          setEntryState(prev => ({
            ...prev,
            prefixSuggestions: prefixValues
          }));
        } catch (error) {
          console.error('Error fetching prefixes:', error);
        }
      }
    };

    fetchPrefixes();
  }, [entryState.currentPrefix]);

  // Filter suggestions based on input
  useEffect(() => {
    if (!entryState.currentPrefix) return;

    const filterPrefixes = () => {
      const searchTerm = entryState.prefixInput.toLowerCase();
      const filtered = prefixes
        .filter(prefix => prefix.value.toLowerCase().includes(searchTerm))
        .map(p => p.value);

      setEntryState(prev => ({
        ...prev,
        prefixSuggestions: filtered
      }));
    };

    filterPrefixes();
  }, [entryState.prefixInput, prefixes, entryState.currentPrefix]);

  // Handle key events in the modal
  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setEntryState(prev => ({
        ...prev,
        isPrefixOverlayOpen: false,
        currentPrefix: null,
        prefixInput: '',
        prefixSuggestions: []
      }));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < entryState.prefixSuggestions.length) {
        // If there's a highlighted suggestion, use that
        handlePrefixSelect(entryState.prefixSuggestions[highlightedIndex]);
      } else if (entryState.prefixInput) {
        // Otherwise, use the input text
        handlePrefixSubmit();
      } else {
        // If no input and no selection, close the modal
        setEntryState(prev => ({
          ...prev,
          isPrefixOverlayOpen: false,
          currentPrefix: null,
          prefixInput: '',
          prefixSuggestions: []
        }));
      }
      return;
    }

    if (!entryState.prefixSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < entryState.prefixSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
    }
  };

  const handleModalClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop
    if (e.target === e.currentTarget) {
      setEntryState(prev => ({
        ...prev,
        isPrefixOverlayOpen: false,
        currentPrefix: null,
        prefixInput: '',
        prefixSuggestions: []
      }));
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

  const getCursorPosition = () => {
    if (!textareaRef.current) return null;
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.textContent = currentLine;
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.font = window.getComputedStyle(textarea).font;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);

    return {
      x: rect.left + width + 10,
      y: rect.top + (lines.length - 1) * parseInt(window.getComputedStyle(textarea).lineHeight),
    };
  };

  const isPrefixTrigger = (text: string, cursorPos: number): boolean => {
    const char = text[cursorPos - 1];
    return Object.keys(PREFIXES).includes(char);
  };

  const getPrefixType = (text: string, cursorPos: number): PrefixType | null => {
    const char = text[cursorPos - 1];
    return PREFIXES[char]?.type || null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEntryState(prev => ({ ...prev, content: value }));

    // Check for prefix trigger
    const lastChar = value[value.length - 1];
    if (Object.keys(PREFIXES).includes(lastChar)) {
      setEntryState(prev => ({
        ...prev,
        currentPrefix: lastChar as PrefixType,
        isPrefixOverlayOpen: true,
        prefixInput: ''
      }));
    }
  };

  const handlePrefixInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEntryState(prev => ({
      ...prev,
      prefixInput: e.target.value
    }));
    setHighlightedIndex(-1);
  };

  const handlePrefixSelect = (prefix: string) => {
    // Remove the trigger symbol from the content
    const contentWithoutTrigger = entryState.content.slice(0, -1);
    const prefixText = `[${entryState.currentPrefix}${prefix}]`;
    
    setEntryState(prev => ({
      ...prev,
      content: contentWithoutTrigger + prefixText,
      isPrefixOverlayOpen: false,
      currentPrefix: null,
      prefixInput: '',
      prefixSuggestions: []
    }));
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handlePrefixSubmit = () => {
    if (entryState.prefixInput) {
      handlePrefixSelect(entryState.prefixInput);
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
    } catch (err) {
      setError('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={entryState.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-64 p-6 text-base leading-relaxed border border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-black/50 backdrop-blur-sm text-gray-100 font-mono whitespace-pre-wrap"
          placeholder="Type your entry here..."
        />
        {entryState.isPrefixOverlayOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={handleModalClickOutside}
          >
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-100 mb-2">
                  Add {PREFIXES[entryState.currentPrefix!].description}
                </h3>
                <input
                  ref={inputRef}
                  type="text"
                  value={entryState.prefixInput}
                  onChange={handlePrefixInputChange}
                  onKeyDown={handleModalKeyDown}
                  placeholder={`Search or create ${PREFIXES[entryState.currentPrefix!].description}...`}
                  className="w-full p-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  autoFocus
                />
              </div>
              {entryState.prefixSuggestions.length > 0 && (
                <div 
                  ref={resultsRef}
                  className="mb-4 max-h-48 overflow-y-auto"
                >
                  {entryState.prefixSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handlePrefixSelect(suggestion)}
                      className={`w-full p-2 text-left text-gray-100 hover:bg-gray-800 rounded ${
                        index === highlightedIndex ? 'bg-gray-800' : ''
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEntryState(prev => ({ ...prev, isPrefixOverlayOpen: false, currentPrefix: null }))}
                  className="px-4 py-2 text-gray-300 hover:text-gray-100"
                >
                  Cancel
                </button>
                {entryState.prefixInput && entryState.prefixSuggestions.length === 0 && (
                  <button
                    onClick={handlePrefixSubmit}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Create
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm font-mono">
            Press ⌘ + Enter to save
          </span>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm font-mono">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-400 text-sm font-mono">
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

      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Search by tag</h3>
        <PrefixSearch onPrefixSelect={(prefixes) => setEntryState(prev => ({ ...prev, selectedPrefixes: prefixes }))} />
      </div>

      <FilteredEntries selectedPrefixes={entryState.selectedPrefixes} />
    </div>
  );
} 