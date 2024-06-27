import { LiteralObjectExpression, Expression } from "../ast/Expressions.ts";

export class File {
  public exports: LiteralObjectExpression<string, Expression>[]

  public constructor() {
    this.exports = [];
  }
}