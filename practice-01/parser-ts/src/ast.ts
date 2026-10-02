/**
 * The abstract syntax tree — what the parser produces.
 *
 * A parser turns a flat string into a structure a program can act on. Ours
 * handles one statement shape, so the whole tree is two small interfaces.
 */

/** One comparison in a WHERE clause, e.g. `x = 1`. */
export interface Comparison {
  column: string;
  op: "=";
  value: number;
}

/** A parsed SELECT statement. */
export interface Select {
  /** `["*"]` for `SELECT *`, otherwise the column names in order. */
  columns: string[];
  table: string;
  /** Present only when the statement has a WHERE clause. */
  where?: Comparison;
}
