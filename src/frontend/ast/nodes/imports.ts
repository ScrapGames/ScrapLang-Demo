import { Position } from "@frontend/position.ts"
import { ASTNode } from "@frontend/ast/ast.ts"
import type { Maybe } from "@/typings.ts"

export class ImportMember extends ASTNode {
  public constructor(
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class ImportSymbol extends ImportMember {
  public constructor(
    public mod: Maybe<ImportMember>,
    public symbol: string,
    public alias: Maybe<string>,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class ImportList extends ImportMember {
  public constructor(
    public mod: Maybe<ImportMember>,
    public list: ImportMember[],
    start: Position, end: Position
  ) {
    super(start, end)
  }
}
