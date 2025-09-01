import { Position } from "@frontend/position.ts"
import { Tokens }   from "@frontend/tokens/tokens.ts"
import { ASTNode }  from "@frontend/ast/ast.ts"

/**
 * Flags that can be applied to function declarations.
 */
export type FunctionFlags = | Tokens.INLINE | Tokens.ASYNC

export class Param extends ASTNode {
  public constructor(public name: string, start: Position, end: Position) {
    super(start, end)
  }
}