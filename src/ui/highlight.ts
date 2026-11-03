/**
 * Colours for the live code, without a library: the snippet split into comments, stock Gibber constructors
 * (keywords), numbers and the rest. Pure, so it is tested without a page.
 */
import { STOCK_NAMES } from '../synth/snippet';

export interface Token {
  kind: 'keyword' | 'number' | 'comment' | 'plain';
  text: string;
}

// A comment runs to the end of its line. Word boundaries keep the digits of a name like Filter24Moog out of the numbers.
const TOKEN = new RegExp(`(//.*)|\\b(${STOCK_NAMES.join('|')})\\b|\\b(\\d+(?:\\.\\d+)?)\\b`, 'g');

/** The code as tokens that, joined, give back every character in order. */
export function highlight(code: string): Token[] {
  const tokens: Token[] = [];
  let end = 0;
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > end) tokens.push({ kind: 'plain', text: code.slice(end, m.index) });
    tokens.push({ kind: m[1] !== undefined ? 'comment' : m[2] !== undefined ? 'keyword' : 'number', text: m[0] });
    end = m.index + m[0].length;
  }
  if (end < code.length) tokens.push({ kind: 'plain', text: code.slice(end) });
  return tokens;
}
