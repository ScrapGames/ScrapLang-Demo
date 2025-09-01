import { Position } from "@frontend/position.ts"

export class ASTNode {
  public constructor(public start: Position, public end: Position) {}
}
