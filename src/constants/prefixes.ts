export type PrefixType = 'person' | 'action' | 'idea' | 'tag';
export type PrefixSymbol = '@' | '!' | '?' | '#';

export const PREFIXES: Record<PrefixType, { symbol: PrefixSymbol; description: string }> = {
  person: { symbol: '@', description: 'person' },
  action: { symbol: '!', description: 'action' },
  idea: { symbol: '?', description: 'idea' },
  tag: { symbol: '#', description: 'tag' }
};

export const SYMBOL_TO_TYPE: Record<PrefixSymbol, PrefixType> = {
  '@': 'person',
  '!': 'action',
  '?': 'idea',
  '#': 'tag'
};

export const TYPE_TO_SYMBOL: Record<PrefixType, PrefixSymbol> = {
  person: '@',
  action: '!',
  idea: '?',
  tag: '#'
};

export function getPrefixType(symbol: PrefixSymbol): PrefixType {
  return SYMBOL_TO_TYPE[symbol];
}

export function getPrefixSymbol(type: PrefixType): PrefixSymbol {
  return TYPE_TO_SYMBOL[type];
}

export function isValidPrefix(symbol: string): symbol is PrefixSymbol {
  return symbol in SYMBOL_TO_TYPE;
}

export function getPrefixDescription(type: PrefixType): string {
  return PREFIXES[type].description;
} 