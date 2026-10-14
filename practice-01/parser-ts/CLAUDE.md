# parser-ts

A tiny SQL mini-parser in TypeScript: `SELECT <columns> FROM <table> [WHERE <column> = <number>]`.
It is the target project for the Practice 01 agents — not a real database.

- Run the tests with `npm test` (vitest; the supplied baseline has one failing WHERE test and four passing tests). Exit code 0 means green.
- Source lives in `src/` (`lexer.ts` → `parser.ts` → `ast.ts`; errors in `errors.ts`); tests live in `test/`.
- Only edit TypeScript source under `src/`. Never edit `test/`, package scripts, lockfiles or test configuration to make a result green.
- This is a disposable run copy; do not reset or delete earlier student evidence.
