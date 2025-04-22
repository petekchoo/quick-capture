export type PrefixType = '@' | '!' | '?' | '#';

export interface TextSegment {
  type: 'text' | 'prefix';
  content: string;
  prefixType?: PrefixType;
  start: number;
  end: number;
}

export interface EntryState {
  content: string;
  currentPrefix: PrefixType | null;
  selectedPrefixes: string[];
  isPrefixOverlayOpen: boolean;
  prefixSuggestions: string[];
  prefixInput: string;
}

export interface ParsedEntry {
  content: string;
  originalContent: string;
  prefixes: string[];
  timeFrames: string[];
} 