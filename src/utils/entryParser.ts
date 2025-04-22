import { ParsedEntry } from '../types/entry';

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