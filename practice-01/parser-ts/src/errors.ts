/**
 * The one error type the lexer and parser throw.
 *
 * `name` is set explicitly so that `String(err)` — and therefore a test
 * runner's failure line — reads `ParseException: unexpected token WHERE at 1:17`
 * rather than `Error: …`. The message is built in exactly one place
 * (`unexpected`, below) so its wording cannot drift between call sites.
 */
export class ParseException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseException";
  }
}

/**
 * Builds the standard "unexpected token" error.
 *
 * The token text is upper-cased so the message is stable however the user
 * typed the keyword; line and column are 1-based, like every editor's status
 * bar, so the position can be found by eye.
 */
export function unexpected(text: string, line: number, col: number): ParseException {
  return new ParseException(`unexpected token ${text.toUpperCase()} at ${line}:${col}`);
}
