import test from "node:test";
import assert from "node:assert/strict";
import { evaluate, parse } from "../src/parser.ts";

test("parser preserves multiplication precedence", () => assert.equal(evaluate(parse("2 + 3 * 4")), 14));
test("parser handles parentheses", () => assert.equal(evaluate(parse("(2 + 3) * 4")), 20));
test("parser makes subtraction left associative", () => assert.equal(evaluate(parse("9 - 3 - 2")), 4));
test("parser rejects a missing closing parenthesis", () => assert.throws(() => parse("(2 + 3"), /closing parenthesis/));
test("parser rejects trailing tokens", () => assert.throws(() => parse("2 3"), /trailing token/));
