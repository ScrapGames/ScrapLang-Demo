import { ASTNode } from "@frontend/ast/ast.ts"
import type { Position } from "@frontend/typings.ts"
import { Expression } from "@frontend/ast/nodes/expressions.ts"

export enum StatementKind {
  Return,
  Export,
  Import,
  If,
  For,
  ForIn,
  ForOf,
  While,
  DoWhile
}

export class Statement extends ASTNode {
  public kind: StatementKind

  public constructor(kind: StatementKind, position: Position) {
    super(position)
    this.kind = kind
  }
}

export class Return extends Statement {
  private value: Expression

  public constructor(value: Expression, position: Position) {
    super(StatementKind.Return, position)
    this.value = value
  }

  public get Value() { return this.value }
}
