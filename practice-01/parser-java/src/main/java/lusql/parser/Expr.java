package lusql.parser;

/**
 * An expression in a {@code WHERE} clause.
 *
 * <p>Sealed, so the compiler knows every kind of expression there is and a {@code switch} over an
 * {@code Expr} can be exhaustive without a {@code default}. Today there is exactly one kind.
 */
public sealed interface Expr {

    /**
     * {@code column op value}, e.g. {@code x = 1}. The operator is kept as text so that adding
     * {@code <} or {@code <>} later is a lexer change, not an AST change.
     */
    record Comparison(String column, String op, String value) implements Expr {}
}
