// Grid tokens (hexword SPEC §3.1): how a square's content is written in a grid line.

import { tokenize } from "hexword";

const RESERVED = new Set(["|", "#", "_", ".", "["]);

/** The content of a token: "[ING]" -> "ING". */
export function tokenText(token: string): string {
  return token.startsWith("[") && token.endsWith("]") && token.length > 1 ? token.slice(1, -1) : token;
}

/** Whether text can be a square's content: no whitespace, and no "]" in a multi-character rebus. */
export function validContent(text: string): boolean {
  if (text === "" || /\s/u.test(text)) return false;
  const tokens = tokenize(text);
  return tokens.length === 1 || !text.includes("]");
}

/** The token for some content: "A" -> "A", "ING" -> "[ING]", "#" -> "[#]" (so it isn't read as a block). */
export function contentToken(text: string): string {
  if (!validContent(text)) throw new Error(`'${text}' can't be written in a grid square`);
  const tokens = tokenize(text);
  return tokens.length === 1 && tokens[0] === text && !RESERVED.has(text) ? text : `[${text}]`;
}
