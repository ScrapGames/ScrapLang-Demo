import { Position } from "@frontend/position.ts"
import { Tokens }   from "@frontend/tokens/tokens.ts"
import { ASTNode }  from "@frontend/ast/index.ts"
import { TType }    from "@frontend/ast/nodes/types.ts"

/**
 * Flags that can be applied to function declarations.
 */
export type FunctionFlags = | Tokens.INLINE | Tokens.ASYNC

export class Param extends ASTNode {
  public constructor(public name: string, public type: TType, start: Position, end: Position) {
    super(start, end)
  }
}

export interface FunctionSignature {
  flag?:     FunctionFlags,
  name?:     string
  generics?: string[]
  params:    Param[]
  ret?:      TType,
  start:     Position,
  end:       Position
}