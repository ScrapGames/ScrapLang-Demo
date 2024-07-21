import Lexer, { Token } from "@lexer/lexer.ts"
import { Cursor } from "@utils"

export default class ParserCursor extends Cursor<Token> {

  source: Token[]
  currentTok: Token
  pos: number

  public constructor(lexer: Lexer) {
    super()
    this.source = lexer.tokens()
    this.currentTok = this.source.at(0)!
    this.pos = 0
  }

  public consume(): Token {
    return this.source[this.pos++]
  }

  public previous(): Token {
    return this.source[this.pos - 2]
  }

  public next(): Token {
    return this.source[this.pos]
  }

  public isEOF(): boolean {
    return this.pos === this.source.length || this.source[this.pos] === undefined
  }

  public get eofChar(): Token {
    return this.source[this.source.length - 1]
  }
}