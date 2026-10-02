# parser-ts

A tiny SQL mini-parser in TypeScript: `SELECT <columns> FROM <table> [WHERE <column> = <number>]`.
It is the target project for the Practice 01 agents — not a real database.

- Run the tests with `npm test` (vitest, one pass, about 2 seconds). Exit code 0 means green.
- Source lives in `src/` (`lexer.ts` → `parser.ts` → `ast.ts`; errors in `errors.ts`); tests live in `test/`.
- Never edit anything under `test/`; fix the source so the tests pass.
