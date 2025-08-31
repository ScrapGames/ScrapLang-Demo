import { ASTNode } from "@frontend/ast/ast.ts"
import { Position } from "@frontend/position.ts"

export class Param extends ASTNode {
  public constructor(public name: string, start: Position, end: Position) {
    super(start, end)
  }
}