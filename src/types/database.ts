import { PrefixType, PrefixSymbol } from '../constants/prefixes';

export interface Entry {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  prefix_ids: string[];
  entry_prefixes: {
    prefix: {
      id: string;
      type: PrefixType;
      value: string;
    };
  }[];
}

export interface Prefix {
  id: string;
  type: PrefixType;
  value: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface EntryPrefix {
  entry_id: string;
  prefix_id: string;
}

export interface TimeFrame {
  id: string;
  entry_id: string;
  start_time: string | null;
  end_time: string | null;
}

export interface EntryMetadata {
  id: string;
  entry_id: string;
  source: string | null;
  context: string | null;
}

export interface User {
  id: string;
  email: string;
  default_prefix_type: PrefixType | null;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      entries: {
        Row: Entry;
        Insert: Omit<Entry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Entry, 'id' | 'created_at' | 'updated_at'>>;
      };
      prefixes: {
        Row: Prefix;
        Insert: Omit<Prefix, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Prefix, 'id' | 'created_at' | 'updated_at'>>;
      };
      entry_prefixes: {
        Row: EntryPrefix;
        Insert: EntryPrefix;
        Update: EntryPrefix;
      };
      time_frames: {
        Row: TimeFrame;
        Insert: Omit<TimeFrame, 'id'>;
        Update: Partial<Omit<TimeFrame, 'id'>>;
      };
      entry_metadata: {
        Row: EntryMetadata;
        Insert: Omit<EntryMetadata, 'id'>;
        Update: Partial<Omit<EntryMetadata, 'id'>>;
      };
    };
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  };
} 