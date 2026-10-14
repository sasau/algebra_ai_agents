export type Token = { kind: "number" | "operator" | "paren"; value: string; line: number; column: number };

/** A deliberately small arithmetic tokenizer. Ticket LAB-101 describes one bug. */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let column = 1;
  let offset = 0;
  while (offset < source.length) {
    const char = source[offset]!;
    if (char === " " || char === "\t") { offset += 1; column += 1; continue; }
    // Seeded bug: LF is handled, but the CR in a Windows CRLF pair is rejected.
    if (char === "\n") { offset += 1; line += 1; column = 1; continue; }
    const number = source.slice(offset).match(/^\d+(?:\.\d+)?/);
    if (number) {
      tokens.push({ kind: "number", value: number[0], line, column });
      offset += number[0].length; column += number[0].length; continue;
    }
    if ("+-*/".includes(char)) tokens.push({ kind: "operator", value: char, line, column });
    else if ("()".includes(char)) tokens.push({ kind: "paren", value: char, line, column });
    else throw new SyntaxError(`Unexpected character ${JSON.stringify(char)} at ${line}:${column}`);
    offset += 1; column += 1;
  }
  return tokens;
}
