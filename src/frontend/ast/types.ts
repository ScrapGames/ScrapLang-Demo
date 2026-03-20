import { Maybe }     from "@/typings.ts"
import { Position }  from "@/position.ts"
import { Token }     from "@frontend/tokens/tokens.ts"
import { ASTNode }   from "@frontend/ast/commons.ts"
import { FunctionParamList } from "@frontend/ast/commons.ts"

export class TType extends ASTNode {
  public constructor(
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class Generic extends ASTNode {
  public constructor(
    public name: string,
    public constraint: Maybe<TType>,
    public value: Maybe<TType>,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

/**
 * Shorthand type for `Generic[]`
 */
export type GenericList = Generic[]

export class TBinary extends TType {
  public constructor(
    public op: Token,
    public lhs: TType,
    public rhs: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class TIdentifier extends TType {
  public constructor(
    public generics: Maybe<TType[]>,
    public name: string,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class TArray extends TType {
  public constructor(
    public type: TType,
    public size: Maybe<number>,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class TFunction extends TType {
  public constructor(
    public params: FunctionParamList,
    public ret: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}