import { Undefinedable } from "@/typings.ts"
import { Position }      from "@frontend/position.ts"
import { Tokens }        from "@frontend/tokens/tokens.ts"
import { ASTNode }       from "@frontend/ast/ast.ts"
import { TType }         from "@frontend/ast/nodes/types.ts"
import { Statement }     from "@frontend/ast/nodes/statements.ts"

/**
 * Interface representing common fields to both declarations and expressions.
 */
export interface Function {
  name: string, params: Param[],
  body: Statement[], flag: Undefinedable<FunctionFlags>
}

/**
 * Flags that can be applied to function declarations.
 */
export type FunctionFlags = | Tokens.INLINE | Tokens.ASYNC

export class Param extends ASTNode {
  public constructor(public name: string, public type: TType, start: Position, end: Position) {
    super(start, end)
  }
}