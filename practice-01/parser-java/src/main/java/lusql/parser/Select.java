package lusql.parser;

import java.util.List;
import java.util.Optional;

/**
 * The parsed form of a {@code SELECT} statement — the whole AST this parser produces.
 *
 * @param columns the projection: {@code ["*"]} for {@code SELECT *}, otherwise the column names
 *     in order
 * @param table the single table in the {@code FROM} clause
 * @param where the {@code WHERE} expression, or {@link Optional#empty()} when the statement has
 *     no {@code WHERE} clause
 */
public record Select(List<String> columns, String table, Optional<Expr> where) {

    /** Defensive copy so a caller cannot mutate the AST through the list it passed in. */
    public Select {
        columns = List.copyOf(columns);
    }
}
