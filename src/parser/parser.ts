/**
 * Scraplang parser calls the lexer and collect all the tokens of that lexer
 * 
 * With the tokens already collected, that tokens needs to make sense.
 * 
 * For example, we cant assign a value to a keyword, e.g: const = 10,
 * this results on an error, since the const keyword represents a declaration instruction and cant be assigned.
 */

import type { ScrapClassEntityProps, ScrapParam } from "@typings"

import { inArray } from "@utils"
import { AST, ASTEntityNode, ASTNode, ASTValueNode, NodeEntityType, NodeValueType } from "@ast/ast.ts"

import Lexer from "@lexer/lexer.ts"
import { TokenType } from "@lexer/lexer.ts"
import { Keywords, Tokens } from "@lexer/lexer.ts"

import * as pUtils from "@parser/parser-utils.ts"
import ParsingError from "@parser/parser-error.ts"
import ParserCursor from "@parser/parser-cursor.ts"

import * as ast from "@ast/nodes.ts"

import { parseClassBody } from "@parser/components/classes.ts"
import { parseModuleAccessor, parseModuleBody } from "@parser/components/modules.ts"
import { parseAsyncFn, parseFunctionBody, parseParamList } from "@parser/components/functions.ts"

import { AST, ASTNode, EntityNode, ValueNode, ControlStmtNode, EntityKind, ValueKind } from "@ast/ast.ts"
import { BINARY_OPERATORS_PRECEDENCE as _ } from "@lang/elements/commons.ts"


export enum PrimitiveTypes {
  u8      = "u8",
  i8      = "i8",
  u16     = "u16",
  i16     = "i16",
  u32     = "u32",
  i32     = "i32",
  u64     = "u64",
  i64     = "i64",
  u128    = "u128",
  i128    = "i128",

  // floats
  f8      = "f8",
  f16     = "f16",
  f32     = "f32",
  f64     = "f64",
  f128    = "f128",

  // utils
  char    = "char",
  boolean = "boolean"
}

const RESERVERD_VAR_NAMES = [
  "this",
  "super"
]

/**
 * Returns readable nodes for the AST, and these, in turn, are readed by the `interpreter`
 * which is responsible of apply the logic to these nodes.
 * 
 * In this way, the logic between components is modulable and easily scalable.
 */
export default class Parser {
  private lexer: Lexer
  private cursor: ParserCursor
  private ast: AST

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cursor = new ParserCursor(lexer)
    this.ast = new AST()

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  public restart() {
    this.cursor.source = this.lexer.tokens()
    this.cursor.currentTok = this.cursor.source.at(0)!
    this.cursor.pos = 0

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  /**
   * Causes the program stop showing an error message
   * @param message Error message
   */
  public scrapParseError(message: string): never {
    throw new ParsingError(message, this.cursor.currentTok)
  }

  /**
   * Adds a warning message to `warnings`
   * @param message Warning message
   */
  private scrapGenerateWarn(message: string): void {
    console.warn(message)
  }

  public build(): AST {
    while (!this.cursor.isEOF()) {
      const parsedRootEntity = this.parseRoot()
      this.ast.pushNode(parsedRootEntity)
    }

    return this.ast
  }

  /**
   * Advance the cursor one position on `Cursor.source`
   * @returns The new value where `Cursor.pos` is placed
   */
  protected pConsume() { return this.cursor.consume() }

  /**
   * Assign to `Cursor.currentTok` the value of the next position by using `Cursor.consume`
   * @returns The new value for `Cursor.currentTok`
   */
  public nextToken() { return this.cursor.currentTok = this.pConsume() }

  public expectsContent(shouldBeLike: string, message: string) {
    const nextToken = this.nextToken()

    if (nextToken.content !== shouldBeLike)
      this.scrapParseError(message)

    return nextToken
  }

  public expectsType(shouldBeOf: TokenType, message: string) {
    const tok = this.nextToken()

    if (tok.type !== shouldBeOf)
      this.scrapParseError(message)

    return tok
  }

  /**
   * A function is a block of code that can be accessed by type the name given to the function.
   * In this way, we avoid to repeat the same code simultaneously over the program.
   * 
   * A function is compounded by a name, a list of parameters, comprises by a parenthesis pair and a body ( '(' , ')' ), comprises by a curly braces pair ( '{' , '}' )
   * 
   * @param isMethod Is true when the method is invoked while a class is beign parsed. It is used to add the "this" implcit param
   * @param isStatic Is true when the method will be accessed in a _static way_. This means that is not necessary create a object of any class to use that method or variable
   * 
   * @returns A new function statement
   */
  public parseFunction(isAsync: boolean, isMethod: boolean, _isStatic: boolean, isExpression: boolean): ast.FunctionNode {
    const fName = this.expectsType("IdentifierName", "Missing function name").content

    this.expectsContent(Tokens.LPAREN, "Missing parameter list")

    const existsParams = this.cursor.next().content !== Tokens.RPAREN
    const params: ScrapParam[] = existsParams ? parseParamList(this) : []

    if (isMethod)
      params.unshift({ pName: "this", pType: "this" }) // TODO: pType as `"this"` is a temporal value, in the future, the type will be the object of the instanced class

    if (!existsParams) {
      this.nextToken() // eat '(' if there are not parameters
    }

    this.expectsContent(Tokens.LBRACE, "Missing function body open")

    this.nextToken() // eat '{' (function body beings)

    const { body, return: returnExpression } = parseFunctionBody(this, fName)

    this.nextToken() // eat '}' (function body ends)

    return new ast.FunctionNode(isExpression ? NodeValueType.Function : NodeEntityType.Function, fName, params, body, returnExpression, isAsync)
  }

  /**
   * Parse a module declaration.
   * 
   * A Module is a block of code that recursively can contains other modules or other statements, like function, constants, etc.
   * @param scope scope of the parsed module
   * @returns A Module declaration for the AST
   */
  private parseModule(): ast.ModuleNode {
    const moduleName = this.expectsType("IdentifierName", "Missing module name").content

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing module body opening '{'")

    this.nextToken() // eat '{'

    const body = parseModuleBody(this)

    this.nextToken() // eat '}'

    return new ast.ModuleNode(moduleName, body)
  }

  private parseClass(): ast.ClassNode {
    const metadata: ClassMetadata = { inherits: "Object", implements: [] }
    const className = this.expectsType("IdentifierName", "Expected a class name").content

    /**
     * At this point of the parsing, this variable contains 'extends' or 'implements'
     * Is named 'classInheritance' because using interface is also a way of inheritance
     * 
     * @example
     * class Test extends Object
     * // or
     * class Test implements Testeable
     */
    this.nextToken() // eat class name (identifier)

    if (this.isContent(Keywords.EXTENDS) || this.isContent(Keywords.IMPLEMENTS)) {
      if (this.isContent(Keywords.EXTENDS)) {
        metadata.inherits = this.expectsType("IdentifierName", "Expected class name").content

        const hasImplements = this.checkNext(Keywords.IMPLEMENTS)
        if (hasImplements) {
          this.nextToken() // place cursor at 'implements' keyword
          metadata.implements = parseClassImplementsList(this)
        }
      } else
        metadata.implements = parseClassImplementsList(this)
    }

    if (this.isContent(Tokens.SEMICOLON) || !this.isContent(Tokens.LBRACE))
      return new ast.ClassNode(className, metadata, [])

    this.nextToken() // eat class body begins '{'
    
      const classBody = parseClassBody(this)
    
    this.nextToken() // eat class body ends '}'

    return new ast.ClassNode(className, metadata, classBody)
  }

  /**
   * Parse a variable declaration
   *
   * A variable is declared using the keywords `const` or `var`.
   * Repectively:
   *  * A variable declared with `const` is impossible that the value which points change. But the value which points can mutate.
   *    e.g: pushing elements to an array
   *    * Trying to change the value which a constant points, will cause an compilation error
   *
   * 
   *  * A varaible decalred with `var` can both change and mutate the value which points
   *    e.g: change the value of a variable from 10 to 20
   *    @example
   *    var num = 10
   *    num = 20
   *
   * @returns A `ScrapVariable` where the stored value will be `undefined` or an assigned value
   */
  public parseVar(): ast.VariableNode {
    const isConst = this.cursor.currentTok.content === Keywords.CONST

    this.nextToken() // eat 'var' or 'const' keyword

    const name = this.cursor.currentTok.content
    if (inArray(name, RESERVERD_VAR_NAMES))
      this.scrapParseError(`'${name}' is not allowed as a variable declaration name.`)

    if (this.cursor.next().content === Tokens.COLON) {
      this.nextToken()
      this.expectsType("IdentifierName", "Expected data type")
    }

    if (isConst)
      this.expectsContent(Tokens.EQUAL, "A constant must have a assigned value")
    else if (this.cursor.next().content === Tokens.EQUAL)
      this.nextToken() // eats data type or name in case variable is not constant
    
    this.nextToken() // eat '='

    const value = this.parseExpr()
    
    return new ast.VariableNode(name, isConst, value)
  }

  /**
   * Parses the literal form of create an object
   * @param scope Scope where the values of the object may be found
   * @returns A new `ScrapLitObject`
   */
  private parseLiteralObject() {
    this.nextToken() // eat '{'
    let keyName = ""
    let value: ValueNode
    const entries: Map<string, ValueNode> = new Map()

    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      if (
        this.cursor.currentTok.type !== "IdentifierName" &&
        this.cursor.currentTok.type !== "StringLiteral"
      ) {
        this.scrapParseError("object key from a key-value pair must be an identifier or a string")
      }
      keyName = this.cursor.currentTok.content

      if (keyValuePairs.has(keyName))
        this.scrapParseError(`${keyName} already exists in the literal object`)

      if (this.nextToken().content !== Tokens.COLON)
        this.scrapParseError("Missing colon ':'")

      this.nextToken() // eat the colon ':'
      value = this.parseExpr()
      
      if (this.cursor.currentTok.content !== Tokens.RBRACE) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Missing comma after key-value")
        } else this.nextToken() // eat the comma
      }

      keyValuePairs.set(keyName, value)
    }

    this.nextToken() // eat '}'

    return new ast.LiteralObjectNode(keyValuePairs)
  }

  /**
   * Parses the literal form of create an array
   * @param scope Scope where the elements of the array may be found
   * @returns A new `ScrapArray`
   */
  private parseLiteralArray(): ast.LiteralArrayNode<ASTNode> {
    const elements: ASTNode[] = []

    this.nextToken() // eat '['

    while (this.cursor.currentTok.content !== Tokens.RSQRBR) {
      elements.push(this.parseExpr())
      if (this.cursor.currentTok.content !== Tokens.RSQRBR) {
        this.expectsContent(Tokens.COMMA, "Expected comma after item")
        this.nextToken() // consume the comma
      }
    }

    this.nextToken() // eat ']'

    return new ast.LiteralArrayNode(elements)
  }

  private parseReassignment(target: string): ast.ReassignmentNode {
    this.nextToken() // eat equal token (=)
    return new ast.ReassignmentNode(target, this.parseExpr())
  }

  /**
   * Parses a reference to a variable*
   * @returns A `ReferenceNode` expression
   */
  private parseReference(): ast.ReferenceNode {
    const varName = this.expectsType("IdentifierName", "Expected variable name")
    this.nextToken() // eat variable name (prepare for next parsing element)

    return new ast.ReferenceNode(varName.content)
  }

  /**
   * Parses a function call toghether his arguments
   * @returns A `CallNode`
   */
  private parseCall(): ast.CallNode {
    const functionName = this.cursor.currentTok.content

    this.nextToken() // eat fn name
    this.nextToken() // '('

    const args: ValueNode[] = []

    if (this.cursor.currentTok.content !== Tokens.RPAREN) {
      do {
        args.push(this.parseExpr())
        if (this.cursor.currentTok.content === Tokens.COMMA)
          this.nextToken()
      } while (this.cursor.currentTok.content !== Tokens.RPAREN)
    }

    this.nextToken() // eat ')'

    return new ast.CallNode(functionName, args)
  }

  /**
   * As an extension of `parseIdentifier`, this method omits that the current token being parsed is not a function call
   * 
   * Between the possibles elements parsed by this method are:
   *  - object accessors
   *  - module accessors
   *  - simply variable references
   *  - reassigned value of variables
   * 
   * @returns A value node
   */
  public parseIdReference(): ValueNode {
    const refName = this.cursor.currentTok
    const accessor = this.nextToken() // eat the identifier

    switch (accessor.content) {
      case Tokens.EQUAL: return this.parseReassignment(refName.content)
      case Tokens.MODULE_ACCESSOR: return parseModuleAccessor(this, refName.content)
      case Tokens.DOT: this.scrapParseError("Object accessor isn't still implemented")
      
    }

    return new ast.IdentifierNode(refName.content)
  }

  /**
   * Parses an identifier. Parsing an single identifier allows to detect calls to functions or simple variable references
   */
  public parseIdentifier(): ValueNode {
    if (this.cursor.next().content === Tokens.LPAREN)
      return this.parseCall()

    return this.parseIdReference()
  }

  private parseBinOperator(operator: string): ValueNode {
    switch (this.cursor.currentTok.content) {
      case Tokens.LBRACE: return this.parseLiteralObject()
      case Tokens.LSQRBR: return this.parseLiteralArray()
      case Tokens.AMPER: return this.parseReference()
      default: this.scrapParseError(`The token '${this.cursor.currentTok.content}' is not implemented yet`)
    }
  }

  /**
   * Parses an expression, an expression is a value which can be assigned as value of a receives, likes variable values or arguments (also called 'rhs value' in other languages like C++)
   * The list of valid expressions are:
   *  - Any primitive value
   *  - An instance or any class (object)
   *  - A function (because they are first class citizens)
   * @returns The parsed expression
   */
  public parseExpr(): ValueNode {
    // check for 'Statement' type is needed, because this method can be called 
    if (this.cursor.currentTok.type === "Statement" && this.cursor.currentTok.content === Keywords.FN)
      return this.parseFunction(false, false, false, true) as ValueNode

    if (this.cursor.currentTok.content === Keywords.ASYNC)
      return parseAsyncFn(this, false, false, true) as ValueNode

    switch (this.cursor.currentTok.type) {
      case "IdentifierName": return this.parseIdentifier()
      case "NumericLiteral": return pUtils.parseNumber.call(this)
      case "BinaryLiteral":  return pUtils.parseBinary.call(this)
      case "OctalLiteral":   return pUtils.parseOctal.call(this)
      case "HexaLiteral":    return pUtils.parseHexa.call(this)
      case "FloatLiteral":   return pUtils.parseFloatNumber.call(this)
      case "CharLiteral":    return pUtils.parseChar.call(this)
      case "StringLiteral":  return pUtils.parseString.call(this)
      case "Token":          return this.parseToken()

      default: this.scrapParseError("Expected expression")
    }
  }

  /**
   * Parses a statement, indifferently it is placed at the root of the module or inside another entity, like a function or a class
   * @returns 
   */
  public parseStatement(): EntityNode {
    switch (this.cursor.currentTok.content) {
      case Keywords.VAR:    return this.parseVar()

      case Keywords.ASYNC:  return parseAsyncFn(this, false, false, false) as EntityNode
      case Keywords.FN:     return this.parseFunction(false, false, false, false) as EntityNode
      case Keywords.CONST:  return this.parseVar()
      case Keywords.CLASS:  return this.parseClass()
      case Keywords.MODULE: return this.parseModule()

      default: this.scrapParseError(`The ${this.cursor.currentTok.type} '${this.cursor.currentTok.content}' is not allowed here'`)
    }
  }

  private parseRootEntity() {
    switch (this.cursor.currentTok.content) {
      case Keywords.ASYNC:
      case Keywords.FN:
      case Keywords.CONST:
      case Keywords.CLASS:
      case Keywords.MODULE: return this.parseStatement()

      default: {
        const invalidTokenMessage = `The token '${this.cursor.currentTok.content}' is not allowed here`

        this.scrapParseError(
          `${invalidTokenMessage}. Only: 'fn', 'const', 'class', 'module', 'interface', 'enum', 'import' and 'export' keywords are allowed as primary statements.
            Learn more at: https://lang.scrapgames.com/tutorial/primary_statements`)
      }
    }
  }

  public parseExportedRoot() {
    this.nextToken() // eat 'export' keyword
    const exported = this.parseRootEntity()
    exported.isExported = true

    return exported
  }

  /**
   * Parses a primary entity
   */
  public parseRoot() {
    if (this.cursor.currentTok.content === Keywords.EXPORT) {
      const exported = this.parseExportedRoot()
      return exported
    }

    return this.parseRootEntity()
  }

  
  /* GETTERS & SETTERS */
  public get hasFinish()   { return this.cursor.isEOF() }
  public get getLexer()    { return this.lexer }
  public get getCursor()   { return this.cursor }
  public get getAST()      { return this.ast }
}
