import { Cursorable } from "../utils/cursor.ts"

export default class LexerCursor implements Cursorable<string> {

  source: string
  currentTok: string
  pos: number

  public constructor(file: string) {
    this.source = file
    this.currentTok = this.source.at(0)!
    this.pos = 0
  }

  public consume(): string {
    return this.source[this.pos++]
  }

  public previous(): string {
    return this.source[this.pos - 2]
  }

  public next(): string {
    return this.source[this.pos]
  }

  public isEOF(): boolean {
    return this.pos === this.source.length || this.source[this.pos] === undefined
  }

  public get eofChar(): string {
    return this.source[this.source.length - 1]
  }
}
