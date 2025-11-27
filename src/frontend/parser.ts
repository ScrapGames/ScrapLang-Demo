import { SyntaxError } from "@/errors.ts"
import type { Maybe }  from "@/typings.ts"
import type { Reader } from "@frontend/typings.ts"
import { Position }    from "@frontend/position.ts"
import { Token, Tokens, stringify } from "@frontend/tokens/tokens.ts"
import Lexer    from "@frontend/lexer.ts"
import * as ast from "@frontend/ast/index.ts"

/**
 * Parser class responsible for converting a stream of tokens
 * from the lexer into an Abstract Syntax Tree (AST).
 *
 * It implements the Reader interface and provides methods to parse
 * declarations, statements and expressions
 */
export default class Parser implements Reader<Token, Tokens> {
  /**
   * The lexer instance used to generate tokens from the source code.
   */
  private lexer: Lexer

  /**
   * The current token being processed by the parser.
   */
  current: Token

  /**
   * Creates a new parser instance with a given lexer.
   * @param lexer The lexer providing tokens.
   */
  private constructor(lexer: Lexer) {
    this.lexer = lexer
  }

  /**
   * Initializes a new Parser instance.
   * @param lexer The lexer providing tokens.
   * @returns A new Parser object.
   */
  public static init(lexer: Lexer) {
    const p = new this(lexer)
    p.next()
    return p
  }

  /**
   * Throws a syntax error with detailed position information.
   * @param message Error message.
   * @throws {SyntaxError}
   */
  public syntaxError(message: string): never {
    throw new SyntaxError(message, this.lexer.name, this.current.position)
  }

  /**
   * Prints a syntax warning to the console.
   * @param message Warning message.
   */
  public syntaxWarn(message: string): void {
    console.warn(message)
  }

  /**
   * Consumes and returns the next token.
   * @returns The next token.
   */
  next(): Token {
    return this.moveN(1)
  }

  /**
   * Moves forward by `n` tokens.
   * Skips comments automatically.
   * @param n Number of tokens to advance.
   * @returns The last token consumed.
   */
  moveN(n: number): Token {
    for (let i = 0; i < n; i++)
      this.current = this.lexer.scan()

    if (this.current.is(Tokens.COMMENT))
      return this.moveN(1)

    return this.current
  }

  /**
   * Returns the current token without consuming it.
   * @returns The current token.
   */
  ahead(): Token {
    return this.current
  }

  /**
   * Checks if the lexer has reached the end of the input.
   * @returns True if the end of input is reached, otherwise false.
   */
  hasEnd(): boolean {
    return this.lexer.hasEnd()
  }

  /**
   * Checks if the current token matches the given type
   * @param maybe Token type to compare.
   * @returns True if it matches, otherwise false.
   */
  check(maybe: Tokens): boolean {
    return !!this.current.is(maybe)
  }

  // ===== HELPER FUNCTIONS =====

  /**
   * Ensures the next token matches the expected type, otherwise throws a syntax error.
   * @param expected Expected token type.
   * @returns The next token.
   */
  private expects(expected: Tokens) {
    const nextToken = this.next()
    if (nextToken.type === expected)
      return nextToken

    this.syntaxError(`Found ${stringify(nextToken.type)}, expected ${stringify(expected)}`)
  }

  /**
   * Consumes the current token if it matches the expected type, otherwise throws.
   * @param type Token type to expect.
   * @returns The consumed token.
   */
  private eat(type: Tokens): Token {
    if (!this.current.is(type)) {
      const expected = stringify(type)
      const found    = this.current.TypeContent
      this.syntaxError(`Missing '${expected}', found '${found}'`)
    }

    const current = this.current
    this.next()

    return current
  }

  /**
   * Conditionally consumes the current token if it matches the expected type.
   * @param type Token type to check.
   * @returns The consumed token or undefined.
   */
  private match(type: Tokens): Token | undefined {
    if (!this.current.is(type))
      return undefined

    return this.eat(type)
  }

  /**
   * Parses all elements beign enclosed between `open` and `close` according to every `consumer` call
   * @param open 
   * @param close 
   * @param consumer
   * @returns An array of elements of type `T`
   */
  private parseDelimited<T>(
    open: Tokens,
    close: Tokens,
    consumer: (start: Position) => T
  ): T[] {
    this.eat(open)

    const list: T[] = []
    while (!this.current.is(close))
      list.push(consumer.call(this, this.Position))

    this.eat(close)
    return list
  }

  /**
   * Parse AST nodes as according to `consumer` by {@link parseDelimited} with `Tokens.LBRACE` and `Tokens.RBRACE` as open and close tokens
   * @param consumer Lambda expression which indicates how contents inside `{` and `}` are parsed
   * @returns An array of elements of type `T`
   */
  private parseBlock<T extends ast.ASTNode>(consumer: (start: Position) => T): T[] {
    return this.parseDelimited(Tokens.LBRACE, Tokens.RBRACE, consumer)
  }

  /**
   * Calls {@link parseDelimited} and ensures that every element is separated by one `separator` token
   * @param open 
   * @param close 
   * @param separator 
   * @param consumer 
   * @returns 
   */
  private parseList<T>(
    open: Tokens,
    close: Tokens,
    separator: Tokens,
    consumer: (start: Position) => T
  ): T[] {
    return this.parseDelimited(open, close, () => {
      const item = consumer.call(this, this.Position)
      if (!this.match(separator) && !this.current.is(close))
        this.syntaxError(`Missing '${stringify(separator)}' separating elements`)

      return item
    })
  }

  // ===== FUNCTION PARSING =====

  private parseParamFunction(start: Position): ast.Param {
    const name = this.eat(Tokens.IDENTIFIER).content
    this.eat(Tokens.COLON)
    const type = this.parseType()
    return new ast.Param(name, type, start, this.Position)
  }

  /**
   * Parses a function signature
   * @returns Object FunctionSignature
   */
  private parseSignFunction(start: Position): ast.FunctionSignature {
    const flag = (this.match(Tokens.INLINE) || this.match(Tokens.ASYNC))?.type as Maybe<ast.FunctionFlags>
    if (!this.match(Tokens.FN))
      this.syntaxError("Functions can only has one flag")

    const name     = this.match(Tokens.IDENTIFIER)?.content
    const generics = this.current.is(Tokens.LESS) && this.parseGenericsType()
    const params   = this.parseList(Tokens.LPAREN, Tokens.RPAREN, Tokens.COMMA, this.parseParamFunction)
    const ret      = this.match(Tokens.COLON) && this.parseType()
    const end      = this.Position
    return new ast.FunctionSignature(flag, name, generics, params, ret, start, end)
  }

  // ----- STATEMENT PARSING ----- //

  /**
   * Parses a 'dissipate' statement.
   * @param start Start position.
   * @returns Dissipate AST node.
   */
  private parseDissipateStmt(start: Position): ast.Dissipate {
    this.eat(Tokens.DISSIPATE)
    if (this.current.is(Tokens.FN)) {
      const fn = this.parseLambdaExpr(this.Position)
      return new ast.Dissipate(fn, start, this.Position)
    }

    // tries to parse an expression which could be a function contained in a array access, a mod access or similar expressions
    return new ast.Dissipate(this.parseExpr(), start, this.Position)
  }

  /**
   * Parses an expression statement.
   * @param start Start position.
   * @returns ExpressionStmt AST node.
   */
  private parseExprStmt(start: Position): ast.ExpressionStmt {
    const expr = this.parseExpr()
    return new ast.ExpressionStmt(expr, start, expr.end)
  }

  /**
   * Parses a declaration statement.
   * @param start Start position.
   * @returns DeclarationStmt AST node.
   */
  private parseDeclStmt(start: Position): ast.DeclarationStmt {
    const decl = this.parseDecl(start)
    return new ast.DeclarationStmt(decl, start, decl.end)
  }

  /**
   * Parses a default statement inside a match block.
   * @param start Start position.
   * @returns Default AST node.
   */
  private parseDefaultMatchMember(start: Position): ast.Default {
    this.eat(Tokens.ARROW)
    const stmt: ast.Statement[] = []
    if (!this.match(Tokens.LBRACE))
      stmt.push(this.parseStmt(this.Position))
    else
      stmt.concat(this.parseBlock(this.parseStmt))

    return new ast.Default(stmt, start, this.Position)
  }

  /**
   * Parses a case/default statement inside a match block.
   * @param start Start position.
   * @returns Case or Default AST node.
   */
  private parseCaseMatchMember(start: Position): ast.Case | ast.Default {
    const isDefault = !!this.match(Tokens.DEFAULT)
    if (isDefault)
      return this.parseDefaultMatchMember(start)

    const stmt: ast.Statement[] = []
    const subject: ast.Expression[] = []
    while (!this.current.is(Tokens.ARROW)) {
      subject.push(this.parseExpr())
      this.match(Tokens.COMMA)
    }

    this.eat(Tokens.ARROW)
    if (!this.match(Tokens.LBRACE))
      stmt.push(this.parseStmt(this.Position))
    else
      stmt.concat(this.parseBlock(this.parseStmt))
    
    return new ast.Case(subject, stmt, start, this.Position)
  }

  private parseWhileStmt(start: Position): ast.While {
    this.eat(Tokens.WHILE)

    const expr = this.parseExpr()
    const body = this.parseBlock(this.parseStmt)
    return new ast.While(expr, body, start, this.Position)
  }

  private parseForStmt(start: Position): ast.For | ast.ForOf | ast.ForIn {
    this.eat(Tokens.FOR)
    this.eat(Tokens.LPAREN) // for (...

    if (this.current.is(Tokens.VAR)) {
      const decl = this.parseVariableDecl(this.Position)
      const loop = this.eat(Tokens.SEMICOLON) && this.parseExpr()
      const incr = this.eat(Tokens.SEMICOLON) && this.parseExpr()
      this.eat(Tokens.RPAREN) // ...)

      const body = this.parseBlock(this.parseStmt)
      return new ast.For(decl, loop, incr, body, start, this.Position)
    }

    const name = this.eat(Tokens.IDENTIFIER).content
    switch (this.current.type) {
      case Tokens.OF:
      case Tokens.IN: {
        const kind = this.current.is(Tokens.OF) ? ast.ForOf : ast.ForIn
        const subject = this.eat(this.current.type) && this.parseExpr()
        this.eat(Tokens.RPAREN) // ...)

        const body = this.parseBlock(this.parseStmt)
        return new kind(name, subject, body, start, this.Position)
      }
    }

    this.syntaxError(`Unknown for loop kind '${this.current.TypeContent}'`)
  }

  private parseIfStmt(start: Position): ast.If {
    this.eat(Tokens.IF)

    const expr = this.parseExpr()
    const body = this.parseBlock(this.parseStmt)
    return new ast.If(expr, body, start, this.Position)
  }

  private parseReturnStmt(start: Position): ast.Return {
    this.eat(Tokens.RETURN)
    if (this.match(Tokens.SEMICOLON))
      return new ast.Return(undefined, start, this.Position)

    const expr = this.parseExpr()
    return new ast.Return(expr, start, this.Position)
  }

  /**
   * Parses a generic statement.
   * @param start Start position.
   * @returns Statement AST node.
   */
  private parseStmt(start: Position): ast.Statement {
    switch (this.current.type) {
      case Tokens.IF:         return this.parseIfStmt(start)
      case Tokens.FOR:        return this.parseForStmt(start)
      case Tokens.WHILE:      return this.parseWhileStmt(start)
      case Tokens.RETURN:     return this.parseReturnStmt(start)
      case Tokens.DISSIPATE:  return this.parseDissipateStmt(start)
      case Tokens.MATCH:
      case Tokens.IDENTIFIER: return this.parseExprStmt(start)
      case Tokens.FN:
      case Tokens.VAR:
      case Tokens.CONST:      return this.parseDeclStmt(start)
    }

    this.syntaxError(`Unknown statement '${this.current.TypeContent}'`)
  }

  // ===== TYPE PARSING =====

  /**
   * Parses an array type
   * @param start 
   * @param type Base type of the array
   * @returns Array type AST node
   */
  private parseArrayType(start: Position, type: ast.TType): ast.TArray {
    this.eat(Tokens.LSQRBR)
    const size = this.match(Tokens.NUMBER)?.content
    this.eat(Tokens.RSQRBR)
    return new ast.TArray(type, size ? parseInt(size) : undefined, start, this.Position)
  }

  private parseIdentifierType(start: Position): ast.TType {
    const identifier = this.eat(Tokens.IDENTIFIER)
    const generics   = this.current.is(Tokens.LESS) && this.parseList(
      Tokens.LESS,
      Tokens.GREATER,
      Tokens.COMMA,
      () => this.parseType()
    )
    const tIdentifier = new ast.TIdentifier(generics, identifier.content, start, this.Position)

    if (this.current.is(Tokens.LSQRBR))
      return this.parseArrayType(this.Position, tIdentifier)

    return tIdentifier
  }

  private parseFunctionType(start: Position): ast.TFunction {
    const sign = this.parseSignFunction(this.Position)

    switch (true) {
      case sign.flag === Tokens.INLINE: this.syntaxError("Function types can not be inline") /* falls through */
      case !!sign.name: this.syntaxError("Function types must not have a name") /* falls through */
      case !sign.ret:   this.syntaxError("Function types must have a return type")
    }

    return new ast.TFunction(sign, start, this.Position)
  }

  private parseGenericsType(): string[] {
    this.eat(Tokens.LESS)
    const generics = this.parseList(
      Tokens.LESS,
      Tokens.GREATER,
      Tokens.COMMA,
      () => this.eat(Tokens.IDENTIFIER).content
    )

    return generics
  }

  private parsePrimaryType(): ast.TType {
    switch (this.current.type) {
      case Tokens.IDENTIFIER: return this.parseIdentifierType(this.Position)
      case Tokens.FN:         return this.parseFunctionType(this.Position)
    }

    this.syntaxError(`Unknown type '${this.current.content}'`)
  }

  private parseType(type?: ast.TType, prevOp?: Token): ast.TType {
    const start = this.Position
    if (!type)
      type = this.parsePrimaryType()

    while (true) {
      const op      = this.current
      const opRules = op.OpTypeRules
      if (!opRules)
        return type

      if (prevOp) {
        const prevOpRules = prevOp.opRules!
        const higherPrec  = prevOpRules.prec < opRules.prec
        const leftAssoc   = prevOpRules.prec === opRules.prec && opRules.assoc === "left"
        if (higherPrec || leftAssoc)
          return type
      }

      this.next()
      const rhs = this.parseType(undefined, op)
      type = new ast.TBinary(op, type, rhs, start, this.Position)
    }
  }

  // ===== DECLARATION PARSING =====

  private parseClassMember(start: Position): ast.ClassMember {
    const isPub = !!this.match(Tokens.PUB)
    switch (this.current.type) {
      case Tokens.FN:
      case Tokens.VAR:
      case Tokens.TYPE:
      case Tokens.CONST:
      case Tokens.INTERFACE: {
        const decl = this.parseDecl(this.Position) as ast.NamedDeclaration
        return new ast.ClassMember(decl.kind, isPub, decl, start, this.Position)
      }
    }

    this.syntaxError(`Invalid class member '${this.current.TypeContent}'`)
  }

  /**
   * Parses a class declaration
   * @param start Starting position
   * @returns Class AST node
   */
  private parseClassDecl(start: Position): ast.Class {
    this.eat(Tokens.CLASS)
    const name     = this.eat(Tokens.IDENTIFIER).content
    const generics = this.current.is(Tokens.LESS) && this.parseGenericsType()
    const inhertis = this.match(Tokens.EXTENDS) && this.parseType()
    const body     = this.parseBlock(this.parseClassMember)
    return new ast.Class(name, generics, inhertis, body, start, this.Position)
  }

  /**
   * Parses a variable declaration
   * @param start Starting position
   * @returns Variable declaration AST node
   */
  private parseVariableDecl(start: Position): ast.Variable {
    const isConst = !!(this.match(Tokens.CONST) || !this.eat(Tokens.VAR))
    const name    = this.eat(Tokens.IDENTIFIER).content
    const type    = this.match(Tokens.COLON) && this.parseType()
    const value   = this.match(Tokens.EQUAL) && this.parseExpr()
    return new ast.Variable(isConst, name, type, value, start, this.Position)
  }

  /**
   * Parses an interface declaration
   * @param start
   * @example
   * ```
   * interface MyInterface extends BaseInterface {
   *   fn myMethod(arg: unknown): void
   *   myProperty: string
   * }
   * ```
   * @returns Interface AST node
   */
  private parseInterface(start: Position): ast.Interface {
    this.eat(Tokens.INTERFACE)
    const name     = this.eat(Tokens.IDENTIFIER).content
    const generics = this.current.is(Tokens.LESS) && this.parseGenericsType()
    const inherits = this.match(Tokens.EXTENDS) && this.parseType()
    const body     = this.parseBlock(this.parseSignFunction)

    return new ast.Interface(name, generics, inherits, body, start, this.Position)
  }

  /**
   * Parses a type declaration
   * @param start
   * @example type MyType<T> = string | u32
   * @returns Type AST node
   */
  private parseTypeDecl(start: Position): ast.Type {
    this.eat(Tokens.TYPE)
    const name = this.eat(Tokens.IDENTIFIER).content
    const generics = this.current.is(Tokens.LESS) && this.parseGenericsType()

    this.eat(Tokens.EQUAL)
    const type = this.parseType()
    return new ast.Type(name, generics, type, start, this.Position)
  }

  /**
   * Parses a deep import symbol (e.g., `std::io::File`).
   * @returns The full import symbol as a string.
   */
  private parseDeepImport(): string {
    let symbol = (this.match(Tokens.IDENTIFIER) || this.match(Tokens.STRING))?.content
    if (!symbol)
      this.syntaxError("Expected identifier or string as import symbol")

    while (this.match(Tokens.MOD_ACCESSOR)) {
      const prevS: string = symbol
      symbol = (this.match(Tokens.IDENTIFIER) || this.eat(Tokens.STRING)).content
      symbol = `${prevS}::${symbol}`
    }

    return symbol
  }

  /**
   * Parses an import declaration.
   * @param start Start position.
   * @param from Optional module name.
   * @returns Import AST node.
   */
  private parseImportDecl(start: Position, from?: string): ast.Import {
    this.eat(Tokens.IMPORT)

    /**
     * If `from` is not provided, it means the syntax is something like:
     * 
     * ```
     * import express
     * or
     * import "code_gen"
     * ```
     */
    if (!from) {
      const module = this.parseDeepImport()
      return new ast.Import([], module, start, this.Position)
    }

    /**
     * If `from` is provided and the next token is a star (`*`), it means all symbols are being imported:
     * 
     * ```
     * from std::io import *
     * ```
     */
    if (this.match(Tokens.STAR))
      return new ast.Import("*", from, start, this.Position)

    /**
     * Otherwise, it means specific symbols are being imported:
     * 
     * ```
     * from std::io import File
     * from internal::"code-gen" import ir::Functions, ir::Types
     * ```
     */
    const symbols: string[] = []
    do {
      symbols.push(this.parseDeepImport())
    } while (this.match(Tokens.COMMA))

    return new ast.Import(symbols, from, start, this.Position)
  }

  /**
   * Parses a from declaration
   * @param start
   * @returns From AST node
   */
  private parseFromDecl(start: Position): ast.From {
    this.eat(Tokens.FROM)
    const module  = this.parseImportMember(this.Position)
    const imports = this.parseImportDecl(this.Position)
    return new ast.From(module, imports, start, this.Position)
  }

  /**
   * Parses 
   * @param start 
   * @example 
   * @returns 
   */
  private parseExternDecl(start: Position): ast.Extern {
    this.eat(Tokens.EXTERN)
    const sign = this.parseSignFunction(this.Position)

    switch (true) {
      case !!sign.flag: this.syntaxError("Extern functions can not have any flag") /* falls through */
      case !sign.name:  this.syntaxError("Extern functions must have a name")
    }

    return new ast.Extern(sign, start, this.Position)
  }

  private parseFunctionDecl(start: Position): ast.Function {
    const sign = this.parseSignFunction(this.Position)

    if (!sign.name)
      this.syntaxError("Functions declarations must have a name")

    const body = this.parseBlock(this.parseStmt)
    return new ast.Function(sign, body, start, this.Position)
  }

  private parseModuleMember(start: Position): ast.ModuleMember {
    const isExported = !!this.match(Tokens.EXPORT)
    switch (this.current.type) {
      case Tokens.FN:
      case Tokens.TYPE:
      case Tokens.FROM:
      case Tokens.ASYNC:
      case Tokens.CONST:
      case Tokens.CLASS:
      case Tokens.INLINE:
      case Tokens.EXTERN:
      case Tokens.MODULE:
      case Tokens.IMPORT:
      case Tokens.INTERFACE: {
        const decl = this.parseDecl(start) as ast.NamedDeclaration
        return new ast.ModuleMember(decl.kind, isExported, decl, start, this.Position)
      }
    }

    this.syntaxError(`Invalid module declaration '${this.current.TypeContent}'`)
  }

  /**
   * Parses a module declaration.
   * @param start Start position.
   * @returns Module AST node.
   */
  private parseModuleDecl(start: Position): ast.Module {
    this.eat(Tokens.MODULE)
    const name = (this.match(Tokens.IDENTIFIER) || this.eat(Tokens.STRING)).content
    const body = this.parseBlock(this.parseModuleMember)
    return new ast.Module(name, body, start, this.Position)
  }

  /**
   * Parses a declaration (var, const, module, function, import, from).
   * @param start Start position.
   * @returns Declaration AST node.
   */
  private parseDecl(start: Position): ast.Declaration {
    switch(this.current.type) {
      case Tokens.FROM:      return this.parseFromDecl(start)
      case Tokens.IMPORT:    return this.parseImportDecl(start)
      case Tokens.INLINE:
      case Tokens.ASYNC:
      case Tokens.FN:        return this.parseFunctionDecl(start)
      case Tokens.EXTERN:    return this.parseExternDecl(start)
      case Tokens.VAR:
      case Tokens.CONST:     return this.parseVariableDecl(start)
      case Tokens.CLASS:     return this.parseClassDecl(start)
      case Tokens.MODULE:    return this.parseModuleDecl(start)
      case Tokens.INTERFACE: return this.parseInterface(start)
      case Tokens.TYPE:      return this.parseTypeDecl(start)
    }

    this.syntaxError(`Unknown declaration '${this.current.TypeContent}'`)
  }

  // ----- EXPRESSION PARSING ----- //

  /**
   * Parses a match expression.
   * @param start Start position.
   * @returns Match AST node.
   */
  private parseMatchExpr(start: Position): ast.Match {
    this.eat(Tokens.MATCH)
    const subject = this.parseExpr()
    this.eat(Tokens.LBRACE)

    // TODO: Replace this procedure by using `parseBlock` instead
    const body: ast.Case[] = []
    let fallThrough: Maybe<ast.Default> = undefined
    while (!this.current.is(Tokens.RBRACE)) {
      const stmt = this.parseCaseMatchMember(this.Position)
      switch (true) {
        case !!fallThrough: this.syntaxError("A default statement has been already declared"); break
        case stmt.kind === ast.StatementKind.Default: fallThrough = stmt as ast.Default; break
        default: body.push(stmt as ast.Case); break
      }

      this.match(Tokens.COMMA) // this allows trailing comma, because only eats it if exists
    }

    this.eat(Tokens.RBRACE)
    return new ast.Match(subject, body, fallThrough, start, this.Position)
  }

  /**
   * Parses a function expression
   * @param start Start position
   * @returns Lambda expression AST node
   */
  private parseLambdaExpr(start: Position): ast.Lambda {
    const sign = this.parseSignFunction(this.Position)
    const body = this.parseBlock(this.parseStmt)
    sign.name ??= `anonymous_${crypto.randomUUID()}`
    return new ast.Lambda(sign, body, start, this.Position)
  }

  /**
   * Parses a parenthesized expression.
   * @returns Expression AST node.
   */
  private parseParenExpr(): ast.Expression {
    return this.parseDelimited(
      Tokens.LPAREN,
      Tokens.RPAREN,
      () => this.parseExpr()
    )[0]
  }

  /**
   * Parses a function call expression.
   * @param start Start position.
   * @param callee The callee expression.
   * @returns Call AST node.
   */
  private parseCallExpr(start: Position, callee: ast.Expression, generics?: ast.TType[]): ast.Call {
    const list = this.parseList(
      Tokens.LPAREN,
      Tokens.RPAREN,
      Tokens.COMMA,
      () => this.parseExpr()
    )

    return new ast.Call(generics, callee, list, start, this.Position)
  }

  /**
   * Parses a literal string
   * @param start 
   * @returns 
   */
  private parseStringExpr(start: Position): ast.String {
    const content = this.eat(Tokens.STRING).content
    return new ast.String(content, start, this.Position)
  }

  /**
   * Parses an _indivisible_ value like a number or a character
   * @param start 
   * @returns 
   */
  private parseAtomicExpr(start: Position): ast.Char | ast.Number {
    const atomic = this.current.is(Tokens.CHAR) ? ast.Char : ast.Number
    const value = this.current.content

    this.next()
    return new atomic(value, start, this.Position)
  }

  /**
   * Parses an identifier
   * @param start 
   * @returns 
   */
  private parseIdentifierExpr(start: Position): ast.Identifier {
    const ident = this.current.content

    this.next()
    return new ast.Identifier(ident, start, this.Position)
  }

  /**
   * Parses grouping constructs (arrays, parentheses).
   * @returns Expression AST node.
   */
  private parsePairs(): ast.Expression {
    switch (this.current.type) {
      case Tokens.LPAREN: return this.parseParenExpr()
    }

    this.syntaxError(`Unkown grouping token '${this.current.content}'`)
  }

  /**
   * Parses unary expressions (negation, increment, etc.).
   * @returns Unary expression AST node.
   */
  private parseUnaryExpr(): ast.Expression {
    const start = this.Position

    switch (this.current.type) {
      case Tokens.NOT:
      case Tokens.NEW:
      case Tokens.PLUS:
      case Tokens.BANG:
      case Tokens.DROP:
      case Tokens.MINUS:
      case Tokens.AWAIT:
      case Tokens.AMPER:
      case Tokens.INCREMENT:
      case Tokens.DECREMENT: {
        const op = this.eat(this.current.type)
        return new ast.Unary(op, this.parseExpr(), start, this.Position)
      }
    }

    return this.parsePairs()
  }

  /**
   * Parses literal values (numbers, strings, identifiers, etc.).
   * @returns Literal AST node.
   */
  private parsePrimaryExpr(): ast.Expression {
    const start = this.Position

    switch (this.current.type) {
      case Tokens.FN:
      case Tokens.ASYNC: return this.parseLambdaExpr(start)
      case Tokens.MATCH: return this.parseMatchExpr(start)

      case Tokens.CHAR:
      case Tokens.NUMBER:     return this.parseAtomicExpr(start)
      case Tokens.IDENTIFIER: return this.parseIdentifierExpr(start)
      case Tokens.STRING:     return this.parseStringExpr(start)
    }

    return this.parseUnaryExpr()
  }

  /**
   * Parses an expression (entry point for expression parsing).
   * @param expr Optional left-hand side expression.
   * @param prevOp Optional operator for precedence handling.
   * @returns Expression AST node.
   */
  private parseExpr(expr?: ast.Expression, prevOp?: Token): ast.Expression {
    const start = this.Position
    if (!expr)
      expr = this.parsePrimaryExpr()

    while (true) {
      const op      = this.current
      const opRules = op.opRules
      if (!opRules)
        return expr

      if (prevOp) {
        const prevOpRules = prevOp.opRules!
        const higherPrec  = prevOpRules.prec < opRules.prec
        const leftAssoc   = prevOpRules.prec === opRules.prec && opRules.assoc === "left"
        if (higherPrec || leftAssoc)
          return expr
      }

      this.next()
      const rhs = this.parseExpr(undefined, op)
      expr = new ast.Binary(op, expr, rhs, start, this.Position)
    }
  }

  public *[Symbol.iterator]() {
    while (!this.hasEnd())
      yield this.parseDecl(this.Position)
  }

  /**
   * Gets the current lexer position.
   */
  public get Position(): Position {
    return this.lexer.Position
  }
}
