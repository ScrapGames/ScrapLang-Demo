import { Cursorable } from "../utils/cursor.ts"
import Lexer, { Token } from "../lexer/lexer.ts"

export default class ParserCursor implements Cursorable<Token> {

  source: Token[]
  currentTok: Token
  pos: number

  public constructor(lexer: Lexer) {
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