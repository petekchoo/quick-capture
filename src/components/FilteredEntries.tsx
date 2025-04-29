import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Entry } from '../types/database';
import { PrefixType } from '../constants/prefixes';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';
import { EntryCard } from './EntryCard';

interface FilteredEntriesProps {
  onEntriesCountChange: (count: number) => void;
  selectedPrefixType: PrefixType | null;
  selectedPrefixIds: string[];
  refreshTrigger: number;
}

export function FilteredEntries({ 
  onEntriesCountChange,
  selectedPrefixType: propSelectedPrefixType,
  selectedPrefixIds: propSelectedPrefixIds,
  refreshTrigger
}: FilteredEntriesProps) {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: entries, error } = await supabase
        .rpc('filter_by_prefixes', {
          current_user_id: user.id,
          prefix_type: propSelectedPrefixType,
          prefix_values: propSelectedPrefixIds.length > 0 
            ? propSelectedPrefixIds
            : null
        });

      if (error) throw error;
      setEntries(entries || []);
      onEntriesCountChange(entries?.length || 0);
    } catch (error) {
      console.error('FilteredEntries: Error fetching entries:', error);
      setError('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEntries();
    }
  }, [refreshTrigger]);

  const handleEntryDelete = () => {
    fetchEntries();
  };

  if (authLoading) return <LoadingSpinner />;
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="space-y-4">
          {entries.map(entry => (
            <EntryCard 
              key={entry.id} 
              entry={entry} 
              onDelete={handleEntryDelete}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
} 