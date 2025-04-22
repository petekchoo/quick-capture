export type PrefixType = 'person' | 'action' | 'idea' | 'tag';

export interface Entry {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Prefix {
  id: string;
  type: PrefixType;
  value: string;
  user_id: string;
  created_at: string;
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
        Insert: Omit<Prefix, 'id' | 'created_at'>;
        Update: Partial<Omit<Prefix, 'id' | 'created_at'>>;
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
  };
} 