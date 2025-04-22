import type { PrefixType } from '../types/database';
import { ParsedEntry } from '../types/entry';

const PREFIX_PATTERNS: Record<PrefixType, RegExp> = {
  person: /@([a-zA-Z0-9-]+)/g,
  action: /!([a-zA-Z0-9-]+)/g,
  idea: /\?([a-zA-Z0-9-]+)/g,
  tag: /#([a-zA-Z0-9-]+)/g,
};

const TIME_PATTERNS = [
  // Today, tomorrow, yesterday
  /(today|tomorrow|yesterday)/i,
  // This/next/last week/month/year
  /(this|next|last)\s+(week|month|year)/i,
  // Specific dates (MM/DD/YYYY or YYYY-MM-DD)
  /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})/,
  // Relative time (in X days/weeks/months/years)
  /in\s+(\d+)\s+(day|week|month|year)s?/i,
];

export function parseEntry(content: string): ParsedEntry {
  const prefixes: string[] = [];
  let originalContent = content;

  // Extract prefixes using bracket syntax
  const prefixRegex = /\[([@!?#])([^\]]+)\]/g;
  let match;
  while ((match = prefixRegex.exec(content)) !== null) {
    const [fullMatch] = match;
    // Store the full prefix with brackets
    prefixes.push(fullMatch);
  }

  return {
    content: originalContent,
    originalContent,
    prefixes,
    timeFrames: []
  };
} 