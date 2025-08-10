/**
 * Represents token position in the source
 */
export class Position {
  pos: number
  line: number
  linePos: number

  public constructor(pos: number, line: number, linePos: number) {
    this.pos     = pos
    this.line    = line
    this.linePos = linePos
  }

  public copy(): Position {
    return new Position(this.pos, this.line, this.linePos)
  }

}
