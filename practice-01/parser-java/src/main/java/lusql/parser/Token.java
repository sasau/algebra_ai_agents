package lusql.parser;

/**
 * One token: its kind, the exact text it was lexed from, and where it started.
 *
 * <p>{@code line} and {@code col} are both <b>1-based</b>, because that is how editors count and
 * how students will read an error like {@code unexpected token WHERE at 1:17}. The text is kept
 * as typed ({@code where}, not {@code WHERE}) so error messages can show what the user wrote.
 */
public record Token(TokenType type, String text, int line, int col) {}
