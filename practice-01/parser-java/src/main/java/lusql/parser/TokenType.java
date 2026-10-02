package lusql.parser;

/**
 * Every kind of token the lexer can produce.
 *
 * <p>Three keywords, two kinds of value, three bits of punctuation, and {@link #EOF} — a real
 * token for "the input ended", so the parser can {@code expect(EOF)} like any other token instead
 * of checking a list index.
 */
public enum TokenType {
    SELECT,
    FROM,
    WHERE,
    /** A name: a column or a table. */
    IDENT,
    /** An unsigned integer literal. */
    NUMBER,
    /** {@code *} — "all columns". */
    STAR,
    COMMA,
    /** {@code =} — the only comparison operator this grammar has. */
    EQ,
    /** End of input. Always the last token; the lexer appends exactly one. */
    EOF
}
