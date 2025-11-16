import { Position } from "@frontend/position.ts"

export class ASTNode {
  public start: Position
  public end:   Position

  public constructor(start: Position, end: Position) {
    this.start = start
    this.end   = end
  }
}

export class AST {
  public body: ASTNode[]

  public constructor(body: Iterable<ASTNode>) {
    this.body = Array.from(body)
  }
}