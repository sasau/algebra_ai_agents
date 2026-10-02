import { describe, expect, it } from "vitest";
import { parse } from "../src/parser.js";

describe("parse", () => {
  it("parses SELECT * FROM t", () => {
    expect(parse("SELECT * FROM t")).toEqual({ columns: ["*"], table: "t" });
  });

  it("parses a WHERE clause", () => {
    expect(parse("SELECT * FROM t WHERE x = 1")).toEqual({
      columns: ["*"],
      table: "t",
      where: { column: "x", op: "=", value: 1 },
    });
  });
});
