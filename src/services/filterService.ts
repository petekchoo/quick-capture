import { supabase } from './supabase';
import { Entry as DatabaseEntry, Prefix, PrefixType } from '../types/database';

export interface Entry extends DatabaseEntry {
  entry_prefixes: {
    prefix: {
      id: string;
      type: PrefixType;
      value: string;
    };
  }[];
}

export class FilterService {
  async initializeTypeFilter(userId: string, type: PrefixType | null): Promise<{ entries: Entry[]; prefixes: Prefix[] }> {
    console.log('Initializing type filter for type:', type);
    
    if (type === null) {
      // When "no filters" is selected, get all entries directly
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select(`
          *,
          entry_prefixes!inner (
            prefix_id,
            prefix:prefixes!inner (
              id,
              value,
              type
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Error getting all entries:', entriesError);
        throw entriesError;
      }

      // Extract all unique prefixes from entries
      const allPrefixes = entries.reduce((prefixes: Prefix[], entry: Entry) => {
        entry.entry_prefixes?.forEach(({ prefix }) => {
          if (!prefixes.some(p => p.id === prefix.id)) {
            prefixes.push({
              ...prefix,
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });
        return prefixes;
      }, []);

      return { entries, prefixes: allPrefixes };
    }

    // Drop any existing temporary table
    const { error: dropError } = await supabase.rpc('drop_type_filter');
    if (dropError) {
      console.error('Error dropping existing type filter:', dropError);
      throw dropError;
    }

    // Create new temporary table
    const { error: createError } = await supabase.rpc('create_type_filter', {
      user_id: userId,
      prefix_type: type
    });
    if (createError) {
      console.error('Error creating type filter:', createError);
      throw createError;
    }

    // Get entries using the filter_by_prefixes function
    const { data: entries, error: entriesError } = await supabase.rpc('filter_by_prefixes', {
      current_user_id: userId,
      prefix_values: null
    });

    if (entriesError) {
      console.error('Error getting filtered entries:', entriesError);
      throw entriesError;
    }

    // Extract all prefixes from entries in temporary table
    const allPrefixes = entries.reduce((prefixes: Prefix[], entry: Entry) => {
      entry.entry_prefixes?.forEach(({ prefix }) => {
        if (!prefixes.some(p => p.id === prefix.id)) {
          prefixes.push({
            ...prefix,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      return prefixes;
    }, []);

    return { entries, prefixes: allPrefixes };
  }

  async getAvailablePrefixes(userId: string, type: PrefixType | null): Promise<Prefix[]> {
    console.log('Getting available prefixes for type:', type);
    
    if (type === null) {
      // When "no filters" is selected, get all prefixes
      const { data: prefixes, error } = await supabase
        .from('prefixes')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting all prefixes:', error);
        throw error;
      }

      return prefixes;
    }

    // Get prefixes from temporary table
    const { data: prefixes, error } = await supabase.rpc('get_filtered_prefixes', {
      user_id: userId
    });

    if (error) {
      console.error('Error getting filtered prefixes:', error);
      throw error;
    }

    return prefixes;
  }

  async filterByPrefixes(userId: string, prefixValues: string[]): Promise<Entry[]> {
    console.log('Filtering by prefix values:', prefixValues);
    
    const { data: entries, error } = await supabase
      .from('entries')
      .select(`
        *,
        entry_prefixes!inner (
          prefix_id,
          prefix:prefixes!inner (
            id,
            value,
            type
          )
        )
      `)
      .eq('user_id', userId)
      .in('entry_prefixes.prefix.value', prefixValues)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error filtering by prefixes:', error);
      throw error;
    }

    return entries;
  }
} 