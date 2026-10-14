import { tokenize, type Token } from "./tokenizer.ts";

export type Expression = { type: "number"; value: number }
  | { type: "binary"; operator: string; left: Expression; right: Expression };

/** Expression grammar only: this fixture does not implement SQL or the capstone. */
export function parse(source: string): Expression {
  const tokens = tokenize(source);
  let cursor = 0;
  const peek = (): Token | undefined => tokens[cursor];
  const atom = (): Expression => {
    const token = tokens[cursor++];
    if (!token) throw new SyntaxError("Expected a number or parenthesised expression");
    if (token.kind === "number") return { type: "number", value: Number(token.value) };
    if (token.value === "(") {
      const value = expression(0);
      if (tokens[cursor++]?.value !== ")") throw new SyntaxError("Expected closing parenthesis");
      return value;
    }
    throw new SyntaxError(`Expected a number at ${token.line}:${token.column}`);
  };
  const precedence = (operator: string): number => operator === "+" || operator === "-" ? 1 : operator === "*" || operator === "/" ? 2 : -1;
  const expression = (minimum: number): Expression => {
    let left = atom();
    while (peek()?.kind === "operator" && precedence(peek()!.value) >= minimum) {
      const operator = tokens[cursor++]!.value;
      const right = expression(precedence(operator) + 1);
      left = { type: "binary", operator, left, right };
    }
    return left;
  };
  const tree = expression(0);
  if (cursor !== tokens.length) throw new SyntaxError("Unexpected trailing token");
  return tree;
}

export function evaluate(tree: Expression): number {
  if (tree.type === "number") return tree.value;
  const left = evaluate(tree.left); const right = evaluate(tree.right);
  if (tree.operator === "+") return left + right;
  if (tree.operator === "-") return left - right;
  if (tree.operator === "*") return left * right;
  if (tree.operator === "/") return left / right;
  throw new Error("Unsupported expression operator");
}
