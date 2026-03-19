import type { Maybe } from "@/typings.ts"
import { Position }   from "@frontend/position.ts"
import { TType }      from "@frontend/ast/types.ts"

export class ASTNode {
  public start: Position
  public end:   Position

  public constructor(start: Position, end: Position) {
    this.start = start
    this.end   = end
  }
}

export class FunctionParam extends ASTNode {
  public constructor(
    public name: string,
    public type: Maybe<TType>, // the data type may not appear if the parameter is the `this` parameter
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class RestFunctionParam extends FunctionParam {
  public constructor(
    name: string,
    type: TType,
    start: Position, end: Position
  ) {
    super(name, type, start, end)
  }
}

/**
 * Shorthand type for `Param[]`
 */
export type FunctionParamList = FunctionParam[]

export class AST {
  public body: ASTNode[]

  public constructor(body: Iterable<ASTNode>) {
    this.body = Array.from(body)
  }
}
