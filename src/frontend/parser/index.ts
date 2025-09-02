import { SyntaxError } from "@/errors.ts"
import { Undefinedable } from "@/typings.ts"

import { Position } from "@frontend/position.ts"
import type { Reader } from "@frontend/typings.ts"
import { Token, Tokens, TOKEN_MAP, stringify } from "@frontend/tokens/tokens.ts"
import Lexer from "@frontend/lexer/lexer.ts"
import { FunctionFlags } from "@frontend/ast/nodes/unclassified.ts"
import * as ast from "@frontend/ast/nodes/index.ts"

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
      return this.moveN(n)

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

  // ===== UNCLASSIFIED PARSING =====

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

  /**
   * Parses a function (declaration or expression).
   * @param start Starting position.
   * @returns A Function AST node.
   */
  private parseFunction(start: Position): ast.declarations.Function | ast.expressions.Function {
    const [flag, name, params, isAnon, hasArrow] = this.parseFunctionSign()
    const isExpr = isAnon || hasArrow
    if (isExpr)
      return this.parseFunctionExpr(start, flag, name, params, hasArrow)

    return this.parseFunctionDecl(start, flag, name, params)
  }

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

  // ===== DECLARATION PARSING =====

  /**
   * Parses a class declaration.
   * @param start Starting position.
   * @returns Class AST node.
   */
  private parseClass(start: Position): ast.declarations.Class {
    const name = this.eat(Tokens.IDENTIFIER).content

    do
      this.next()
    while (!this.current.is(Tokens.RBRACE))

    return new ast.declarations.Class([], name, start, this.Position)
  }

  /**
   * Parses a variable declaration.
   * @param start Starting position.
   * @returns Variable AST node.
   */
  private parseVar(
    start: Position
  ): ast.declarations.Variable {
    const isConst = !!this.wheter(Tokens.CONST)

    !isConst && this.eat(Tokens.VAR)
    const name = this.eat(Tokens.IDENTIFIER).content
    this.eat(Tokens.EQUAL)

    const value = this.parseExpression()
    return new ast.declarations.Variable(name, isConst, value, start, this.Position)
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
  private parseFunctionParams(): ast.unclassified.Param[] {
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
   * Parses a function signature.
   * @returns Tuple [flag, name, params, isAnonymous, hasArrow].
   */
  private parseFunctionSign(): [Undefinedable<FunctionFlags>, string, ast.unclassified.Param[], boolean, boolean] {
    const flag = (this.wheter(Tokens.INLINE) || this.wheter(Tokens.ASYNC))?.type as Undefinedable<FunctionFlags>
    if (!this.wheter(Tokens.FN))
      this.syntaxError("Functions can only has one flag")

    const name     = this.wheter(Tokens.IDENTIFIER)?.content
    const params   = this.parseFunctionParams()
    const hasArrow = !!this.wheter(Tokens.ARROW)
    return [flag, name ?? "anonymous", params, !name, hasArrow]
  }

  /**
   * Parses a function declaration.
   * @param start Start position.
   * @param flag Function flag (inline, async).
   * @param name Function name.
   * @param params Function parameters.
   * @returns Function AST node.
   */
  private parseFunctionDecl(
    start: Position,
    flag: Undefinedable<FunctionFlags>,
    name: string,
    params: ast.unclassified.Param[]
  ): ast.declarations.Function {
    const body = this.parseFunctionBody(false)
    return new ast.declarations.Function(params, body, flag, name, start, this.Position)
  }

  /**
   * Parses the body of a module.
   * @returns Array of declaration AST nodes.
   */
  private parseModuleBody(): ast.declarations.Declaration[] {
    this.eat(Tokens.LBRACE)
    const body = []

    while (!this.current.is(Tokens.RBRACE))
      body.push(this.parseDecl(this.Position))

    this.eat(Tokens.RBRACE)
    return body
  }

  /**
   * Parses a module declaration.
   * @param start Start position.
   * @returns Module AST node.
   */
  private parseModule(start: Position): ast.declarations.Module {
    const name = this.eat(Tokens.IDENTIFIER).content
    const body = this.parseModuleBody()
    return new ast.declarations.Module(body, name, start, this.Position)
  }

  /**
   * Parses an import declaration.
   * @param start Start position.
   * @param from Optional module name.
   * @returns Import AST node.
   */
  private parseImport(start: Position, from?: string): ast.declarations.Import {
    this.eat(Tokens.IMPORT)

    if (!from)
      return new ast.declarations.Import([], this.eat(Tokens.IDENTIFIER).content, start, this.Position)

    if (this.wheter(Tokens.STAR))
      return new ast.declarations.Import("*", from, start, this.Position)

    const symbols: string[] = []
    do {
      let symbol = (this.wheter(Tokens.IDENTIFIER) || this.wheter(Tokens.STRING))?.content
      if (!symbol)
        this.syntaxError("Expected identifier or string as import symbol")

      while (this.wheter(Tokens.MOD_ACCESSOR))
        symbol = `${symbol}::${this.eat(Tokens.IDENTIFIER).content}`

      symbols.push(symbol)
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
    let module = this.eat(Tokens.IDENTIFIER).content
    while (this.wheter(Tokens.MOD_ACCESSOR))
      module = `${module}::${this.eat(Tokens.IDENTIFIER).content}`

    return this.parseImport(start, module)
  }

  /**
   * Parses a declaration (var, const, module, function, import, from).
   * @param start Start position.
   * @returns Declaration AST node.
   */
  private parseDecl(start: Position): ast.declarations.Declaration {
    switch(this.current.type) {
      case Tokens.VAR:
      case Tokens.CONST:  return this.parseVar(start)
      case Tokens.MODULE: return this.parseModule(start)
      case Tokens.INLINE:
      case Tokens.ASYNC:
      case Tokens.FN:     return this.parseFunction(start) as ast.declarations.Function
      case Tokens.FROM:   return this.parseFrom(start)
      case Tokens.IMPORT: return this.parseImport(start)
    }

    this.syntaxError(`Unknown declaration '${this.current.TypeContent}'`)
  }

  // ----- STATEMENT PARSING ----- //

  /**
   * Parses a 'dissipate' statement.
   * @param start Start position.
   * @returns Dissipate AST node.
   */
  private parseDissipate(start: Position): ast.statements.Dissipate {
    this.eat(Tokens.DISSIPATE)
    let fn: ast.declarations.Function | ast.expressions.Expression
    switch (this.current.type) {
      case Tokens.FN: fn = this.parseFunction(start); break
      default:        fn = this.parseExpression(); break
    }

    return new ast.statements.Dissipate(fn, start, this.Position)
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

  private parseDeclStmt(start: Position): ast.statements.DeclarationStmt {
    const decl = this.parseDecl(start)
    return new ast.statements.DeclarationStmt(decl, start, decl.end)
  }

  private parseDefaultStatement(start: Position): ast.statements.Default {
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
  private parseCaseStatement(start: Position): ast.statements.Case | ast.statements.Default {
    const isDefault = !!(this.wheter(Tokens.DEFAULT))
    if (isDefault)
      return this.parseDefaultStatement(start)

    const stmt: ast.statements.Statement[] = []
    const subject = this.parseExpression()
    this.eat(Tokens.ARROW)
    if (!this.wheter(Tokens.LBRACE))
      stmt.push(this.parseStatement(this.Position))
    else
      stmt.concat(this.parseBlock(start))
    
    return new ast.statements.Case(subject, stmt, start, this.Position)
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
    }

    this.syntaxError(`Unknown statement '${this.current.TypeContent}'`)
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
      const stmt = this.parseCaseStatement(this.Position)
      switch (true) {
        case !!fallThrough: this.syntaxError("A default statement has been already declared"); break
        case stmt.kind === ast.statements.StatementKind.Default: fallThrough = stmt as ast.statements.Default; break
        default: body.push(stmt as ast.statements.Case); break
      }

      this.wheter(Tokens.COMMA) // this allows trailing comma, because only eats them if they exist
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
    params: ast.unclassified.Param[],
    hasArrow: boolean
  ): ast.expressions.Function {
    if (flag && flag === Tokens.INLINE)
      this.syntaxError("A function expression cannot be inlined")

    const body = this.parseFunctionBody(hasArrow)
    return new ast.expressions.Function(name, params, body, flag, start, this.Position)
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
      case Tokens.INLINE: return this.parseFunction(start) as ast.expressions.Function
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
