import { Position } from "@frontend/position.ts"
import { ASTNode }  from "@frontend/ast/ast.ts"

export class TType extends ASTNode {}

export class Identifier extends TType {
  public constructor(
    public name: string,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class Union extends TType {
  public constructor(
    public lhs: TType,
    public rhs: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class Intersection extends TType {
  public constructor(
    public lhs: TType,
    public rhs: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class Array extends TType {
  public constructor(
    public elementType: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class Function extends TType {
  public constructor(
    public signature: FunctionSignature,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}