import { useState, useEffect } from 'react';
import { EntryService } from '../services/entryService';
import { PREFIXES } from '../constants/prefixes';
import type { PrefixType } from '../types/entry';

interface FilteredEntriesProps {
  selectedPrefixes: string[];
}

interface Entry {
  id: string;
  content: string;
  created_at: string;
  entry_prefixes: {
    prefix: {
      id: string;
      type: PrefixType;
      value: string;
    };
  }[];
}

// Helper to get symbol from type
const getSymbolFromType = (type: PrefixType): string => {
  const entry = Object.entries(PREFIXES).find(([_, def]) => def.type === type);
  return entry ? entry[0] : '';
};

// Helper to highlight prefixes in content
const highlightPrefixes = (content: string, prefixes: Entry['entry_prefixes']) => {
  let highlightedContent = content;
  prefixes.forEach(({ prefix }) => {
    const symbol = getSymbolFromType(prefix.type);
    const prefixText = `[${symbol}${prefix.value}]`;
    highlightedContent = highlightedContent.replace(
      prefixText,
      `<span class="text-green-400">${prefixText}</span>`
    );
  });
  return highlightedContent;
};

export function FilteredEntries({ selectedPrefixes }: FilteredEntriesProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      if (selectedPrefixes.length === 0) {
        setEntries([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await EntryService.getEntries({
          prefixValues: selectedPrefixes
        });
        setEntries(data);
      } catch (err) {
        setError('Failed to load entries');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to prevent rapid re-fetching when multiple prefixes are selected quickly
    const timeoutId = setTimeout(fetchEntries, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedPrefixes]);

  if (selectedPrefixes.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium text-gray-300">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} matching selected tags
        </h2>
        <div className="flex gap-1">
          {selectedPrefixes.map((prefix, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-800 rounded-full text-gray-300"
            >
              {prefix}
            </span>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-green-500" />
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm">
          {error}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="text-gray-400 text-sm">
          No entries found matching all selected prefixes
        </div>
      )}

      <div className="space-y-4">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="p-4 bg-gray-900 rounded-xl border border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">
                {new Date(entry.created_at).toLocaleString()}
              </span>
              <div className="flex gap-1">
                {entry.entry_prefixes.map(({ prefix }) => (
                  <span
                    key={prefix.id}
                    className="px-2 py-0.5 text-xs bg-gray-800 rounded-full text-gray-300"
                  >
                    {getSymbolFromType(prefix.type)}{prefix.value}
                  </span>
                ))}
              </div>
            </div>
            <div 
              className="text-gray-100 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: highlightPrefixes(entry.content, entry.entry_prefixes)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 