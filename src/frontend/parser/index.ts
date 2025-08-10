import { Position } from "@frontend/position.ts"

// TOKENS
import { Token, Tokens, TOKEN_MAP } from "@frontend/tokens/tokens.ts"

// READER INTERFACE
import type { Reader } from "@frontend/typings.ts"

// LEXER
import Lexer from "@frontend/lexer/lexer.ts"

// CONTEXT
import Context, { ContextType } from "@frontend/parser/context.ts"

// AST
import * as ast from "@frontend/ast/nodes/index.ts"
import { ASTNode } from "@frontend/ast/ast.ts"

import { SyntaxError } from "@errors"


export default class Parser implements Reader<Token, Tokens> {
  private lexer: Lexer
  private context: Context
  currentTok: Token

  private constructor(lexer: Lexer) {
    this.lexer = lexer
    this.context = new Context(ContextType.MODULE)
  }

  public static init(lexer: Lexer) {
    const p = new this(lexer)
    p.next()

    return p
  }

  /**
   * Causes the program stop showing an error message
   * @param message Error message
   */
  public syntaxError(message: string): never {
    throw new SyntaxError(message, "MODULE", this.currentTok.position)
  }

  /**
   * Prints a warning in console
   * @param message Warning message
   */
  public syntaxWarn(message: string): void {
    console.warn(message)
  }

  next(): Token {
    return this.nextN(1)
  }

  nextN(n: number): Token {
    for (let i = 0; i < n; i++)
      this.currentTok = this.lexer.scan()

    return this.currentTok
  }

  ahead(): Token {
    const pos = this.Position
    const tok = this.lexer.scan()

    this.setTo(pos)
    return tok
  }

  hasEnd(): boolean {
    return this.lexer.hasEnd()
  }

  setTo(newPos: Position): void {
    this.lexer.setTo(newPos)
  }

  check(maybe: Tokens): boolean {
    return this.lexer.check(TOKEN_MAP.get(maybe)!)
  }

  /**
   * Consumes the current token advancing in the `lexer source` and checks if the actual token after the advancement is equals to `shouldBe`
   * @param expected Token to compare with `currentTok`
   * @param message Error message if `currenTok.content` is not equal to `shouldBe`
   * @throws `ParsingError` if `currenTok.content` is not equal to `shouldBe`
   * @returns The next token in the source
   */
  private expects(expected: Tokens, message: string) {
    const nextToken = this.next()
    if (nextToken.type === expected)
      return nextToken
      
    this.syntaxError(message)
  }

  /**
   * Safety syntactic sugar of `next`
   * @param type `Tokens` value which correspond to the current token
   * @returns The next token in the source
   */
  private eat(type: Tokens): Token {
    if (!this.currentTok.is(type))
      this.syntaxError(`The current token was supposed to be a '${TOKEN_MAP.get(type)}' but a '${TOKEN_MAP.get(this.currentTok.type)}' was encountered`)

    const current = this.currentTok
    this.next()

    return current
  }

  private parseModule(): ast.declarations.Module {
    if (this.context.Type !== ContextType.MODULE)
      this.syntaxError("A module only can be declared inside another module")

    this.eat(Tokens.MODULE)
    const name = this.eat(Tokens.IDENTIFIER).content

    this.eat(Tokens.LBRACE)
    const body: ast.declarations.Declaration[] = []
    while (!this.currentTok.is(Tokens.RBRACE)) {
      body.push(this.parseDeclaration())
    }

    return new ast.declarations.Module(name, body, this.Position)
  }

  private parseClass(): ast.declarations.Class {
    if (this.context.Type !== ContextType.MODULE)
      this.syntaxError("A class only can be declared inside a module")

    this.eat(Tokens.CLASS)
    const name = this.eat(Tokens.IDENTIFIER).content

    this.eat(Tokens.LBRACE)
    while (!this.currentTok.is(Tokens.RBRACE)) {
      this.next()
    }

    this.eat(Tokens.RBRACE)

    return new ast.declarations.Class(name, [], this.Position)
  }

  private parseVar(): ast.declarations.Variable {
    const isConst = this.currentTok.is(Tokens.CONST)
    this.eat(Tokens.VAR | Tokens.CONST)

    const name = this.eat(Tokens.IDENTIFIER).content

    this.eat(Tokens.EQUAL)
    const value = this.parseExpression()

    return new ast.declarations.Variable(name, isConst, value, this.Position)
  }

  /**
   * TODO: Make the type parsing
   * @returns
   */
  private parseType(): ast.declarations.Type {
    this.syntaxWarn(`${this.currentTok.content} yet not supported`)

    if (this.context.Type !== ContextType.MODULE)
      this.syntaxError("A type only can be declared inside a module")

    const name = this.eat(Tokens.IDENTIFIER).content
    this.eat(Tokens.EQUAL)

    while (!this.currentTok.cmp("\n")) {
      this.next()
    }

    return new ast.declarations.Type(name, this.Position)
  }

  private parseFunctionDecl(): ast.declarations.Function  {
    this.eat(Tokens.FN) // safety call: this function is reached only if 'fn' kw was found
    const pos = this.Position
    const name = this.eat(Tokens.IDENTIFIER)
    
    const body: ASTNode[] = []
    // PARAMETER CONSUMING
    this.eat(Tokens.LPAREN)
    while (!this.currentTok.is(Tokens.RPAREN)) {
      // TODO: Add a parameter ast node and store them
      this.next()
    }
    this.eat(Tokens.RPAREN)

    this.eat(Tokens.LBRACE)
    while (!this.currentTok.is(Tokens.RBRACE)) {
      body.push(this.parseDeclaration())
    }

    this.eat(Tokens.RBRACE)
    return new ast.declarations.Function(name.content, new Map(), pos, [], body)
  }

  private parseDeclaration(): ast.declarations.Declaration {
    const statement = this.currentTok

    switch(statement.type) {
      case Tokens.VAR:
      case Tokens.CONST:  return this.parseVar()
      case Tokens.MODULE: return this.parseModule()
      case Tokens.TYPE:   return this.parseType()
      case Tokens.FN:     return this.parseFunctionDecl()
    }

    this.syntaxError(`'${statement.TypeContent}' is not a valid statement`)
  }

  // ----- EXPRESSION PARSING ----- //

  private parseLiteral(): ast.expressions.Expression {
    const literal = this.currentTok

    /**
     * Since not all operators are always treated as such
     * Some tokens that are grouped as operators could mean the begin of an expression.
     * Like this: `[a, b, c]`. Where the left bracket marks the begin of a literal array
     */
    switch (literal.type) {
      case Tokens.IDENTIFIER: return new ast.expressions.Identifier(literal.content, this.Position)
      case Tokens.STRING:     return new ast.expressions.String(literal.content, this.Position)
      case Tokens.NUMBER:     return new ast.expressions.Numeric(parseInt(literal.content), this.Position)

      /* case Tokens.PLUS:
      case Tokens.MINUS:
      case Tokens.INCREMENT:
      case Tokens.DECREMENT:
      case Tokens.STAR:
      case Tokens.SLASH:
      case Tokens.PERCEN:
      case Tokens.ADD_ASSIGN:
      case Tokens.MINUS_ASSIGN:
      case Tokens.MULT_ASSIGN:
      case Tokens.DIV_ASSIGN:
      case Tokens.MOD_ASSIGN:
      case Tokens.BANG:
      case Tokens.NOT:
      case Tokens.AS:
      case Tokens.NEW:
      case Tokens.DROP:
      case Tokens.IN:
      case Tokens.AND:
      case Tokens.OR:
      case Tokens.INSTANCEOF:
      case Tokens.LESS:
      case Tokens.GREATER:
      case Tokens.LESS_EQUAL:
      case Tokens.GREAT_EQUAL:
      case Tokens.EQUALS:
      case Tokens.NOT_EQUALS:
      case Tokens.LSQRBR:
      case Tokens.LPAREN:
      case Tokens.RSQRBR:
      case Tokens.RPAREN:
      case Tokens.AMPER:
      case Tokens.MOD_ACCESSOR:
      case Tokens.DOT:
      case Tokens.EQUAL:
      case Tokens.SLICE:
      case Tokens.COMMA: */
    }

    this.syntaxError(`Unknown literal value '${literal.content}'`)
  }

  private parseExpression(prevExpr?: ast.expressions.Expression, prevOp?: Token): ast.expressions.Expression {
    let expr = this.parseLiteral()
    let op = this.next()

    // If the end of the expression is reached, then returns the parsed expression until now
    if (op.is(Tokens.SEMICOLON) && this.eat(Tokens.SEMICOLON)) {
      if (prevOp)
        return new ast.expressions.Binary(prevOp.content, prevExpr!, expr, this.Position)
      
      return expr
    }

    if (prevOp && prevOp.Precedence < op.Precedence) {
      // If the previous operator was provided, then a valid previous expression
      // has also been passed
      return new ast.expressions.Binary(prevOp.content, prevExpr!, expr, this.Position)
    }

    this.next()
    expr = this.parseExpression(expr, op)

    if (this.currentTok.isOperator()) {
      op = this.currentTok

      this.next()
      expr = new ast.expressions.Binary(op.content, expr, this.parseExpression(), this.Position)
    }

    return expr
  }

  public parse(): ASTNode {
    return this.parseDeclaration()
  }

  private get Position(): Position {
    return this.lexer.Position
  }
}
