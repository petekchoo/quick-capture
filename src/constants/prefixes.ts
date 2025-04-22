export type PrefixType = '@' | '!' | '?' | '#';

export interface PrefixDefinition {
  type: PrefixType;
  description: string;
}

export const PREFIXES: Record<string, PrefixDefinition> = {
  '@': { type: '@', description: 'person' },
  '!': { type: '!', description: 'action' },
  '?': { type: '?', description: 'idea' },
  '#': { type: '#', description: 'tag' }
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