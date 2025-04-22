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
    prefixTypes?: PrefixType[];
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

    if (filters?.prefixValues?.length) {
      // Get all entries that have any of the selected prefixes
      query = query.in('entry_prefixes.prefix.value', filters.prefixValues);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Additional client-side filtering to ensure all prefixes are present
    if (filters?.prefixValues?.length) {
      return data.filter(entry => {
        const entryPrefixValues = entry.entry_prefixes.map((ep: { prefix: { value: string } }) => ep.prefix.value);
        return filters.prefixValues!.every(prefixValue => 
          entryPrefixValues.includes(prefixValue)
        );
      });
    }

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
} 