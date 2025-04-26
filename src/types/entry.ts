export type PrefixType = '@' | '!' | '?' | '#';

export interface TextSegment {
  type: 'text' | 'prefix';
  content: string;
  prefixType?: PrefixType;
  start: number;
  end: number;
}

export interface PrefixSuggestion {
  value: string;
  id: string;
}

export interface EntryState {
  content: string;
  currentPrefix: PrefixType | null;
  selectedPrefixes: string[];
  isPrefixOverlayOpen: boolean;
  prefixSuggestions: PrefixSuggestion[];
  prefixInput: string;
  selectedPrefixType: PrefixType | null;
}

export interface ParsedEntry {
  content: string;
  originalContent: string;
  prefixes: string[];
  timeFrames: string[];
} 