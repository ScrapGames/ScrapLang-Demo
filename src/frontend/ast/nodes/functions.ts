import { Maybe }    from "@/typings.ts"
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

export class FunctionSignature extends ASTNode {
  public constructor(
    public flag:      Maybe<FunctionFlags>,
    public name:      Maybe<string>,
    public generics:  Maybe<string[]>,
    public params:    Param[],
    public ret:       Maybe<TType>,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}