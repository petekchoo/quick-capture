export interface Entry {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  entry_prefixes: Array<{
    prefix: Prefix;
  }>;
}

export interface Prefix {
  id: string;
  type: string;
  value: string;
} 