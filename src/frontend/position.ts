/**
 * Represents token position in the source
 */
export class Position {
  idx: number
  line: number
  lineIdx: number

  public constructor(idx: number, line: number, lineIdx: number) {
    this.idx     = idx
    this.line    = line
    this.lineIdx = lineIdx
  }

  public setTo(n: number): Position {
    this.idx = n
    this.lineIdx = n

    return this
  }

  public copy(): Position {
    return new Position(this.idx, this.line, this.lineIdx)
  }

}
