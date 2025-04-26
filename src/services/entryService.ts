import { supabase } from './supabase';
import type { Database } from '../types/database';
import type { PrefixType } from '../types/database';
import { getPrefixType, isValidPrefix, PREFIXES } from '../constants/prefixes';

type Entry = Database['public']['Tables']['entries']['Row'];

export interface ParsedEntry {
  content: string;
  originalContent: string;
  prefixes: string[];  // Format: @name, !action, ?idea, #tag
  timeFrames: string[]; // Kept for type compatibility but not used
}

export interface SubmissionResult {
  entry: Entry;
  newTags: string[];
  existingTags: string[];
}

export class EntryService {
  static async createEntry(parsedEntry: ParsedEntry): Promise<Entry> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to save entries');
    }

    // Create the entry with the full content
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        user_id: user.id,
        content: parsedEntry.content,
      })
      .select('*')
      .single();

    if (entryError) {
      throw new Error('Failed to create entry');
    }

    // Handle prefixes
    for (const prefix of parsedEntry.prefixes) {
      try {
        // Ensure prefix is a string and has at least one character
        if (typeof prefix !== 'string' || prefix.length === 0) {
          continue;
        }

        // Extract the symbol and value from the bracket format [symbolvalue]
        const match = prefix.match(/^\[([@!?#])([^\]]+)\]$/);
        if (!match) {
          continue;
        }

        const prefixSymbol = match[1];
        const prefixValue = match[2];
        
        if (!isValidPrefix(prefixSymbol)) {
          continue;
        }

        const prefixType = getPrefixType(prefixSymbol);
        if (!prefixType) {
          continue;
        }

        // Get the description type for database storage
        const prefixDescription = PREFIXES[prefixType]?.description;

        // Check if prefix exists
        const { data: existingPrefixes, error: existingError } = await supabase
          .from('prefixes')
          .select('id')
          .eq('value', prefixValue)
          .eq('user_id', user.id)
          .eq('type', prefixDescription);

        if (existingError) {
          continue;
        }

        let prefixId;
        if (existingPrefixes && existingPrefixes.length > 0) {
          prefixId = existingPrefixes[0].id;
        } else {
          // Create new prefix
          const prefixData = { 
            value: prefixValue,
            type: prefixDescription,
            user_id: user.id
          };
          
          const { data: newPrefix, error: prefixError } = await supabase
            .from('prefixes')
            .insert(prefixData)
            .select('id')
            .single();

          if (prefixError) {
            continue;
          }
          prefixId = newPrefix?.id;
        }

        if (!prefixId) {
          continue;
        }

        // Link prefix to entry
        const linkData = {
          entry_id: entry.id,
          prefix_id: prefixId
        };
        
        const { error: linkError } = await supabase
          .from('entry_prefixes')
          .insert(linkData);

        if (linkError) {
          continue;
        }
      } catch (err) {
        continue;
      }
    }

    return entry;
  }

  static async getEntries(filters?: {
    prefixTypes?: string[];
    prefixValues?: string[];
    startDate?: Date;
    endDate?: Date;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('entries')
      .select(`
        *,
        entry_prefixes!inner (
          prefix:prefixes!inner (
            id,
            type,
            value
          )
        ),
        time_frames (
          start_time,
          end_time
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Case 1: Only type filter
    if (filters?.prefixTypes?.length && !filters?.prefixValues?.length) {
      query = query.in('entry_prefixes.prefix.type', filters.prefixTypes);
    }
    
    // Case 2: Only prefix values
    if (!filters?.prefixTypes?.length && filters?.prefixValues?.length) {
      // First get entries with any of the required values
      query = query.in('entry_prefixes.prefix.value', filters.prefixValues);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Then filter to ensure all required values are present
      return data.filter(entry => {
        const entryPrefixValues = entry.entry_prefixes.map((ep: { prefix: { value: string } }) => ep.prefix.value);
        return filters.prefixValues!.every(value => entryPrefixValues.includes(value));
      });
    }
    
    // Case 3: Both type and prefix values
    if (filters?.prefixTypes?.length && filters?.prefixValues?.length) {
      // First get entries with the required type
      query = query.in('entry_prefixes.prefix.type', filters.prefixTypes);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Then filter to ensure all required values are present
      return data.filter(entry => {
        const entryPrefixValues = entry.entry_prefixes.map((ep: { prefix: { value: string } }) => ep.prefix.value);
        return filters.prefixValues!.every(value => entryPrefixValues.includes(value));
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async deleteEntry(entryId: string) {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  }

  async getPrefixesByType(userId: string, type: string): Promise<{ id: string; value: string }[]> {
    const { data, error } = await supabase
      .from('prefixes')
      .select('id, value')
      .eq('user_id', userId)
      .eq('type', type);

    if (error) {
      console.error('Error fetching prefixes:', error);
      return [];
    }

    return data || [];
  }

  static async getAvailablePrefixes(entryIds?: string[]): Promise<{ id: string; value: string; type: string }[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('prefixes')
      .select('id, value, type')
      .eq('user_id', user.id);

    if (entryIds && entryIds.length > 0) {
      // If entryIds are provided, only get prefixes from those entries
      const { data: entryPrefixes } = await supabase
        .from('entry_prefixes')
        .select('prefix_id')
        .in('entry_id', entryIds);

      if (entryPrefixes) {
        const prefixIds = entryPrefixes.map(ep => ep.prefix_id);
        query = query.in('id', prefixIds);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }
} 