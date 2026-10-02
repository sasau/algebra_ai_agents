package lusql.parser;

import static lusql.parser.TokenType.COMMA;
import static lusql.parser.TokenType.EOF;
import static lusql.parser.TokenType.EQ;
import static lusql.parser.TokenType.FROM;
import static lusql.parser.TokenType.IDENT;
import static lusql.parser.TokenType.NUMBER;
import static lusql.parser.TokenType.SELECT;
import static lusql.parser.TokenType.STAR;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * A recursive-descent parser for one statement shape.
 *
 * <pre>
 *   select     := SELECT columns FROM IDENT [ WHERE expression ] EOF
 *   columns    := STAR | IDENT { COMMA IDENT }
 *   expression := IDENT EQ NUMBER
 * </pre>
 *
 * <p>Each grammar rule is one method; each method consumes the tokens it owns and returns the AST
 * node it built. {@link #expect(TokenType)} is the only place a wrong token becomes an error, which
 * is why every parse error reads {@code unexpected token X at line:col}.
 */
public final class Parser {

    private final List<Token> tokens;
    private int pos = 0;

    public Parser(List<Token> tokens) {
        this.tokens = tokens;
    }

    /** Lex and parse in one call: {@code Parser.parse("SELECT * FROM t")}. */
    public static Select parse(String sql) {
        return new Parser(Lexer.tokenize(sql)).parseSelect();
    }

    /** select := SELECT columns FROM IDENT ... EOF */
    public Select parseSelect() {
        expect(SELECT);
        List<String> columns = parseColumns();
        expect(FROM);
        String table = expect(IDENT).text();
        // After FROM <table> the statement ends.
        expect(EOF);
        return new Select(columns, table, Optional.empty());
    }

    /** columns := STAR | IDENT { COMMA IDENT } */
    private List<String> parseColumns() {
        List<String> columns = new ArrayList<>();
        if (peek().type() == STAR) {
            columns.add(advance().text());
            return columns;
        }
        columns.add(expect(IDENT).text());
        while (peek().type() == COMMA) {
            advance();
            columns.add(expect(IDENT).text());
        }
        return columns;
    }

    /** expression := IDENT EQ NUMBER — the one comparison this grammar knows. */
    public Expr parseExpression() {
        Token column = expect(IDENT);
        Token op = expect(EQ);
        Token value = expect(NUMBER);
        return new Expr.Comparison(column.text(), op.text(), value.text());
    }

    // ---- token-stream helpers -------------------------------------------------------------

    /** The next unread token, without consuming it. */
    private Token peek() {
        return tokens.get(pos);
    }

    /** Consumes and returns the next token. Never moves past EOF, so peek() is always safe. */
    private Token advance() {
        Token token = tokens.get(pos);
        if (token.type() != EOF) {
            pos++;
        }
        return token;
    }

    /** Consumes the next token if it has the given type; otherwise throws with its position. */
    private Token expect(TokenType type) {
        Token token = peek();
        if (token.type() != type) {
            throw ParseException.unexpected(token);
        }
        return advance();
    }
}
