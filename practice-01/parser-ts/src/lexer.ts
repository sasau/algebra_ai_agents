/**
 * The lexer — turns a SQL string into a flat list of tokens.
 *
 * Why a separate step: the parser's job is grammar (what may follow what),
 * and it is far simpler when it reasons about tokens like SELECT or IDENT
 * than about raw characters, spaces and case. So the lexer handles the
 * characters, and the parser never sees them.
 *
 * Every token records where it started (1-based line and column) so that an
 * error can say exactly where it happened.
 */
import { unexpected } from "./errors.js";

export type TokenType =
  | "SELECT"
  | "FROM"
  | "WHERE" // keywords — matched case-insensitively
  | "IDENT"
  | "NUMBER" // values
  | "STAR"
  | "COMMA"
  | "EQ" // punctuation: `*`  `,`  `=`
  | "EOF"; // always the last token, so the parser can ask "is the input over?"

export interface Token {
  type: TokenType;
  /** The characters as written. Keywords keep the user's case; EOF is `<EOF>`. */
  text: string;
  /** 1-based line of the token's first character. */
  line: number;
  /** 1-based column of the token's first character. */
  col: number;
}

/** Words that are keywords, however they are capitalised. Anything else is an IDENT. */
const KEYWORDS: Record<string, TokenType> = {
  SELECT: "SELECT",
  FROM: "FROM",
  WHERE: "WHERE",
};

const isLetter = (ch: string): boolean => /^[A-Za-z_]$/.test(ch);
const isDigit = (ch: string): boolean => /^[0-9]$/.test(ch);
const isIdentChar = (ch: string): boolean => isLetter(ch) || isDigit(ch);

/**
 * Tokenizes `sql`. Throws ParseException on a character it does not know.
 *
 * `charAt` is used instead of indexing because it returns "" past the end of
 * the string, which keeps the loop free of undefined checks.
 */
export function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < sql.length) {
    const ch = sql.charAt(i);

    // --- whitespace: skip, but keep the position bookkeeping honest ---------
    if (ch === "\n") {
      i++;
      line++;
      col = 1;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r") {
      i++;
      col++;
      continue;
    }

    // --- words: a keyword if it is one, otherwise an identifier ------------
    if (isLetter(ch)) {
      let j = i;
      while (j < sql.length && isIdentChar(sql.charAt(j))) j++;
      const text = sql.slice(i, j);
      tokens.push({ type: KEYWORDS[text.toUpperCase()] ?? "IDENT", text, line, col });
      col += j - i;
      i = j;
      continue;
    }

    // --- numbers: digits only; this parser has no decimals or strings -------
    if (isDigit(ch)) {
      let j = i;
      while (j < sql.length && isDigit(sql.charAt(j))) j++;
      tokens.push({ type: "NUMBER", text: sql.slice(i, j), line, col });
      col += j - i;
      i = j;
      continue;
    }

    // --- single-character punctuation --------------------------------------
    const punct: Record<string, TokenType> = { "*": "STAR", ",": "COMMA", "=": "EQ" };
    const type = punct[ch];
    if (type) {
      tokens.push({ type, text: ch, line, col });
      i++;
      col++;
      continue;
    }

    throw unexpected(ch, line, col);
  }

  tokens.push({ type: "EOF", text: "<EOF>", line, col });
  return tokens;
}
