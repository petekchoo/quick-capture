import { useState, useEffect } from 'react';
import { FilterService } from '../services/filterService';
import { PREFIXES, PrefixType } from '../constants/prefixes';
import { supabase } from '../services/supabase';

interface Entry {
  id: string;
  content: string;
  created_at: string;
  entry_prefixes: {
    prefix: {
      id: string;
      type: string;
      value: string;
    };
  }[];
}

interface FilteredEntriesProps {
  selectedPrefixIds: string[];
  selectedPrefixType: PrefixType | null;
  onEntriesCountChange: (count: number) => void;
  onAvailablePrefixesChange: (prefixes: { id: string; value: string; type: string }[]) => void;
  refreshTrigger?: number;
}

export function FilteredEntries({ 
  selectedPrefixIds, 
  selectedPrefixType, 
  onEntriesCountChange,
  onAvailablePrefixesChange,
  refreshTrigger
}: FilteredEntriesProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPrefixSuggestions, setShowPrefixSuggestions] = useState(false);
  const [prefixInput, setPrefixInput] = useState('');
  const [prefixSuggestions, setPrefixSuggestions] = useState<{ id: string; type: string; value: string }[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [prefixType, setPrefixType] = useState<PrefixType | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        if (selectedPrefixType) {
          // Convert prefix type symbol to description
          const typeDescription = PREFIXES[selectedPrefixType].description;

          // Initialize type filter and get available prefixes
          await FilterService.initializeTypeFilter(typeDescription);
          const filteredPrefixes = await FilterService.getAvailablePrefixes(typeDescription);
          onAvailablePrefixesChange(filteredPrefixes);

          if (selectedPrefixIds.length > 0) {
            // If prefixes are selected, filter by them
            // Fetch the prefix values for the selected IDs
            const { data: prefixes, error: prefixError } = await supabase
              .from('prefixes')
              .select('value')
              .in('id', selectedPrefixIds);
            
            if (prefixError) throw prefixError;
            
            const prefixValues = prefixes.map(p => p.value);
            const filteredEntries = await FilterService.filterByPrefixes(prefixValues);
            setEntries(filteredEntries);
            onEntriesCountChange(filteredEntries.length);
          } else {
            // If no prefixes selected, get all entries for the type
            const allEntries = await FilterService.filterByPrefixes([]);
            setEntries(allEntries);
            onEntriesCountChange(allEntries.length);
          }
        } else {
          // No type filter selected
          if (selectedPrefixIds.length > 0) {
            // If prefixes are selected, filter by them
            const { data: prefixes, error: prefixError } = await supabase
              .from('prefixes')
              .select('value')
              .in('id', selectedPrefixIds);
            
            if (prefixError) throw prefixError;
            
            const prefixValues = prefixes.map(p => p.value);
            const filteredEntries = await FilterService.filterByPrefixes(prefixValues);
            setEntries(filteredEntries);
            onEntriesCountChange(filteredEntries.length);
          } else {
            // Get all entries directly from the database
            const { data: entries, error } = await supabase
              .from('entries')
              .select(`
                *,
                entry_prefixes (
                  prefix:prefixes (
                    id,
                    type,
                    value
                  )
                )
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (error) throw error;

            setEntries(entries);
            onEntriesCountChange(entries.length);
          }

          // Get all available prefixes
          const { data: prefixes } = await supabase
            .from('prefixes')
            .select('id, type, value')
            .eq('user_id', user.id);

          if (prefixes) {
            onAvailablePrefixesChange(prefixes);
          }
        }
      } catch (err) {
        setError('Failed to fetch entries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [selectedPrefixType, selectedPrefixIds, refreshTrigger]);

  const handleEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleSaveEdit = async (entryId: string) => {
    try {
      // First update the entry content
      const { error: contentError } = await supabase
        .from('entries')
        .update({ content: editContent })
        .eq('id', entryId);

      if (contentError) throw contentError;

      // Get the current entry's prefixes
      const currentEntry = entries.find(entry => entry.id === entryId);
      if (!currentEntry) throw new Error('Entry not found');

      // Get the original entry's prefixes
      const { data: originalEntry } = await supabase
        .from('entries')
        .select('entry_prefixes!inner(prefix_id)')
        .eq('id', entryId)
        .single();

      if (!originalEntry) throw new Error('Original entry not found');

      // Find prefixes that were removed during editing
      const removedPrefixes = originalEntry.entry_prefixes
        .filter(ep => !currentEntry.entry_prefixes.some(currentEp => currentEp.prefix.id === ep.prefix_id))
        .map(ep => ep.prefix_id);

      // Remove the prefixes from the database
      if (removedPrefixes.length > 0) {
        const { error: prefixError } = await supabase
          .from('entry_prefixes')
          .delete()
          .match({ entry_id: entryId })
          .in('prefix_id', removedPrefixes);

        if (prefixError) throw prefixError;
      }

      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, content: editContent }
          : entry
      ));
      setEditingId(null);
    } catch (err) {
      setError('Failed to update entry');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      onEntriesCountChange(entries.length - 1);
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const handleRemovePrefix = async (entryId: string, prefixId: string) => {
    try {
      // If we're in edit mode, just update the local state
      if (editingId === entryId) {
        const prefixToRemove = entries
          .find(entry => entry.id === entryId)
          ?.entry_prefixes.find(ep => ep.prefix.id === prefixId)?.prefix;

        if (prefixToRemove) {
          // Find the matching prefix type in PREFIXES by description
          const prefixKey = Object.entries(PREFIXES).find(
            ([_, def]) => def.description === prefixToRemove.type
          )?.[0] as PrefixType | undefined;

          if (prefixKey) {
            const symbol = PREFIXES[prefixKey].symbol;
            const prefixText = `[${symbol}${prefixToRemove.value}]`;
            
            // Update both states in a single batch
            setEntries(prev => {
              const newEntries = prev.map(entry => {
                if (entry.id === entryId) {
                  return {
                    ...entry,
                    entry_prefixes: entry.entry_prefixes.filter(ep => ep.prefix.id !== prefixId),
                    content: entry.content.replace(prefixText, '')
                  };
                }
                return entry;
              });
              return newEntries;
            });

            // Update the edit content
            setEditContent(prev => prev.replace(prefixText, ''));
          }
        }
      } else {
        // If not in edit mode, remove from database immediately
        const { error } = await supabase
          .from('entry_prefixes')
          .delete()
          .match({ entry_id: entryId, prefix_id: prefixId });

        if (error) throw error;

        const prefixToRemove = entries
          .find(entry => entry.id === entryId)
          ?.entry_prefixes.find(ep => ep.prefix.id === prefixId)?.prefix;

        if (prefixToRemove) {
          const symbol = PREFIXES[prefixToRemove.type as PrefixType]?.symbol;
          
          if (symbol) {
            const prefixText = `[${symbol}${prefixToRemove.value}]`;
            
            // Update local state
            setEntries(prev => {
              const newEntries = prev.map(entry => {
                if (entry.id === entryId) {
                  return {
                    ...entry,
                    entry_prefixes: entry.entry_prefixes.filter(ep => ep.prefix.id !== prefixId),
                    content: entry.content.replace(prefixText, '')
                  };
                }
                return entry;
              });
              return newEntries;
            });
          }
        }
      }
    } catch (err) {
      setError('Failed to remove prefix');
    }
  };

  const handlePrefixInput = async (value: string) => {
    setPrefixInput(value);
    if (value.trim()) {
      const { data: suggestions } = await supabase
        .from('prefixes')
        .select('id, type, value')
        .ilike('value', `%${value}%`)
        .limit(5);
      setPrefixSuggestions(suggestions || []);
    } else {
      setPrefixSuggestions([]);
    }
    setHighlightedIndex(-1);
  };

  const handlePrefixSelect = async (prefix: { id: string; type: string; value: string }) => {
    try {
      const { error } = await supabase
        .from('entry_prefixes')
        .insert({ entry_id: editingId, prefix_id: prefix.id });

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.map(entry => {
        if (entry.id === editingId) {
          return {
            ...entry,
            entry_prefixes: [
              ...entry.entry_prefixes,
              { prefix }
            ]
          };
        }
        return entry;
      }));

      // Add the prefix to the textarea content
      if (prefixType) {
        const symbol = PREFIXES[prefixType].symbol;
        const lastSymbolIndex = editContent.lastIndexOf(symbol);
        if (lastSymbolIndex !== -1) {
          // Remove the trigger symbol from the content
          const contentWithoutTrigger = editContent.slice(0, lastSymbolIndex);
          // Add the prefix with its symbol and brackets, without a space
          setEditContent(`${contentWithoutTrigger}[${symbol}${prefix.value}]`);
        }
      }

      setPrefixInput('');
      setPrefixSuggestions([]);
      setShowPrefixSuggestions(false);
      setPrefixType(null);
    } catch (err) {
      setError('Failed to add prefix');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm font-mono">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-gray-400 text-sm font-mono text-center py-8">
        No entries found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap gap-2">
              {entry.entry_prefixes?.map(({ prefix }) => (
                prefix && (
                  <span
                    key={prefix.id}
                    className="px-2 py-1 bg-gray-800 rounded-full text-sm flex items-center gap-1"
                  >
                    <span className="text-green-500">
                      {prefix.type && PREFIXES[prefix.type as PrefixType]?.symbol}
                    </span>
                    {prefix.value}
                    {editingId === entry.id && (
                      <button
                        onClick={() => handleRemovePrefix(entry.id, prefix.id)}
                        className="text-gray-400 hover:text-red-400 ml-1"
                        title="Remove prefix"
                      >
                        ×
                      </button>
                    )}
                  </span>
                )
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(entry)}
                className="text-gray-400 hover:text-gray-200 p-1"
                title="Edit entry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(entry.id)}
                className="text-gray-400 hover:text-red-400 p-1"
                title="Delete entry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {editingId === entry.id ? (
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={editContent}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setEditContent(value);
                    
                    // Check for prefix symbols
                    const lastChar = value[value.length - 1];
                    if (lastChar && Object.values(PREFIXES).some(p => p.symbol === lastChar)) {
                      const prefix = Object.entries(PREFIXES).find(([_, p]) => p.symbol === lastChar);
                      if (prefix) {
                        setPrefixType(prefix[0] as PrefixType);
                        setShowPrefixSuggestions(true);
                        setPrefixInput('');
                        // Fetch initial suggestions
                        const { data: suggestions } = await supabase
                          .from('prefixes')
                          .select('id, type, value')
                          .eq('type', PREFIXES[prefix[0] as PrefixType].description)
                          .order('value')
                          .limit(5);
                        setPrefixSuggestions(suggestions || []);
                      }
                    } else if (prefixType && showPrefixSuggestions) {
                      const symbol = PREFIXES[prefixType].symbol;
                      const lastSymbolIndex = value.lastIndexOf(symbol);
                      if (lastSymbolIndex !== -1) {
                        const input = value.slice(lastSymbolIndex + 1);
                        setPrefixInput(input);
                        // Fetch suggestions based on input
                        const { data: suggestions } = await supabase
                          .from('prefixes')
                          .select('id, type, value')
                          .eq('type', PREFIXES[prefixType].description)
                          .ilike('value', `%${input}%`)
                          .order('value')
                          .limit(5);
                        setPrefixSuggestions(suggestions || []);
                      } else {
                        setShowPrefixSuggestions(false);
                        setPrefixType(null);
                        setPrefixInput('');
                        setPrefixSuggestions([]);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle prefix suggestions navigation
                    if (showPrefixSuggestions) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIndex(prev => 
                          prev < prefixSuggestions.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                        e.preventDefault();
                        handlePrefixSelect(prefixSuggestions[highlightedIndex]);
                        // Remove the prefix symbol and input from the textarea
                        const symbol = PREFIXES[prefixType!].symbol;
                        const lastSymbolIndex = editContent.lastIndexOf(symbol);
                        setEditContent(editContent.slice(0, lastSymbolIndex));
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setShowPrefixSuggestions(false);
                        setPrefixType(null);
                        setPrefixInput('');
                        setPrefixSuggestions([]);
                      }
                    } else {
                      // Original textarea keyboard shortcuts
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditingId(null);
                      }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSaveEdit(entry.id);
                      }
                    }
                  }}
                  className="w-full p-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none font-mono"
                  rows={3}
                  autoFocus
                />
                {showPrefixSuggestions && prefixSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-10">
                    {prefixSuggestions.map((prefix, index) => (
                      <div
                        key={prefix.id}
                        className={`p-2 cursor-pointer ${
                          index === highlightedIndex
                            ? 'bg-gray-800'
                            : 'hover:bg-gray-800'
                        }`}
                        onClick={() => handlePrefixSelect(prefix)}
                      >
                        <span className="text-green-500">
                          {PREFIXES[prefix.type as PrefixType]?.symbol}
                        </span>
                        {prefix.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Press Esc to cancel • ⌘ + Enter to save
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(entry.id)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-100 whitespace-pre-wrap font-mono">
              {entry.content}
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            {new Date(entry.created_at).toLocaleString()}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm === entry.id && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6 max-w-md">
                <h3 className="text-lg font-medium text-gray-100 mb-4">
                  Delete Entry?
                </h3>
                <p className="text-gray-300 mb-6">
                  This action cannot be undone. Are you sure you want to delete this entry?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-300 hover:text-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 