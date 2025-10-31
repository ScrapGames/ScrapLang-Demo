import { SyntaxError }    from "@/errors.ts"
import { Undefinedable }  from "@/typings.ts"
import { Position }       from "@frontend/position.ts"
import type { Reader }    from "@frontend/typings.ts"
import { Token, Tokens, TOKEN_MAP, stringify } from "@frontend/tokens/tokens.ts"
import Lexer             from "./lexer.ts"
import * as ast          from "@frontend/ast/nodes/index.ts"
import { FunctionFlags } from "@frontend/ast/nodes/functions.ts"

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
   * @returns Object { flag, name, params, hasArrow }
   */
  private parseFunctionSign():
    { flag: Undefinedable<FunctionFlags>,
      name: Undefinedable<string>,
      params: ast.functions.Param[],
      hasArrow: boolean
    } {
    const flag = (this.wheter(Tokens.INLINE) || this.wheter(Tokens.ASYNC))?.type as Undefinedable<FunctionFlags>
    if (!this.wheter(Tokens.FN))
      this.syntaxError("Functions can only has one flag")

    const name     = this.wheter(Tokens.IDENTIFIER)?.content
    const params   = this.parseFunctionParams()
    const hasArrow = !!this.wheter(Tokens.ARROW)
    return { flag, name, params, hasArrow }
  }

  private parseFunction(
    start: Position,
    isExpr: true
  ): ReturnType<typeof this.parseFunctionExpr>

  private parseFunction(
    start: Position,
    isExpr: false
  ): ReturnType<typeof this.parseFunctionDef>

  /**
   * Parses a function (declaration or expression).
   * @param start Starting position.
   * @returns A Function AST node.
   */
  private parseFunction(start: Position, isExpr: boolean) {
    const { flag, name, params, hasArrow } = this.parseFunctionSign()
    if (isExpr)
      return this.parseFunctionExpr(start, flag, name, params, hasArrow)

    return this.parseFunctionDef(start, flag, name!, params)
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
    if (this.current.is(Tokens.FN))
      return new ast.statements.Dissipate(this.parseFunction(start, true), start, this.Position)

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
   * Parses a class declaration.
   * @param start Starting position.
   * @returns Class AST node.
   */
  private parseClass(start: Position): ast.declarations.Class {
    this.eat(Tokens.CLASS)
    const name = this.eat(Tokens.IDENTIFIER).content
    const body = []

    this.eat(Tokens.LBRACE)
    while (!this.current.is(Tokens.RBRACE))
      body.push(this.parseClassDecl(this.Position))

    this.eat(Tokens.RBRACE)
    return new ast.declarations.Class(body, name, start, this.Position)
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

    const type = this.parseTType(this.Position)
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
    const type = this.wheter(Tokens.COLON) && this.parseTType(this.Position)

    this.eat(Tokens.EQUAL)
    const value = this.parseExpression()
    return new ast.declarations.VariableDef(isConst, type, value, name, start, this.Position)
  }

  /**
   * Parses an interface declaration.
   * @throws Always throws "Unimplemented declaration".
   */
  private parseInterface(_start: Position): ast.declarations.Interface {
    this.syntaxError("Unimplemented declaration")
  }

  /**
   * Parses a type declaration.
   * @throws Always throws "Unimplemented declaration".
   */
  private parseType(_start: Position): ast.declarations.Type {
    this.syntaxError("Unimplemented declaration")
  }

  /**
   * Parses function parameters.
   * @returns Array of Param AST nodes.
   */
  private parseFunctionParams(): ast.functions.Param[] {
    this.eat(Tokens.LPAREN)

    this.eat(Tokens.RPAREN)
    return []
  }

  /**
   * Parses a function body, supporting arrow or block syntax.
   * @param hasArrow True if it's an arrow function.
   * @returns Array of statement AST nodes.
   */
  private parseFunctionBody(hasArrow: boolean): ast.statements.Statement[] {
    if (hasArrow) {
      const expr = this.parseExpression()
      return [new ast.statements.ExpressionStmt(expr, expr.start, this.Position)]
    }

    return this.parseBlock(this.Position)
  }

  /**
   * Parses a function declaration.
   * @param start Start position.
   * @param flag Function flag (inline, async).
   * @param name Function name.
   * @param params Function parameters.
   * @returns Function AST node.
   */
  private parseFunctionDef(
    start: Position,
    flag: Undefinedable<FunctionFlags>,
    name: string,
    params: ast.functions.Param[]
  ): ast.declarations.FunctionDef {
    const body = this.parseFunctionBody(false)
    return new ast.declarations.FunctionDef(params, body, flag, name, start, this.Position)
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
    const { flag, name, params, hasArrow } = this.parseFunctionSign()

    switch (true) {
      case hasArrow:
      case isAnon:   this.syntaxError("Anonymous function can not be extern"); break
      case !!flag:   this.syntaxError("Extern functions can not have any flag"); break
    }


    const fn = new ast.declarations.FunctionDecl(params, name, start, this.Position)
    return new ast.declarations.Extern(fn, start, this.Position)
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
      case Tokens.FN:        return this.parseFunction(start, false)
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
    let fallThrough: Undefinedable<ast.statements.Default> = undefined
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
   * Parses a function expression (arrow function, anonymous).
   * @param start Start position.
   * @param flag Function flag.
   * @param name Function name.
   * @param params Function parameters.
   * @param hasArrow True if arrow function syntax is used.
   * @returns Function expression AST node.
   */
  private parseFunctionExpr(
    start: Position,
    flag: Undefinedable<FunctionFlags>,
    name: string,
    params: ast.functions.Param[],
    hasArrow: boolean
  ): ast.expressions.FunctionExpr {
    if (flag && flag === Tokens.INLINE)
      this.syntaxError("A function expression cannot be inlined")

    const body = this.parseFunctionBody(hasArrow)
    return new ast.expressions.FunctionExpr(name, params, body, flag, start, this.Position)
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
  private parseCall(start: Position, callee: ast.expressions.Expression): ast.expressions.Call {
    this.eat(Tokens.LPAREN)
    const args: ast.expressions.Expression[] = []
    while (!this.current.is(Tokens.RPAREN)) {
      args.push(this.parseExpression())
      this.wheter(Tokens.COMMA)
    }

    this.eat(Tokens.RPAREN)
    return new ast.expressions.Call(callee, args, start, this.Position)
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
      case Tokens.INLINE: return this.parseFunction(start, true)
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
      case Tokens.IDENTIFIER:  {
        const ident = new ast.expressions.Identifier(this.current.content, start, this.Position)
        const forward = this.next()
        
        switch (forward.type) {
          case Tokens.LPAREN: return this.parseCall(start, ident)
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
