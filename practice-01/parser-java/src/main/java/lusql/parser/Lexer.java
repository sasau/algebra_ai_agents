package lusql.parser;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Turns SQL text into a flat list of {@link Token}s.
 *
 * <p>Hand-written, one character at a time, because the whole grammar fits in a screen and a
 * generated lexer would be more code than the language. Three rules worth knowing:
 *
 * <ul>
 *   <li>Keywords are case-insensitive: {@code select}, {@code Select} and {@code SELECT} all lex to
 *       {@link TokenType#SELECT}. Any other word is an {@link TokenType#IDENT}.
 *   <li>Every token records the 1-based line and column where it <em>starts</em>. A newline bumps
 *       the line and resets the column to 1; any other whitespace just advances the column.
 *   <li>The list always ends with exactly one {@link TokenType#EOF} token, positioned just past
 *       the last character, so the parser can treat "end of input" like any other token.
 * </ul>
 */
public final class Lexer {

    /** Upper-cased keyword -> token type. Lookups upper-case the word first. */
    private static final Map<String, TokenType> KEYWORDS = Map.of(
            "SELECT", TokenType.SELECT,
            "FROM", TokenType.FROM,
            "WHERE", TokenType.WHERE);

    private final String src;
    private int pos = 0;  // index into src of the next unread char
    private int line = 1; // 1-based line of src[pos]
    private int col = 1;  // 1-based column of src[pos]

    public Lexer(String src) {
        this.src = src;
    }

    /** One-shot convenience: {@code Lexer.tokenize(sql)} instead of {@code new Lexer(sql).tokenize()}. */
    public static List<Token> tokenize(String src) {
        return new Lexer(src).tokenize();
    }

    /** Lexes the whole input. Throws {@link ParseException} on the first character it cannot place. */
    public List<Token> tokenize() {
        List<Token> out = new ArrayList<>();
        while (true) {
            skipWhitespace();
            if (pos >= src.length()) {
                // "<eof>" rather than "" so a message about it reads "unexpected token <EOF> at ..."
                out.add(new Token(TokenType.EOF, "<eof>", line, col));
                return out;
            }
            out.add(nextToken());
        }
    }

    /** Lexes exactly one token starting at src[pos]. Caller has already skipped whitespace. */
    private Token nextToken() {
        // Capture the start position BEFORE consuming anything: the token's reported
        // position is where it begins, not where the lexer stopped.
        int startLine = line;
        int startCol = col;
        char c = src.charAt(pos);

        // Single-character punctuation.
        if (c == '*') {
            advance();
            return new Token(TokenType.STAR, "*", startLine, startCol);
        }
        if (c == ',') {
            advance();
            return new Token(TokenType.COMMA, ",", startLine, startCol);
        }
        if (c == '=') {
            advance();
            return new Token(TokenType.EQ, "=", startLine, startCol);
        }

        // Numbers: a run of digits. No sign, no decimal point — the grammar does not need them.
        if (Character.isDigit(c)) {
            int start = pos;
            while (pos < src.length() && Character.isDigit(src.charAt(pos))) {
                advance();
            }
            return new Token(TokenType.NUMBER, src.substring(start, pos), startLine, startCol);
        }

        // Words: a letter or underscore, then letters, digits or underscores. A word is a
        // keyword if its upper-cased form is in KEYWORDS, otherwise an identifier.
        if (Character.isLetter(c) || c == '_') {
            int start = pos;
            while (pos < src.length() && isWordChar(src.charAt(pos))) {
                advance();
            }
            String word = src.substring(start, pos);
            TokenType type = KEYWORDS.getOrDefault(word.toUpperCase(Locale.ROOT), TokenType.IDENT);
            return new Token(type, word, startLine, startCol);
        }

        // Anything else is not in the language. Same message shape as the parser's errors.
        throw ParseException.unexpected(String.valueOf(c), startLine, startCol);
    }

    private static boolean isWordChar(char c) {
        return Character.isLetterOrDigit(c) || c == '_';
    }

    private void skipWhitespace() {
        while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) {
            advance();
        }
    }

    /** Consumes one character, keeping line and col honest. All position tracking lives here. */
    private void advance() {
        if (src.charAt(pos) == '\n') {
            line++;
            col = 1;
        } else {
            col++;
        }
        pos++;
    }
}
