import { supabase } from './supabase';

export class FilterService {
  static async initializeTypeFilter(type: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('create_type_filter', {
      user_id: user.id,
      prefix_type: type
    });

    if (error) {
      throw error;
    }
  }

  static async getAvailablePrefixes(type: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('get_available_prefixes', {
      user_id: user.id,
      prefix_type: type
    });

    if (error) {
      throw error;
    }
    return data;
  }

  static async filterByPrefixes(prefixValues: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('filter_by_prefixes', {
      current_user_id: user.id,
      prefix_values: prefixValues
    });

    if (error) {
      throw error;
    }
    return data;
  }
} 