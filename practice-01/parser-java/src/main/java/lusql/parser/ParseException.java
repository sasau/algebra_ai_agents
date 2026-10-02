package lusql.parser;

import java.util.Locale;

/**
 * Thrown by the {@link Lexer} and the {@link Parser} when the input does not fit the grammar.
 *
 * <p>Unchecked on purpose: a parse error is not something a caller can recover from mid-parse, and
 * forcing {@code throws} onto every recursive-descent method would bury the grammar in plumbing.
 *
 * <p>The message text is built in <b>one</b> place, {@link #unexpected(String, int, int)}, so that
 * every error reads the same way — {@code unexpected token WHERE at 1:17} — whether it came from
 * the lexer or the parser. Tests, the workflow script and the lecture slides all quote that exact
 * shape; if it ever changes, it changes here.
 */
public final class ParseException extends RuntimeException {

    private final int line;
    private final int col;

    private ParseException(String message, int line, int col) {
        super(message);
        this.line = line;
        this.col = col;
    }

    /**
     * The one helper that formats a message: {@code unexpected token <TEXT> at <line>:<col>}.
     * The text is upper-cased so {@code where} and {@code WHERE} produce the same error.
     */
    public static ParseException unexpected(String text, int line, int col) {
        String message = "unexpected token " + text.toUpperCase(Locale.ROOT) + " at " + line + ":" + col;
        return new ParseException(message, line, col);
    }

    /** Convenience for the parser, which always has a whole token in hand. */
    public static ParseException unexpected(Token token) {
        return unexpected(token.text(), token.line(), token.col());
    }

    /** 1-based line of the offending token. */
    public int line() {
        return line;
    }

    /** 1-based column of the offending token. */
    public int col() {
        return col;
    }
}
