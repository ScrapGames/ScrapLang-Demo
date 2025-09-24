/**
 * Lexer/Scanner prototype for ScrapLang
 * 
 * The Lexer scans a file and reads its contents to extract tokens
 * that correspond to the language syntax definitions.
 * 
 * For example, `const`, `fn`, `enum`... are keywords and the Lexer
 * will recognize them as such.
 * 
 * If the Lexer encounters an invalid token, it will throw an error.
 */

import { basename } from "@std/path/basename"
import { Position } from "@frontend/position.ts"
import { KEYWORD_MAP, TOKEN_MAP, RTOKEN_MAP, Token, Tokens } from "@frontend/tokens/tokens.ts"
import { Collectable, Reader } from "@frontend/typings.ts"

/** Detects alphabetic characters (ignoring Cases) */
function isAlpha(char: string) {
  return /[a-zA-Z_]/.test(char)
}

/** Detects alphanumeric characters */
function isAlphaNum(char: string) {
  return /[0-9a-zA-Z_$]/.test(char)
}

/** Detects valid hexadecimal numbers */
function isHexadecimal(char: string) {
  return /[0-9a-fA-F]/.test(char)
}

/** Detects numeric characters */
function isNumeric(char: string) {
  return /[0-9_]/.test(char)
}

/** Detects whitespaces characters */
function isSpace(char: string): char is ' ' {
  return char === ' '
}

/** Detects End Of Line characters */
function isEOL(char: string): char is '\r' | '\n' {
  return char === '\r' || char === '\n'
}

/**
 * Defines scanning modes:
 * - Advance: moves the file pointer and updates `currentTok`
 * - Check: peeks a character without permanently advancing the pointer
 */
enum ScanMode {
  Advance,
  Check
}

/**
 * Main Lexer class implementing `Collectable<Token>` and `Reader<string>`.
 * It reads a source file and transforms it into a sequence of tokens.
 */
export default class Lexer implements Collectable<Token>, Reader<string> {
  /** Source file being scanned */
  private file: Deno.FsFile

  /** Source file name */
  public name: string
  
  /** UTF-8 decoder to interpret raw bytes as text */
  private decoder: TextDecoder
  
  /** Temporary byte buffer for file reading */
  private buffer: Uint8Array
  
  /** Flag indicating whether end of file has been reached */
  private eof: boolean
  
  /** Current position in the file (line, column, index) */
  private position: Position

  /** Current character being processed by the Lexer */
  current: string

  /**
   * Private constructor: initializes the Lexer with the given file path.
   * Use `Lexer.init` instead of calling this directly.
   */
  private constructor(filePath: string) {
    this.position = new Position(0, 1, 0)
    this.buffer = new Uint8Array(1)
    this.decoder = new TextDecoder("utf8")
    this.file = Deno.openSync(filePath)
    this.eof = false
    this.name = basename(filePath)
  }

  /**
   * Static initializer for creating a new Lexer instance and
   * performing the first read from the file.
   * @param filePath Path of the source file to scan
   * @returns An initialized `Lexer` instance
   */
  public static init(filePath: string) {
    const l = new this(filePath)
    l.next() // initializes `currentTok` with the first character
    return l
  }

  // ===== HELPER FUNCTIONS =====

  /**
   * Creates a new token based on `currentTok` value.
   * @param tok Type of token
   * @param opts Optional parameters:
   *  - content: string value of the token
   *  - pos: position of the token in the file
   *  - advance: whether to advance the Lexer after creating the token
   * @returns A new Token
   */
  private createToken(
    tok: Tokens,
    opts: Partial<{ content: string, pos: Position, advance: boolean }> = {}
  ): Token {
    const t = Token.createToken(tok, opts.pos ?? this.Position, opts.content ?? TOKEN_MAP.get(tok)!);
    opts.advance ??= (true && !t.isCompoundedOp())
    if (!opts.advance)
      return t

    this.next()
    return t
  }

  /**
   * Creates a token by matching a string against the reverse token map.
   * @param content The string representation of the token
   * @param opts Optional token creation parameters
   * @returns A Token (known type or UNKNOWN if not mapped)
   */
  private createTokenFromStr(content: string, opts?: Partial<{ pos: Position, advance: boolean }>) {
    const type = RTOKEN_MAP.get(content)
    if (!type)
      return this.createToken(Tokens.UNKNOWN, { content })

    return this.createToken(type, opts)
  }

  /**
   * Equivalent to C++ `istream::tellg`.
   * @returns The current byte offset in the source file
   */
  private tellg(): number {
    return this.file.seekSync(0, Deno.SeekMode.Current)
  }

  // ===== COLLECTABLE FUNCTIONS =====

  /**
   * Collects all tokens from the file until EOF.
   * @returns Array of tokens
   */
  collect(): Token[] {
    return Array.from(this)
  }

  // ===== READER FUNCTIONS =====

  /**
   * Reads the next character from the source.
   * @returns The next character
   */
  next(): string {
    return this.moveN(1)
  }

  /**
   * Advances `n` positions in the source file.
   * 
   * NOTE: `n` is human-readable (1 = first char, 2 = second, etc.).
   * @param n Number of positions to move (positive or negative)
   * @param mode Whether to advance or just check without moving
   * @returns The next character
   */
  moveN(n: number, mode: ScanMode = ScanMode.Advance): string {
    if (this.tellg() === 0 && n < 0 || n < -this.position.idx)
      throw new Error("Backward movement is not allowed at the beginning of the file")

    if (this.hasEnd())
      return this.current

    this.file.seekSync(n > 0 ? n - 1 : n, Deno.SeekMode.Current)
    const bytes = this.file.readSync(this.buffer)

    if (mode === ScanMode.Check) {
      this.file.seekSync(-n, Deno.SeekMode.Current)
      return this.decoder.decode(this.buffer)
    }

    this.eof = !bytes
    if (!this.hasEnd()) {
      this.position.setTo(this.tellg())
      this.position.lineIdx++
    }

    return (this.current = this.decoder.decode(this.buffer))
  }

  /**
   * Peeks ahead at the next character without consuming it.
   * @returns The next character
   */
  ahead(): string {
    // TODO: fix bug where if the next character is EOF
    // Some methods who use `check` (and ahead), would return a wrong token when the next character is EOF
    return this.moveN(1, ScanMode.Check)
  }

  /**
   * Checks whether the next character matches a given string.
   * @param maybe Character to check against
   * @returns True if match, false otherwise
   */
  check(maybe: string): boolean {
    return this.ahead() === maybe
  }

  /**
   * Returns whether the end of the file has been reached.
   */
  hasEnd(): boolean {
    return this.eof
  }

  // ===== LEXER FUNCTIONS =====

  /**
   * Consumes end-of-line characters (`\r`, `\n`).
   * Updates line counters accordingly.
   */
  private consumeEOL() {
    while (isEOL(this.current)) {
      this.check('\n') ? this.moveN(2) : this.next()
      this.position.line++
      this.position.lineIdx = 1

      if (this.hasEnd())
        break
    }
  }

  /**
   * Scans a string or character literal depending on quote type.
   * @param quoteType Type of quote used ('"', "'", "`")
   * @returns A STRING or CHAR token
   */
  private scanText(quoteType: "\"" | "'" | "`") {
    const pos = this.Position
    let content = ""
    this.next() // eat opening quote

    do {
      content += this.current
    } while (this.next() !== quoteType)

    this.next() // eat closing quote
    const type = quoteType === "'" ? Tokens.CHAR : Tokens.STRING
    return this.createToken(type, { content, pos, advance: false })
  }

  /**
   * Scans an identifier or keyword.
   * @returns An IDENTIFIER token or a keyword token
   */
  private scanIdentifier() {
    const pos = this.Position
    let content = ""

    do {
      content += this.current
    } while (isAlphaNum(this.next()) && !this.hasEnd())

    const type = KEYWORD_MAP.get(content) ?? Tokens.IDENTIFIER
    return this.createToken(type, { content, pos, advance: false })
  }

  /**
   * Scans a numeric literal.
   * @returns A NUMBER token
   */
  private scanNumber() {
    const pos = this.Position
    let content = ""

    do {
      content += this.current
    } while (isNumeric(this.next()) && !this.hasEnd())

    return this.createToken(Tokens.NUMBER, { content, pos, advance: false })
  }

  /**
   * Scans a slash `/`, checking for comments or division operator.
   * @returns A SLASH token (comments are skipped)
   */
  private scanSlash() {
    const ahead = this.ahead()

    if (ahead !== '/' && ahead !== '*')
      return this.createToken(Tokens.SLASH)

    const pos = this.Position
    let content = ""

    if (ahead === '/' && this.moveN(2)) {
      do
        content += this.current
      while (!isEOL(this.next()))
    } else if (ahead === '*' && this.moveN(2)) {
      do
        content += this.current
      while (this.next() !== '*' && !this.check('/'))

      this.moveN(2) // eats the closing pairs for block comments
    }

    return this.createToken(Tokens.COMMENT, { content, pos, advance: false })
  }

  /**
   * Scans `:` or `::` (module accessor).
   */
  private scanColon() {
    if (this.check(":") && this.moveN(2))
      return this.createToken(Tokens.MOD_ACCESSOR)

    return this.createToken(Tokens.COLON)
  }

  /**
   * Scans `=` or `==`.
   */
  private scanEqual() {
    if (this.check("=") && this.moveN(2))
      return this.createToken(Tokens.EQUALS)

    return this.createToken(Tokens.EQUAL)
  }

  /**
   * Scans `.`, `..` (slice), or `...` (spread).
   */
  private scanDot() {
    if (this.check('.') && this.next()) {
      if (this.check('.') && this.next())
        return this.createToken(Tokens.SPREAD)

      return this.createToken(Tokens.SLICE)
    }

    return this.createToken(Tokens.DOT)
  }

  /**
   * Scans `+`, `-`, `++`, `--`, `->`.
   */
  private scanIncrement() {
    const isMinus = this.current === '-'

    if (isMinus && this.check('>')) {
      this.moveN(2)
      return this.createToken(Tokens.ARROW)
    }

    let type = isMinus ? Tokens.MINUS : Tokens.PLUS
    if (this.check(this.current) && this.next()) {
      type = this.current === '+' ? Tokens.INCREMENT : Tokens.DECREMENT
      return this.createToken(type)
    }

    return this.createToken(type)
  }

  /**
   * Scans `!` or `!=`.
   */
  private scanBang() {
    if (this.check("=") && this.moveN(2))
      return this.createToken(Tokens.NOT_EQUALS)

    return this.createToken(Tokens.BANG)
  }

  /**
   * Handles single-character tokens such as brackets, commas, etc.,
   * as well as delegating scanning for multi-character tokens.
   */
  private scanSingleChar(): Token {
    switch (this.current) {
      case '{': case '}':
      case '(': case ')':
      case '[': case ']':
      case ',': case ';':
      case '*': case '?':
      case '>': case '<':
      case '&': return this.createTokenFromStr(this.current)
      case '\'': case '`': case '"':
        return this.scanText(this.current as ("\"" | "'" | "`"))
      case '+': case '-':
        return this.scanIncrement()
      case '=':
        return this.scanEqual()
      case '!':
        return this.scanBang()
      case '/':
        return this.scanSlash()
      case ':':
        return this.scanColon()
      case '.':
        return this.scanDot()
    }

    // Ignore spaces and newlines by rescanning
    if (isSpace(this.current) || isEOL(this.current))
      return this.scan()

    return this.createToken(Tokens.UNKNOWN)
  }

  /**
   * Main scan method: processes the current character and returns a token.
   * @returns The next token from the source
   */
  public scan(): Token {
    if (this.hasEnd())
      return this.createToken(Tokens.EOF, { content: "EOF" })

    while (isSpace(this.current))
      this.next()

    if (isEOL(this.current))
      this.consumeEOL()

    if (isAlpha(this.current))
      return this.scanIdentifier()

    if (isNumeric(this.current))
      return this.scanNumber()

    return this.scanSingleChar()
  }

  /**
   * Returns a copy of the current position in the file.
   */
  public get Position(): Position {
    return this.position.copy()
  }

  public set Position(pos: Position) {
    this.position = pos
  }

  *[Symbol.iterator]() {

  }

  /**
   * Closes the underlying file when disposing the Lexer.
   */
  [Symbol.dispose]() {
    this.file.close()
  }
}
