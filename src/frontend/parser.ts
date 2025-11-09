import { SyntaxError }  from "@/errors.ts"
import { Maybe }        from "@/typings.ts"
import { Position }     from "@frontend/position.ts"
import type { Reader }  from "@frontend/typings.ts"
import { Token, Tokens, TOKEN_MAP, stringify } from "@frontend/tokens/tokens.ts"
import Lexer             from "./lexer.ts"
import * as ast          from "@frontend/ast/nodes/index.ts"
import { FunctionFlags, FunctionSignature } from "@frontend/ast/nodes/functions.ts"

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
   * Checks if the current token matches the given type.
   * @param maybe Token type to compare.
   * @returns True if it matches, otherwise false.
   */
  check(maybe: Tokens): boolean {
    return this.lexer.check(TOKEN_MAP.get(maybe)!)
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
  private wheter(type: Tokens): Token | undefined {
    if (!this.current.is(type))
      return undefined

    return this.eat(type)
  }

  /**
   * Parses the root file/module.
   * @returns The AST node representing a module.
   */
  public parseFile(): ast.declarations.Module {
    const start = this.Position
    const body: ast.declarations.Declaration[] = this.next() && []
    while (!this.lexer.hasEnd())
      body.push(this.parseDecl(start))

    const name = this.lexer.name.split(/(\/|\\)/).pop()!.split(".")[0]
    return new ast.declarations.Module(
      body,
      name,
      start,
      this.Position
    )
  }

  // ===== FUNCTION PARSING =====

  /**
   * Parses a function signature
   * @returns Object FunctionSignature
   */
  private parseFunctionSign(): FunctionSignature {
    const flag = (this.wheter(Tokens.INLINE) || this.wheter(Tokens.ASYNC))?.type as Maybe<FunctionFlags>
    if (!this.wheter(Tokens.FN))
      this.syntaxError("Functions can only has one flag")

    const name     = this.wheter(Tokens.IDENTIFIER)?.content
    const generics = this.current.is(Tokens.LESS) && this.parseTGenericsDecl()
    const params   = this.parseFunctionParams()
    const ret      = this.wheter(Tokens.COLON) && this.parseTType()
    return { flag, name, generics, params, ret }
  }

  // ----- STATEMENT PARSING ----- //

  /**
   * Parses a block of statements enclosed in braces.
   * @param start Starting position.
   * @returns Array of statement AST nodes.
   */
  private parseBlock(start: Position): ast.statements.Statement[] {
    this.eat(Tokens.LBRACE)
    const body: ast.statements.Statement[] = []
    
    while (!this.current.is(Tokens.RBRACE))
      body.push(this.parseStatement(start))

    this.eat(Tokens.RBRACE)
    return body
  }

  /**
   * Parses a 'dissipate' statement.
   * @param start Start position.
   * @returns Dissipate AST node.
   */
  private parseDissipate(start: Position): ast.statements.Dissipate {
    this.eat(Tokens.DISSIPATE)
    if (this.current.is(Tokens.FN)) {
      const fn = this.parseLambda(this.Position)
      return new ast.statements.Dissipate(fn, start, this.Position)
    }

    // tries to parse an expression which could be a function contained in a array access, a mod access or similar expressions
    return new ast.statements.Dissipate(this.parseExpression(), start, this.Position)
  }

  /**
   * Parses an expression statement.
   * @param start Start position.
   * @returns ExpressionStmt AST node.
   */
  private parseExprStmt(start: Position): ast.statements.ExpressionStmt {
    const expr = this.parseExpression()
    return new ast.statements.ExpressionStmt(expr, start, expr.end)
  }

  /**
   * Parses a declaration statement.
   * @param start Start position.
   * @returns DeclarationStmt AST node.
   */
  private parseDeclStmt(start: Position): ast.statements.DeclarationStmt {
    const decl = this.parseDecl(start)
    return new ast.statements.DeclarationStmt(decl, start, decl.end)
  }

  /**
   * Parses a default statement inside a match block.
   * @param start Start position.
   * @returns Default AST node.
   */
  private parseDefaultStmt(start: Position): ast.statements.Default {
    this.eat(Tokens.ARROW)
    const stmt: ast.statements.Statement[] = []
    if (!this.wheter(Tokens.LBRACE))
      stmt.push(this.parseStatement(this.Position))
    else
      stmt.concat(this.parseBlock(start))

    return new ast.statements.Default(stmt, start, this.Position)
  }

  /**
   * Parses a case/default statement inside a match block.
   * @param start Start position.
   * @returns Case or Default AST node.
   */
  private parseCaseStmt(start: Position): ast.statements.Case | ast.statements.Default {
    const isDefault = !!(this.wheter(Tokens.DEFAULT))
    if (isDefault)
      return this.parseDefaultStmt(start)

    const stmt: ast.statements.Statement[] = []
    const subject: ast.expressions.Expression[] = []
    while (!this.current.is(Tokens.ARROW)) {
      subject.push(this.parseExpression())
      this.wheter(Tokens.COMMA)
    }

    this.eat(Tokens.ARROW)
    if (!this.wheter(Tokens.LBRACE))
      stmt.push(this.parseStatement(this.Position))
    else
      stmt.concat(this.parseBlock(start))
    
    return new ast.statements.Case(subject, stmt, start, this.Position)
  }

  private parseWhile(start: Position): ast.statements.While {
    this.eat(Tokens.WHILE)

    const expr = this.parseExpression()
    const body = this.parseBlock(start)
    return new ast.statements.While(expr, body, start, this.Position)
  }

  private parseFor(start: Position): ast.statements.For | ast.statements.ForOf | ast.statements.ForIn {
    this.eat(Tokens.FOR)

    switch (this.current.type) {
      case Tokens.CONST: {
        const decl    = this.parseVarDecl(this.Position)
        const kind    = this.wheter(Tokens.OF) ? ast.statements.ForOf : this.eat(Tokens.IN) && ast.statements.ForIn
        const subject = this.parseExpression()
        const body    = this.parseBlock(this.Position)
        return new kind(decl, subject, body, start, this.Position)
      }
      case Tokens.VAR: {
        const decl = this.parseVarDef(this.Position)
        const expr = this.eat(Tokens.SEMICOLON) && this.parseExpression()
        const inc  = this.eat(Tokens.SEMICOLON) && this.parseExpression()
        const body = this.parseBlock(this.Position)
        return new ast.statements.For(decl, expr, inc, body, start, this.Position)
      }
    }

    this.syntaxError(`Invalid 'for' loop initializer '${this.current.TypeContent}'`)
  }

  private parseIf(start: Position): ast.statements.If {
    this.eat(Tokens.IF)
    const expr = this.parseExpression()

    const body = this.parseBlock(start)
    return new ast.statements.If(expr, body, start, this.Position)
  }

  /**
   * Parses a generic statement.
   * @param start Start position.
   * @returns Statement AST node.
   */
  private parseStatement(start: Position): ast.statements.Statement {
    switch (this.current.type) {
      case Tokens.VAR:
      case Tokens.CONST:      return this.parseDeclStmt(start)
      case Tokens.MATCH:
      case Tokens.IDENTIFIER: return this.parseExprStmt(start)
      case Tokens.DISSIPATE:  return this.parseDissipate(start)
      case Tokens.IF:         return this.parseIf(start)
      case Tokens.WHILE:      return this.parseWhile(start)
      case Tokens.FOR:        return this.parseFor(start)
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
  private parseTArray(start: Position, type: ast.types.TType): ast.types.TArray {
    this.eat(Tokens.LSQRBR)
    const size = this.wheter(Tokens.NUMBER)?.content
    this.eat(Tokens.RSQRBR)
    return new ast.types.TArray(type, size ? parseInt(size) : undefined, start, this.Position)
  }

  private parseTIdentifier(start: Position): ast.types.TType {
    const identifier = this.eat(Tokens.IDENTIFIER)
    const generics   = this.parseTGenericsExpr()
    const tIdentifier = new ast.types.TIdentifier(generics, identifier.content, start, this.Position)

    if (this.current.is(Tokens.LSQRBR))
      return this.parseTArray(this.Position, tIdentifier)

    return tIdentifier
  }

  private parseTFunction(start: Position): ast.types.TFunction {
    const sign = this.parseFunctionSign()

    const hasArrow = this.current.is(Tokens.ARROW)
    switch (true) {
      case sign.flag === Tokens.INLINE: this.syntaxError("Function types can not be inline") /* falls through */
      case !!sign.name: this.syntaxError("Function types must not have a name") /* falls through */
      case !sign.ret:   this.syntaxError("Function types must have a return type") /* falls through */
      case hasArrow:    this.syntaxError("Function types can not be arrow functions")
    }

    return new ast.types.TFunction(sign, start, this.Position)
  }

  private parseTGenericsDecl(): Maybe<string[]> {
    this.eat(Tokens.LESS)
    const generics: string[] = []

    while (!this.current.is(Tokens.GREATER)) {
      generics.push(this.eat(Tokens.IDENTIFIER).content)
      if (!this.wheter(Tokens.COMMA) && !this.current.is(Tokens.GREATER))
        this.syntaxError("Missing comma between generic type parameters")
    }

    this.eat(Tokens.GREATER)
    return generics
  }

  private parseTGenericsExpr(): Maybe<ast.types.TType[]> {
    if (!this.wheter(Tokens.LESS))
      return undefined

    const generics: ast.types.TType[] = []
    while (!this.current.is(Tokens.GREATER)) {
      generics.push(this.parseTType())
      if (!this.wheter(Tokens.COMMA) && !this.current.is(Tokens.GREATER))
        this.syntaxError("Missing comma between generic type parameters")
    }

    this.eat(Tokens.GREATER)
    return generics
  }

  private parseTLiteral(): ast.types.TType {
    switch (this.current.type) {
      case Tokens.IDENTIFIER: return this.parseTIdentifier(this.Position)
      case Tokens.FN:         return this.parseTFunction(this.Position)
    }

    this.syntaxError(`Unknown type '${this.current.content}'`)
  }

  private parseTType(type?: ast.types.TType, prevOp?: Token): ast.types.TType {
    const start = this.Position
    if (!type)
      type = this.parseTLiteral()

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
      const rhs = this.parseTType(undefined, op)
      type = new ast.types.TBinary(op, type, rhs, start, this.Position)
    }
  }

  // ===== DECLARATION PARSING =====

  private parseClassDecl(start: Position): ast.declarations.ClassDecl {
    let specifier: Tokens.PUB | Tokens.PRIVATE | Tokens.PROTECTED = Tokens.PUB
    let decl: ast.declarations.NameableDecl

    switch (this.current.type) {
      case Tokens.PUB:
      case Tokens.PRIVATE:
      case Tokens.PROTECTED:
        specifier = this.eat(this.current.type).type as Tokens.PUB | Tokens.PRIVATE | Tokens.PROTECTED
    }

    switch (this.current.type) {
      case Tokens.FN:
      case Tokens.VAR:
      case Tokens.TYPE:
      case Tokens.CONST:
      case Tokens.CLASS:
      case Tokens.ASYNC:
      case Tokens.INTERFACE:
        decl = this.parseDecl(start) as ast.declarations.NameableDecl; break
      default: this.syntaxError(`Invalid class member '${this.current.TypeContent}'`)
    }

    return new ast.declarations.ClassDecl(specifier, decl, start, this.Position)
  }

  /**
   * Parses a class declaration
   * @param start Starting position
   * @returns Class AST node
   */
  private parseClass(start: Position): ast.declarations.Class {
    this.eat(Tokens.CLASS)
    const name     = this.eat(Tokens.IDENTIFIER).content
    const generics = this.current.is(Tokens.LESS) && this.parseTGenericsDecl()
    const inhertis = this.wheter(Tokens.EXTENDS) && this.parseTType()
    const body     = []

    this.eat(Tokens.LBRACE)
    while (!this.current.is(Tokens.RBRACE))
      body.push(this.parseClassDecl(this.Position))

    this.eat(Tokens.RBRACE)
    return new ast.declarations.Class(generics, body, inhertis, name, start, this.Position)
  }

  /**
   * Parses a variable declaration
   * @param start Starting position
   * @returns Variable declaration AST node
   */
  private parseVarDecl(start: Position): ast.declarations.VariableDecl {
    this.eat(Tokens.CONST)
    const name = this.eat(Tokens.IDENTIFIER).content

    if (!this.wheter(Tokens.COLON))
      return new ast.declarations.VariableDecl(true, undefined, name, start, this.Position)

    const type = this.parseTType()
    return new ast.declarations.VariableDecl(true, type, name, start, this.Position)
  }

  /**
   * Parses a variable definition
   * @param start Starting position
   * @returns Variable definition AST node
   */
  private parseVarDef(start: Position): ast.declarations.VariableDef {
    const isConst = !!this.wheter(Tokens.CONST)
    !isConst && this.eat(Tokens.VAR)

    const name = this.eat(Tokens.IDENTIFIER).content
    const type = this.wheter(Tokens.COLON) && this.parseTType()

    this.eat(Tokens.EQUAL)
    const value = this.parseExpression()
    return new ast.declarations.VariableDef(isConst, type, value, name, start, this.Position)
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
  private parseInterface(start: Position): ast.declarations.InterfaceDecl {
    this.eat(Tokens.INTERFACE)
    const name     = this.eat(Tokens.IDENTIFIER).content
    const generics = this.current.is(Tokens.LESS) && this.parseTGenericsDecl()
    const inherits = this.wheter(Tokens.EXTENDS) && this.parseTType()

    this.eat(Tokens.LBRACE)
    const body: ast.functions.FunctionSignature[] = []
    while (!this.current.is(Tokens.RBRACE)) {
      body.push(this.parseFunctionSign())
      this.wheter(Tokens.COMMA) // allows trailing comma
    }

    this.eat(Tokens.RBRACE)
    return new ast.declarations.InterfaceDecl(generics, inherits, body, name, start, this.Position)
  }

  /**
   * Parses a type declaration
   * @param start 
   * @returns Type AST node
   */
  private parseType(start: Position): ast.declarations.TypeDecl {
    this.eat(Tokens.TYPE)
    const name = this.eat(Tokens.IDENTIFIER).content
    const generics = this.current.is(Tokens.LESS) && this.parseTGenericsDecl()

    this.eat(Tokens.EQUAL)
    const type = this.parseTType()
    return new ast.declarations.TypeDecl(generics, type, name, start, this.Position)
  }

  private parseFunctionParam(start: Position): ast.functions.Param {
    const name = this.eat(Tokens.IDENTIFIER).content
    this.eat(Tokens.COLON)
    const type = this.parseTType()
    return new ast.functions.Param(name, type, start, this.Position)
  }

  /**
   * Parses function parameters.
   * @returns Array of Param AST nodes.
   */
  private parseFunctionParams(): ast.functions.Param[] {
    this.eat(Tokens.LPAREN)
    const params: ast.functions.Param[] = []
    while (!this.current.is(Tokens.RPAREN)) {
      params.push(this.parseFunctionParam(this.Position))
      if (!this.wheter(Tokens.COMMA) && !this.current.is(Tokens.RPAREN))
        this.syntaxError("Missing comma between function parameters")
    }

    this.eat(Tokens.RPAREN)
    return params
  }

  private parseModuleDecl(start: Position): ast.declarations.Declaration {
    switch (this.current.type) {
      case Tokens.FN:
      case Tokens.ASYNC:
      case Tokens.INLINE:
      case Tokens.EXTERN:
      case Tokens.MODULE:
      case Tokens.INTERFACE:
      case Tokens.IMPORT:
      case Tokens.CONST:
      case Tokens.CLASS:
      case Tokens.FROM:
      case Tokens.TYPE: return this.parseDecl(start)
    }

    this.syntaxError(`Invalid module declaration '${this.current.TypeContent}'`)
  }

  /**
   * Parses the body of a module.
   * @returns Array of declaration AST nodes.
   */
  private parseModuleBody(start: Position): ast.declarations.Declaration[] {
    this.eat(Tokens.LBRACE)
    const body = []

    while (!this.current.is(Tokens.RBRACE))
      body.push(this.parseModuleDecl(start))

    this.eat(Tokens.RBRACE)
    return body
  }

  /**
   * Parses a module declaration.
   * @param start Start position.
   * @returns Module AST node.
   */
  private parseModule(start: Position): ast.declarations.Module {
    this.eat(Tokens.MODULE)
    const name = (this.wheter(Tokens.IDENTIFIER) || this.eat(Tokens.STRING)).content
    const body = this.parseModuleBody(start)
    return new ast.declarations.Module(body, name, start, this.Position)
  }

  /**
   * Parses a deep import symbol (e.g., `std::io::File`).
   * @returns The full import symbol as a string.
   */
  private parseDeepImport(): string {
    let symbol = (this.wheter(Tokens.IDENTIFIER) || this.wheter(Tokens.STRING))?.content
    if (!symbol)
      this.syntaxError("Expected identifier or string as import symbol")

    while (this.wheter(Tokens.MOD_ACCESSOR)) {
      const prevS: string = symbol
      symbol = (this.wheter(Tokens.IDENTIFIER) || this.eat(Tokens.STRING)).content
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
  private parseImport(start: Position, from?: string): ast.declarations.Import {
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
      return new ast.declarations.Import([], module, start, this.Position)
    }

    /**
     * If `from` is provided and the next token is a star (`*`), it means all symbols are being imported:
     * 
     * ```
     * from std::io import *
     * ```
     */
    if (this.wheter(Tokens.STAR))
      return new ast.declarations.Import("*", from, start, this.Position)

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
    } while (this.wheter(Tokens.COMMA))

    return new ast.declarations.Import(symbols, from, start, this.Position)
  }

  /**
   * Parses a 'from' import statement.
   * @param start Start position.
   * @returns Import AST node.
   */
  private parseFrom(start: Position): ast.declarations.Import {
    this.eat(Tokens.FROM)
    const module = this.parseDeepImport()
    return this.parseImport(start, module)
  }

  private parseExtern(start: Position): ast.declarations.Extern {
    this.eat(Tokens.EXTERN)
    const sign = this.parseFunctionSign()

    switch (true) {
      case !!sign.flag: this.syntaxError("Extern functions can not have any flag") /* falls through */
      case !sign.name:  this.syntaxError("Extern functions must have a name")
    }

    return new ast.declarations.Extern(sign, start, this.Position)
  }

  private parseFunction(start: Position): ast.declarations.FunctionDecl {
    const sign = this.parseFunctionSign()

    if (!sign.name)
      this.syntaxError("Functions declarations must have a name")

    const body = this.parseBlock(start)
    return new ast.declarations.FunctionDecl(sign, body, start, this.Position)
  }

  /**
   * Parses a declaration (var, const, module, function, import, from).
   * @param start Start position.
   * @returns Declaration AST node.
   */
  private parseDecl(start: Position): ast.declarations.Declaration {
    switch(this.current.type) {
      case Tokens.INLINE:
      case Tokens.ASYNC:
      case Tokens.FN:        return this.parseFunction(start)
      case Tokens.EXTERN:    return this.parseExtern(start)
      case Tokens.VAR:
      case Tokens.CONST:     return this.parseVarDef(start)
      case Tokens.CLASS:     return this.parseClass(start)
      case Tokens.MODULE:    return this.parseModule(start)
      case Tokens.FROM:      return this.parseFrom(start)
      case Tokens.IMPORT:    return this.parseImport(start)
      case Tokens.INTERFACE: return this.parseInterface(start)
      case Tokens.TYPE:      return this.parseType(start)
    }

    this.syntaxError(`Unknown declaration '${this.current.TypeContent}'`)
  }

  // ----- EXPRESSION PARSING ----- //

  /**
   * Parses a match expression.
   * @param start Start position.
   * @returns Match AST node.
   */
  private parseMatch(start: Position): ast.expressions.Match {
    this.eat(Tokens.MATCH)
    const subject = this.parseExpression()
    this.eat(Tokens.LBRACE)

    const body: ast.statements.Case[] = []
    let fallThrough: Maybe<ast.statements.Default> = undefined
    while (!this.current.is(Tokens.RBRACE)) {
      const stmt = this.parseCaseStmt(this.Position)
      switch (true) {
        case !!fallThrough: this.syntaxError("A default statement has been already declared"); break
        case stmt.kind === ast.statements.StatementKind.Default: fallThrough = stmt as ast.statements.Default; break
        default: body.push(stmt as ast.statements.Case); break
      }

      this.wheter(Tokens.COMMA) // this allows trailing comma, because only eats it if exists
    }

    this.eat(Tokens.RBRACE)
    return new ast.expressions.Match(subject, body, fallThrough, start, this.Position)
  }

  /**
   * Parses a function expression
   * @param start Start position
   * @returns Lambda expression AST node
   */
  private parseLambda(start: Position): ast.expressions.Lambda {
    const sign = this.parseFunctionSign()
    if (sign.flag && sign.flag === Tokens.INLINE)
      this.syntaxError("A function expression cannot be inlined")

    this.eat(Tokens.ARROW)
    const body = this.parseBlock(this.Position)
    sign.name  ??= `anonymous_${crypto.randomUUID()}`
    return new ast.expressions.Lambda(sign, body, start, this.Position)
  }

  /**
   * Parses a parenthesized expression.
   * @returns Expression AST node.
   */
  private parseParen(): ast.expressions.Expression {
    this.eat(Tokens.LPAREN)
    const expr = this.parseExpression()
    this.eat(Tokens.RPAREN)
    return expr
  }

  /**
   * Parses a function call expression.
   * @param start Start position.
   * @param callee The callee expression.
   * @returns Call AST node.
   */
  private parseCall(start: Position, callee: ast.expressions.Expression, generics?: ast.types.TType[]): ast.expressions.Call {
    this.eat(Tokens.LPAREN)
    const args: ast.expressions.Expression[] = []
    while (!this.current.is(Tokens.RPAREN)) {
      args.push(this.parseExpression())
      this.wheter(Tokens.COMMA)
    }

    this.eat(Tokens.RPAREN)
    return new ast.expressions.Call(generics, callee, args, start, this.Position)
  }

  /**
   * Parses array access or index expressions.
   * @returns Expression AST node.
   */
  private parseArrayOrIndex(): ast.expressions.Expression {
    this.eat(Tokens.LSQRBR)
    const expr = this.parseExpression()
    this.eat(Tokens.RSQRBR)
    return expr
  }

  /**
   * Parses grouping constructs (arrays, parentheses).
   * @returns Expression AST node.
   */
  private parsePairs(): ast.expressions.Expression {
    switch (this.current.type) {
      case Tokens.LSQRBR: return this.parseArrayOrIndex()
      case Tokens.LPAREN: return this.parseParen()
    }

    this.syntaxError(`Unkown grouping token '${this.current.content}'`)
  }

  /**
   * Parses unary expressions (negation, increment, etc.).
   * @returns Unary expression AST node.
   */
  private parseUnary(): ast.expressions.Expression {
    const start = this.Position

    switch (this.current.type) {
      case Tokens.PLUS:
      case Tokens.MINUS:
      case Tokens.INCREMENT:
      case Tokens.DECREMENT:
      case Tokens.BANG:
      case Tokens.AWAIT:
      case Tokens.NOT:
      case Tokens.NEW:
      case Tokens.DROP:
      case Tokens.AMPER: {
        const op = this.eat(this.current.type)
        return new ast.expressions.Unary(op, this.parseExpression(), start, this.Position)
      }
    }

    return this.parsePairs()
  }

  /**
   * Parses literal values (numbers, strings, identifiers, etc.).
   * @returns Literal AST node.
   */
  private parseLiteral(): ast.expressions.Expression {
    const start = this.Position

    switch (this.current.type) {
      case Tokens.FN:
      case Tokens.ASYNC:
      case Tokens.INLINE: return this.parseLambda(start)
      case Tokens.MATCH:  return this.parseMatch(start)
      case Tokens.NUMBER:
      case Tokens.CHAR: {
        const lit = new ast.expressions.Atomic(this.current.content, start, this.Position)
        
        this.next()
        return lit
      }
      case Tokens.STRING: {
        const str = new ast.expressions.String(this.current.content, start, this.Position)

        this.next()
        return str
      }
      case Tokens.IDENTIFIER: {
        const ident = new ast.expressions.Identifier(this.current.content, start, this.Position)
        let generics: Maybe<ast.types.TType[]> = undefined

        if (this.next().is(Tokens.LESS))
          generics = this.parseTGenericsExpr()

        switch (this.current.type as Tokens) {
          case Tokens.LPAREN: return this.parseCall(start, ident, generics)
        }

        return ident
      }
    }

    return this.parseUnary()
  }

  /**
   * Parses an expression (entry point for expression parsing).
   * @param expr Optional left-hand side expression.
   * @param prevOp Optional operator for precedence handling.
   * @returns Expression AST node.
   */
  private parseExpression(expr?: ast.expressions.Expression, prevOp?: Token): ast.expressions.Expression {
    const start = this.Position
    if (!expr)
      expr = this.parseLiteral()

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
      const rhs = this.parseExpression(undefined, op)
      expr = new ast.expressions.Binary(op, expr, rhs, start, this.Position)
    }
  }

  /**
   * Gets the current lexer position.
   */
  public get Position(): Position {
    return this.lexer.Position
  }
}
