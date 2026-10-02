package lusql.parser;

import static lusql.parser.TokenType.EOF;
import static lusql.parser.TokenType.FROM;
import static lusql.parser.TokenType.IDENT;
import static lusql.parser.TokenType.SELECT;
import static lusql.parser.TokenType.STAR;
import static lusql.parser.TokenType.WHERE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;

/** The lexer's contract. All of these pass as shipped. */
class LexerTest {

    @Test
    void keywordsAreCaseInsensitive() {
        List<Token> tokens = Lexer.tokenize("select * From T");

        assertEquals(List.of(SELECT, STAR, FROM, IDENT, EOF), tokens.stream().map(Token::type).toList());
        // The text is kept as typed; only the classification is case-insensitive.
        assertEquals("select", tokens.get(0).text());
        assertEquals("T", tokens.get(3).text());
    }

    @Test
    void tracksLineAndColumn() {
        // Pins the position the lecture's running example reports: WHERE starts at column 17.
        List<Token> tokens = Lexer.tokenize("SELECT * FROM t WHERE x = 1");
        Token where = tokens.get(4);
        assertEquals(WHERE, where.type());
        assertEquals(1, where.line());
        assertEquals(17, where.col());

        // A newline bumps the line and resets the column.
        Token from = Lexer.tokenize("SELECT *\nFROM t").get(2);
        assertEquals(FROM, from.type());
        assertEquals(2, from.line());
        assertEquals(1, from.col());
    }

    @Test
    void rejectsCharactersOutsideTheLanguage() {
        ParseException e = assertThrows(ParseException.class, () -> Lexer.tokenize("SELECT ; FROM t"));

        assertEquals("unexpected token ; at 1:8", e.getMessage());
        assertEquals(1, e.line());
        assertEquals(8, e.col());
    }
}
