import { describe, expect, it } from "vitest";
import { tokenize } from "../src/lexer.js";

describe("tokenize", () => {
  it("recognises keywords regardless of case", () => {
    const types = tokenize("select * from T").map((t) => t.type);
    expect(types).toEqual(["SELECT", "STAR", "FROM", "IDENT", "EOF"]);
  });

  it("records the 1-based line and column of every token", () => {
    const where = tokenize("SELECT * FROM t WHERE x = 1").find((t) => t.type === "WHERE");
    expect(where).toMatchObject({ text: "WHERE", line: 1, col: 17 });
  });

  it("rejects a character it does not know", () => {
    expect(() => tokenize("SELECT ; FROM t")).toThrow("unexpected token ; at 1:8");
  });
});
