/**
 * Lexer/Scanner prototype for ScrapLang
 * 
 * Lexer scan a file and reads his contents to get tokens that correspond to the tokens defined in the language syntax
 * For example, const, fn, enum... are keywords and Lexer identifies as such
 * 
 * If Lexer founds a keyword or another token that is invalid, will throw an error
 */

import { Position } from "@frontend/position.ts"
import { KEYWORD_MAP, RTOKEN_MAP, Token, Tokens } from "@frontend/tokens/tokens.ts"

import { isAlpha, isNumeric, isAlphaNum, isSpace } from "@utils"
import { Collectable, Reader } from "@frontend/typings.ts"

enum ScanMode {
  Advance,
  Check
}

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
    l.next() // Gives the first character as initial value to `currenTok`

    return l
  }

  // ===== HELPER FUNCTIONS =====
  /**
   * Creates a new token based on `currentTok` value
   * @param tok Type of token for the new created token
   * @returns A new token based on `currentTok` value and type of token `tok`
   */
  private createToken(
    tok: Tokens,
    opts: Partial<{ content: string, pos: Position, advance: boolean }> = { advance: true }
  ): Token {
    const t = Token.createToken(tok, opts?.pos ?? this.Position, opts?.content);

    if (opts?.advance && this.next())
      return t

    return t
  }

  private createTokenFromStr(content: string, opts?: Partial<{ pos: Position, advance: boolean }>) {
    const type = RTOKEN_MAP.get(content)
    if (!type)
      return Token.createToken(Tokens.UNKNOWN, this.Position, content)

    return this.createToken(type, opts)
  }

  /**
   * Simulation of C++ istream method
   * @returns The current position in the source
   */
  private tellg(): number {
    return this.file.seekSync(0, Deno.SeekMode.Current)
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
    return this.moveN(1)
  }

  /**
   * Advance n positions in the source
   * 
   * NOTE: `n` must be passed in a human readable format. For example: to get the first character, `n` would be 1.
   * For more info, visit: https://...
   * @param n Human readable positions the within file pointer will move, either forward or backward (signed number)
   * @returns The next token in the target source (`file` property)
   */
  moveN(n: number, mode: ScanMode = ScanMode.Advance): string {
    if (this.tellg() === 0 && n < 0 || n < -this.position.idx)
      throw new Error("Any backward operation will cause the program to crash because the file pointer is at the beginning")

    // If the file has already been entirely readed
    // we save some resources from avoid
    // executing some functions for the same result
    if (this.hasEnd())
      return this.currentTok

    this.file.seekSync(n > 0 ? n - 1 : n, Deno.SeekMode.Current)
    const bytes = this.file.readSync(this.buffer)

    if (mode === ScanMode.Check) {
      this.file.seekSync(-n, Deno.SeekMode.Current)
      return this.decoder.decode(this.buffer)
    }

    this.eof = !bytes
    if (!this.hasEnd())
      this.position.setTo(this.tellg())

    return (this.currentTok = this.decoder.decode(this.buffer))
  }

  ahead(): string {
    return this.moveN(1, ScanMode.Check)
  }

  check(maybe: string): boolean {
    return this.ahead() === maybe
  }

  hasEnd(): boolean {
    return this.eof
  }

  // ===== LEXER FUNCTIONS =====
  private consumeEOL() {
    while (this.currentTok === '\r' || this.currentTok === '\n') {
      this.check('\n') ? this.moveN(2) : this.next()
      this.position.lineIdx = 1
      this.position.line++
    }
  }

  private scanText(quoteType: "\"" | "'" | "`") {
    const pos = this.Position
    let content = ""
    this.next() // eats open quote

    do {
      content += this.currentTok
    } while (this.next() !== quoteType)

    this.next() // eats closing quote
    const type = quoteType === "'" ? Tokens.CHAR : Tokens.STRING
    return this.createToken(type, { content, pos })
  }

  private scanIdentifier() {
    const pos = this.Position
    let content = ""

    do {
      content += this.currentTok
    } while (isAlphaNum(this.next()) && !this.hasEnd())

    const type = KEYWORD_MAP.get(content) ?? Tokens.IDENTIFIER
    return this.createToken(type, { content, pos, advance: false })
  }

  private scanNumber() {
    const pos = this.Position
    let content = ""

    do {
      content += this.currentTok
    } while (isNumeric(this.next()) && !this.hasEnd())

    return this.createToken(Tokens.NUMBER, { content, pos, advance: false })
  }

  private scanSlash() {
    // scan for line comments
    if (this.check('/')) {
      do {
        this.next()
      // @ts-ignore: the comparison wont overlap, because `next` call changes `currentTok` value
      } while (this.currentTok !== '\r' || this.currentTok !== '\n');
    }

    // scan for line comments
    if (this.check('*')) {
      while (this.currentTok !== '*' && !this.check('/'))
        this.next()
    }

    return this.createToken(Tokens.SLASH)
  }

  private scanColon() {
    if (this.check(":") && this.moveN(1))
      return this.createToken(Tokens.MOD_ACCESSOR)

    return this.createToken(Tokens.COLON)
  }

  private scanEqual() {
    if (this.check("=") && this.moveN(1))
      return this.createToken(Tokens.EQUALS)

    const tok = this.createToken(Tokens.EQUAL)
    return tok
  }

  private scanDot() {
    if (this.check('.') && this.moveN(1)) {
      if (this.check('.') && this.moveN(1))
        return this.createToken(Tokens.SPREAD)

      return this.createToken(Tokens.SLICE)
    }

    return this.createToken(Tokens.DOT)
  }

  private scanIncrement() {
    let type = this.currentTok === '+' ? Tokens.PLUS : Tokens.MINUS

    if (this.check(this.currentTok as '+' | '-') && this.moveN(1)) {
      type = this.currentTok === '+' ? Tokens.INCREMENT : Tokens.DECREMENT
      return this.createToken(type)
    }

    return this.createToken(type)
  }

  private scanBang() {
    if (this.check("=") && this.moveN(2))
      return this.createToken(Tokens.NOT_EQUALS)

    return this.createToken(Tokens.BANG)
  }

  private scanSingleChar(): Token {
    switch (this.currentTok) {
      case '{':
      case '}':
      case '(':
      case ')':
      case '[':
      case ']':
      case ',':
      case ';':
      case '*':
      case '?':
      case '>':
      case '<':
      case '&': return this.createTokenFromStr(this.currentTok)
      case '\'':
      case '`':
      case '"':  return this.scanText(this.currentTok as ("\"" | "'" | "`"))
      case '+':
      case '-': return this.scanIncrement()
      case '=': return this.scanEqual()
      case '!': return this.scanBang()
      case '/': return this.scanSlash()
      case ':': return this.scanColon()
      case '.': return this.scanDot()
    }

    // if space or EOL is encountered
    // then calls to 'scan' again
    // to consume these spaces
    if (isSpace(this.currentTok) || (this.currentTok === '\r' || this.currentTok === '\n'))
      return this.scan()

    return this.createToken(Tokens.UNKNOWN)
  }

  public scan(): Token {
    // Avoding unexpected results and very probably infinite loops
    // we returns an EOF token if the lexer has ends of scan all the source
    if (this.hasEnd())
      return this.createToken(Tokens.EOF, { content: "EOF" })

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
    if (isAlpha(this.currentTok))
      return this.scanIdentifier()

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