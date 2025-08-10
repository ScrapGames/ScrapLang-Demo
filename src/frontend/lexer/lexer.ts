/**
 * Lexer/Scanner prototype for ScrapLang
 * 
 * Lexer scan a file and reads his contents to get tokens that correspond to the tokens defined in the language syntax
 * For example, const, fn, enum... are keywords and Lexer identifies as such
 * 
 * If Lexer founds a keyword or another token that is invalid, will throw an error
 */

import { Position } from "@frontend/position.ts"
import { KEYWORD_MAP, Token, Tokens } from "@frontend/tokens/tokens.ts"

import { isAlpha, isNumeric, isAlphaNum, isSpace } from "@utils"
import { Collectable, Reader } from "@frontend/typings.ts"

export default class Lexer implements Collectable<Token>, Reader<string> {
  private file: Deno.FsFile
  
  private decoder: TextDecoder
  
  private buffer: Uint8Array
  
  private eof: boolean
  
  private position: Position

  currentTok: string

  private constructor(filePath: string) {
    this.position = new Position(0, 1, 0)
    this.buffer = new Uint8Array(1)
    this.decoder = new TextDecoder("utf8")
    this.file = Deno.openSync(filePath)
    this.eof = false
  }

  public static init(filePath: string) {
    const l = new this(filePath)
    l.next()

    return l
  }

  // ===== HELPER FUNCTIONS =====
  /**
   * Creates a new token based on `currentTok` value
   * @param tok Type of token for the new created token
   * @returns A new token based on `currentTok` value and type of token `tok`
   */
  private createToken(tok: Tokens, content?: string, advance: boolean = true) {
    const token = Token.createToken(tok, this.position, content)
    advance && this.next()

    return token
  }

  // ===== COLLETABLE FUNCTIONS =====
  collect(): Token[] {
    const tokens: Token[] = []
    while (!this.hasEnd())
      tokens.push(this.scan())

    return tokens
  }

  // ===== READER FUNCTIONS =====
  next(): string {
    return this.nextN(1)
  }

  nextN(n: number): string {
    // If the file has already been entirely readed
    // we save some resources from avoid
    // executing some functions for the same result
    if (this.hasEnd())
      return this.currentTok

    this.file.seekSync(n - 1, Deno.SeekMode.Current)
    this.eof = !this.file.readSync(this.buffer)

    if (!this.hasEnd()) {
      this.position.pos += n
      this.position.linePos += n
    }
    
    return (this.currentTok = this.decoder.decode(this.buffer))
  }

  ahead(): string {
    const prev = this.position.copy()
    const aheadTok = this.next()
    
    this.file.seekSync(-2, Deno.SeekMode.Current)
    this.position = prev
    this.next()
    return aheadTok
  }

  setTo(newPos: Position): void {
    this.position = newPos

    // Since every token creation advance the source once it has been scanned
    // we need to return an extra position
    this.file.seekSync(newPos.pos, Deno.SeekMode.Start)
  }

  check(maybe: string): boolean {
    return this.ahead() === maybe
  }

  hasEnd(): boolean {
    return this.eof
  }

  // ===== LEXER FUNCTIONS =====
  private consumeEOL() {
    const ahead = this.ahead()

    while ((this.currentTok === '\r' && ahead === '\n') || this.currentTok === '\r' || this.currentTok === '\n') {
      this.next()
      this.position.linePos = 1
      this.position.line++
    }
  }

  private scanText(quoteType: "\"" | "'" | "`") {
    this.next() // eats first quote
    let content = ""

    do {
      content += this.currentTok
    } while (this.next() !== quoteType)

    this.next() // eats closing quote
    return this.createToken(Tokens.STRING, content, false)
  }

  private scanIdentifier() {
    let content = ""

    do {
      content += this.currentTok
    } while (isAlphaNum(this.next()) && !this.hasEnd())

    return this.createToken(KEYWORD_MAP.get(content) ?? Tokens.IDENTIFIER, content, false)
  }

  private scanNumber() {
    let content = ""

    do {
      content += this.currentTok
    } while (isNumeric(this.next()) && !this.hasEnd())

    return this.createToken(Tokens.NUMBER, content, false)
  }

  private scanSlash() {
    // scan for line comments
    if (this.check('/'))
      while (this.next() !== '\n');

    // scan for line comments
    if (this.check('*')) {
      while (this.currentTok !== '*' && !this.check('/'))
        this.next()
    }

    return this.createToken(Tokens.SLASH)
  }

  private scanColon() {
    if (this.check(":")) {
      this.nextN(2)
      return this.createToken(Tokens.MOD_ACCESSOR)
    }

    return this.createToken(Tokens.COLON)
  }

  private scanEqual() {
    if (this.check("=")) {
      this.nextN(2)
      return this.createToken(Tokens.EQUALS)
    }

    return this.createToken(Tokens.EQUAL)
  }

  private scanDot() {
    if (this.check('.')) {
      this.nextN(2)
      if (this.check('.')) {
        this.nextN(2)
        return this.createToken(Tokens.SPREAD)
      }

      return this.createToken(Tokens.SLICE)
    }
    
    return this.createToken(Tokens.DOT)
  }

  private scanIncrement() {
    const isPlus = this.currentTok === '+'
    if (this.check(this.currentTok)) {
      this.nextN(2)
      return this.createToken(isPlus ? Tokens.INCREMENT : Tokens.DECREMENT)
    }

    return this.createToken(isPlus ? Tokens.PLUS : Tokens.MINUS)
  }

  private scanBang() {
    if (this.check("=") && this.nextN(2)) {
      return this.createToken(Tokens.NOT_EQUALS)
    }

    return this.createToken(Tokens.BANG)
  }

  private scanSingleChar() {
    switch (this.currentTok) {
      case '{':  return this.createToken(Tokens.LBRACE)
      case '}':  return this.createToken(Tokens.RBRACE)
      case '(':  return this.createToken(Tokens.LPAREN)
      case ')':  return this.createToken(Tokens.RPAREN)
      case '[':  return this.createToken(Tokens.LSQRBR)
      case ']':  return this.createToken(Tokens.RSQRBR)
      case ',':  return this.createToken(Tokens.COMMA)
      case ';':  return this.createToken(Tokens.SEMICOLON)
      case '&':  return this.createToken(Tokens.AMPER)
      case '?':  return this.createToken(Tokens.QUESTION)
      case '>':  return this.createToken(Tokens.GREATER)
      case '<':  return this.createToken(Tokens.LESS)
      case '*':  return this.createToken(Tokens.STAR)
      case '!':  return this.scanBang()
      case '+':
      case '-':  return this.scanIncrement()
      case '=':  return this.scanEqual()
      case '/':  return this.scanSlash()
      case ':':  return this.scanColon()
      case '.':  return this.scanDot()
      case '\'':
      case '`':
      case '"':  return this.scanText(this.currentTok as ("\"" | "'" | "`")) // SAFETY CASTING: The last switch cases match with these strings values
    }

    // if space is encountered
    // then calls to 'scan' again
    // to consume these spaces
    if (isSpace(this.currentTok))
      return this.scan()

    return this.createToken(Tokens.UNKNOWN)
  }

  public scan(): Token {
    // Avoding unexpected results and very probably infinite loops
    // we returns an EOF token if the lexer has ends of scan all the source
    if (this.hasEnd())
      return this.createToken(Tokens.EOF, "EOF")

    // eats spaces how many there are
    while (isSpace(this.currentTok))
      this.next()

    // consume as much as new lines there are until another token
    if (this.currentTok === '\r' || this.currentTok === '\n')
      this.consumeEOL()

    // Validation only with alphabetic characters
    // occurs because a variable or another recognizer, token, identifier, etc
    // can not start with a number, because a comparation between if a token is a number or an identifier will overlap
    // for example, var 1test = "test" is incorrect
    // the correct way to declare this variable would be: var test1 = "test"
    if (isAlpha(this.currentTok)) {
      return this.scanIdentifier()
    }

    if (isNumeric(this.currentTok))
      return this.scanNumber()

    const lastScan = this.scanSingleChar()
    return lastScan
  }

  public get Position(): Position {
    return this.position.copy()
  }

  [Symbol.dispose]() {
    this.file.close()
  }
}