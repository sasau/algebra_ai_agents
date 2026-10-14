import test from "node:test";
import assert from "node:assert/strict";
import { tokenize } from "../src/tokenizer.ts";

test("tokenizer recognises numbers and arithmetic operators", () => {
  assert.deepEqual(tokenize("12 + 3.5").map(({ kind, value }) => ({ kind, value })), [
    { kind: "number", value: "12" }, { kind: "operator", value: "+" }, { kind: "number", value: "3.5" },
  ]);
});
test("tokenizer tracks LF line endings", () => {
  assert.deepEqual(tokenize("1\n+ 2")[1], { kind: "operator", value: "+", line: 2, column: 1 });
});
test("tokenizer normalises CRLF line endings", () => {
  // Exactly this test is expected to fail before the optional LAB-101 repair.
  assert.deepEqual(tokenize("1\r\n+ 2"), tokenize("1\n+ 2"));
});
test("tokenizer rejects an unsupported character", () => {
  assert.throws(() => tokenize("1 @ 2"), /Unexpected character/);
});
