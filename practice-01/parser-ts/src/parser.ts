/**
 * The parser — turns the lexer's tokens into a Select tree.
 *
 * This is a recursive-descent parser: one method per grammar rule, each
 * consuming the tokens it owns and returning the piece of tree it built.
 * `expect(type)` is the only place that fails, so every error in this file
 * carries the exact token and position it tripped on.
 *
 * Grammar handled:
 *
 *     select     := SELECT columns FROM IDENT
 *     columns    := STAR | IDENT (COMMA IDENT)*
 *     expression := IDENT EQ NUMBER
 */
import type { Comparison, Select } from "./ast.js";
import { unexpected } from "./errors.js";
import { tokenize, type Token, type TokenType } from "./lexer.js";

/** Parses one SELECT statement. Throws ParseException on anything else. */
export function parse(sql: string): Select {
  return new Parser(tokenize(sql)).parseSelect();
}

export class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  /** select := SELECT columns FROM IDENT */
  parseSelect(): Select {
    this.expect("SELECT");
    const columns = this.parseColumns();
    this.expect("FROM");
    const table = this.expect("IDENT").text;
    // The statement ends at the table name; whatever follows is a stray token.
    this.expect("EOF");
    return { columns, table };
  }

  /** columns := STAR | IDENT (COMMA IDENT)* */
  parseColumns(): string[] {
    if (this.peek().type === "STAR") {
      this.advance();
      return ["*"];
    }
    const columns = [this.expect("IDENT").text];
    while (this.peek().type === "COMMA") {
      this.advance();
      columns.push(this.expect("IDENT").text);
    }
    return columns;
  }

  /** expression := IDENT EQ NUMBER — e.g. `x = 1` → { column: "x", op: "=", value: 1 } */
  parseExpression(): Comparison {
    const column = this.expect("IDENT").text;
    this.expect("EQ");
    const value = Number(this.expect("NUMBER").text);
    return { column, op: "=", value };
  }

  // --- token plumbing -------------------------------------------------------

  /** The current token without consuming it. Past the end it stays on EOF. */
  private peek(): Token {
    const token = this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1];
    if (!token) throw new Error("lexer returned no tokens — it must always end with EOF");
    return token;
  }

  /** Consumes and returns the current token. */
  private advance(): Token {
    const token = this.peek();
    if (token.type !== "EOF") this.pos++;
    return token;
  }

  /** Consumes the current token if it has the given type; otherwise fails with its position. */
  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) throw unexpected(token.text, token.line, token.col);
    return this.advance();
  }
}
