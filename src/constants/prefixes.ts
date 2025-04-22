export type PrefixType = '@' | '!' | '?' | '#';

export interface PrefixDefinition {
  type: PrefixType;
  description: string;
  symbol: string;
}

export const PREFIXES: Record<string, PrefixDefinition> = {
  '@': { type: '@', description: 'person', symbol: '@' },
  '!': { type: '!', description: 'action', symbol: '!' },
  '?': { type: '?', description: 'idea', symbol: '?' },
  '#': { type: '#', description: 'tag', symbol: '#' }
};

export const getPrefixType = (symbol: string): PrefixType | null => {
  return PREFIXES[symbol]?.type || null;
};

export const isValidPrefix = (symbol: string): boolean => {
  return symbol in PREFIXES;
};

export function getPrefixDescription(symbol: string): string {
  return PREFIXES[symbol]?.description || '';
} 