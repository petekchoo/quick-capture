import { supabase } from './supabase';
import { Database, Entry, Prefix, PrefixType } from '../types/database';
import { handleError, DatabaseError, ValidationError, NotFoundError } from '../utils/errors';

type Tables = Database['public']['Tables'];
type Row<T extends keyof Tables> = Tables[T]['Row'];
type Insert<T extends keyof Tables> = Tables[T]['Insert'];
type Update<T extends keyof Tables> = Tables[T]['Update'];

export class DatabaseService {
  // Entry operations
  static async getEntries(userId: string) {
    try {
      const { data, error } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new DatabaseError(error.message);
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }

  static async createEntry(entry: Insert<'entries'>) {
    try {
      const { data, error } = await supabase
        .from('entries')
        .insert(entry)
        .select()
        .single();

      if (error) throw new DatabaseError(error.message);
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }

  static async updateEntry(id: string, updates: Update<'entries'>) {
    try {
      const { data, error } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new DatabaseError(error.message);
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }

  static async deleteEntry(id: string) {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw new DatabaseError(error.message);
    } catch (error) {
      throw handleError(error);
    }
  }

  // Prefix operations
  static async getPrefixes(userId: string, type?: PrefixType) {
    try {
      let query = supabase
        .from('prefixes')
        .select('*')
        .eq('user_id', userId);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('value');

      if (error) throw new DatabaseError(error.message);
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }

  static async createPrefix(prefix: Insert<'prefixes'>) {
    try {
      const { data, error } = await supabase
        .from('prefixes')
        .insert(prefix)
        .select()
        .single();

      if (error) throw new DatabaseError(error.message);
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }

  static async linkPrefixToEntry(entryId: string, prefixId: string) {
    try {
      const { error } = await supabase
        .from('entry_prefixes')
        .insert({ entry_id: entryId, prefix_id: prefixId });

      if (error) throw new DatabaseError(error.message);
    } catch (error) {
      throw handleError(error);
    }
  }

  static async unlinkPrefixFromEntry(entryId: string, prefixId: string) {
    try {
      const { error } = await supabase
        .from('entry_prefixes')
        .delete()
        .eq('entry_id', entryId)
        .eq('prefix_id', prefixId);

      if (error) throw new DatabaseError(error.message);
    } catch (error) {
      throw handleError(error);
    }
  }

  // Filter operations
  static async createTypeFilter(userId: string, type: PrefixType) {
    try {
      const { error } = await supabase.rpc('create_type_filter', {
        user_id: userId,
        prefix_type: type
      });

      if (error) throw new DatabaseError(error.message);
    } catch (error) {
      throw handleError(error);
    }
  }

  static async getFilteredEntries(userId: string, prefixValues?: string[]) {
    try {
      const { data, error } = await supabase.rpc('filter_by_prefixes', {
        current_user_id: userId,
        prefix_values: prefixValues || []
      });

      if (error) throw new DatabaseError(error.message);
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }
} 