import { Maybe }    from "@/typings.ts"
import { Position } from "@frontend/position.ts"
import { Token }    from "@frontend/tokens/tokens.ts"
import { ASTNode }  from "@frontend/ast/ast.ts"
import { FunctionSignature } from "@frontend/ast/nodes/functions.ts"

export class TType extends ASTNode {}

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
    public signature: FunctionSignature,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}