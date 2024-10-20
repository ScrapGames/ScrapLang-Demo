/**
 * Scraplang parser calls the lexer and collect all the tokens of that lexer
 * 
 * With the tokens already collected, that tokens needs to make sense.
 * 
 * For example, we cant assign a value to a keyword, e.g: const = 10,
 * this results on an error, since the const keyword represents a declaration instruction and cant be assigned.
 */

// lexer
import Lexer from "@lexer/lexer.ts"
import { type TokenType, Keywords, Token, Tokens } from "@tokens"

// parser utils
import * as pUtils from "@parser/parser-utils.ts"
import ParsingError from "@parser/parser-error.ts"
import ParserCursor from "@parser/parser-cursor.ts"

// parser utility functions
import { parseClassBody, parseClassImplementsList } from "@parser/components/classes.ts"
import { parseModuleAccessor, parseModuleBody } from "@parser/components/modules.ts"
import { parseAsyncFn, parseFunctionBody, parseParamList } from "@parser/components/functions.ts"

// ast
import * as ast from "@ast/nodes.ts"
import { AST, ASTNode, EntityNode, ValueNode, ControlStmtNode, EntityKind, ValueKind } from "@ast/ast.ts"

// lang
import { BINARY_OPERATORS_PRECEDENCE as _ } from "@scrap"

// utils
import { inArray } from "@utils"

// type definitions
import type { Accessible, ClassMetadata, Instruction, IScrapParam } from "@typings"

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

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cursor = new ParserCursor(lexer)

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  /**
   * Causes the program stop showing an error message
   * @param message Error message
   */
  public scrapParseError(message: string): never {
    throw new ParsingError(message, this.curtt())
  }

  /**
   * Prints a warning in console
   * @param message Warning message
   */
  public scrapGenerateWarn(message: string): void {
    console.warn(message)
  }

/**
   * Creates a new AST filling it with nodes which correspond with the parsed source code
   * @returns The created and filled AST
   */
  public build(): AST {
const ast: AST = new AST()

    while (!this.cursor.isEOF()) {
      const parsedRootEntity = this.parseRoot()
      ast.pushNode(parsedRootEntity)
    }

    return ast
  }

  /* ===== Helper functions ===== */

  /**
   * Shorthand function for `Cursor.currentTok` access
   * @returns The current tok where the `cursor` is placed
   */
  public curtt(): Token { return this.cursor.currentTok }

  /**
   * Checks if `Cursor.currentTok.type` is `type`
   * @param type TokenType member to be comparated against `Cursor.currentTok.type`
   * @returns boolean if `type` is equals to `Cursor.currentTok.type`, false in other case
   */
  public isType(type: TokenType): boolean {
    return this.cursor.currentTok.type === type
  }

  /**
   * Checks if `Cursor.currentTok.content` is `c`
   * @param c String to be comparated against `Cursor.currentTok.content`
   * @returns boolean if `c` is equals to `Cursor.currentTok.content`, false in other case
   */
  public isContent(c: string): boolean {
    return this.cursor.currentTok.content === c
  }

  /**
   * Assign to `Cursor.currentTok` the value of the next position by using `Cursor.consume`
   * @returns The new value for `Cursor.currentTok`
   */
  public nextToken() { return this.cursor.currentTok = this.cursor.consume() }

  /**
   * Consumes the current token advancing in the `lexer source` and checks if the actual token after the advancement is equals to `shouldBeLike`
   * @param shouldBeLike Token to compare with `currentTok`
   * @param message Error message if `currenTok.content` is not equal to `shouldBeLike`
   * @throws `ParsingError` if `currenTok.content` is not equal to `shouldBeLike`
   * @returns The next token in the source
   */
  public expectsContent(shouldBeLike: string, message: string) {
    const nextToken = this.nextToken()

    if (nextToken.content !== shouldBeLike)
      this.scrapParseError(message)

    return nextToken
  }

  /**
   * Checks the current token advacing in the `lexer source`and checks if the actual token after the advancement is equals to `shouldBeOf`
   * @param shouldBeOf Tpe of token to compare with `currentTok`
   * @param message Error menssage if `currentTok.type` is not equal to `ShouldBeOf`
   * @throws `ParsingError` if `currentTok.type` is not equal to `ShouldBeOf`
   * @returns The next token in the source
   */
  public expectsType(shouldBeOf: TokenType, message: string) {
    const tok = this.nextToken()

    if (tok.type !== shouldBeOf)
      this.scrapParseError(message)

    return tok
  }

  /**
   * Checks if passed parameter is the same than the next token in the source
   * 
   * NOTE: this method checks the source in a forward position buts doesn't advance
   * @param canBe Possible next token
   * @returns true, if `canBe` is equals to the next token in the source, false in other case
   */
  public checkNext(canBe: string): boolean {
    return this.cursor.next().content === canBe
  }

  public getNext(): Token {
    return this.cursor.next()
  }

  /* ===== Parser functions ===== */

  /**
   * Parses a function entity, which is any element which is allowed to be placed inside a function body (between '{' and '}')
   * @returns An allowed element inside a function body: they can be: other `DefinedFunctions`, `ScrapVariables` or `ScrapCalls` to any function
   */
  public parseInstruction(): Instruction {
    const toBeParsedTok = this.curtt()

    if (toBeParsedTok.type === "IdentifierName")
      return this.parseIdentifier() as Instruction
    else {
      switch (toBeParsedTok.content) {
        case Keywords.FN:
        case Keywords.VAR:
        case Keywords.CONST: return this.parseStatement() as Instruction
        case Keywords.IF: return this.parseControlBlock()

        default: {
          this.scrapParseError("Only instructions are allowed inside a block body")
        }
      }
    }
  }

  /**
   * Parses a function, either statement or expression
   * If a function is parsed as an expression isn't needed to provide a name. Moreover, a function expression is only accessibe by the variable name which contains it.
   * 
   * @param isExpression Determines if the function is an expression
   * this means that the function is beign parsed as a value of a variable or as return value
   * @param isAsync Determines if the function
   * @param isMethod Determines if the function will be parsed as a class method, this allows to add the `this` parameter implicitly
   * @param isStatic In combination with `isMethod`
   * @returns A new function node
   */
  public parseFunction(isExpression: boolean, isAsync: boolean, isMethod: boolean, isStatic: boolean): ast.FunctionNode {
    const fName = resolveFunctionName(this, isExpression)

    /**
     * This check is needed because if `isExpression` is true,
     * this means that a token which is not the function name was consumed in `resolveFunctionName` execution
     * so the `currentTok.content` is already '(' giving false in this next `expectsContent` checking
     * and finally throwing an error
     */
    if (fName !== "anonymous")
      this.expectsContent(Tokens.LPAREN, "Missing parameter list") // eats the fn name and advance to next tok '('

    /** If `currentTok` isn't RPAREN ')', then means that the function will receive arguments, in other way, the param list is empty */
    const existsParams = !this.checkNext(Tokens.RPAREN)
    let params: IScrapParam[] = []

    /**
     * Check is neccesary because if `parseParamList`
     * isn't executed, the source doesn't advance until ')' token
     */
    if (existsParams)
      params = parseParamList(this)
    else
      this.nextToken()

    if (fName === "destructor" && params.length > 0)
      this.scrapParseError("A class destructor must not receive parameters")

    // If the method is defined inside a class and isn't declared as a static method, the function will implicitly receive the instance itself as `this`
    if (isMethod && !isStatic)
      params.unshift({ pName: "this", pType: "this" })

    this.expectsContent(Tokens.LBRACE, "Missing function body open") // eats parameter list closing ')' and advance
    this.nextToken() // eat '{' (function body opens)

    const { body, return: returnNode } = parseFunctionBody(this, fName)

    this.nextToken() // eat '}' (function body ends)

    return new ast.FunctionNode(fName, isExpression ? ValueKind.Function : EntityKind.Function, params, body, returnNode, isAsync)
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
    const isConst = this.curtt().content === Keywords.CONST

    this.nextToken() // eat 'var' or 'const' keyword

    const name = this.curtt().content
    if (inArray(name, RESERVERD_VAR_NAMES))
      this.scrapParseError(`'${name}' is not allowed as a variable declaration name.`)

    if (this.checkNext(Tokens.COLON)) {
      this.nextToken()
      this.expectsType("IdentifierName", "Expected data type")
    }

    if (isConst)
      this.expectsContent(Tokens.EQUAL, "A constant must have a assigned value")
    else if (this.checkNext(Tokens.EQUAL))
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

    while (this.curtt().content !== Tokens.RBRACE) {
      if (
        this.cursor.currentTok.type !== "IdentifierName" &&
        this.cursor.currentTok.type !== "StringLiteral"
      ) {
        this.scrapParseError("object key from a key-value pair must be an identifier or a string")
      }
      keyName = this.curtt().content

      if (keyValuePairs.has(keyName))
        this.scrapParseError(`${keyName} already exists in the literal object`)

      this.expectsContent(Tokens.COLON, "Missing colon ':' after key")

      this.nextToken() // eat the colon ':'
      value = this.parseExpr()
      
      if (!this.isContent(Tokens.RBRACE)) {
        if (!this.isContent(Tokens.COMMA))
          this.scrapParseError("Missing comma after key-value")
        else this.nextToken() // eat the comma
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
  private parseLiteralArray(): ast.ArrayNode<ASTNode> {
    const elements: ASTNode[] = []

    this.nextToken() // eat '['

    while (this.curtt().content !== Tokens.RSQRBR) {
      elements.push(this.parseExpr())
      if (this.curtt().content !== Tokens.RSQRBR) {
        const isComma = this.curtt().content === Tokens.COMMA
        if (!isComma)
          this.scrapParseError("Expected comma after array item")

        this.nextToken() // if `currenTok` is comma, then eat it
      }
    }

    this.nextToken() // eat ']'

    return new ast.ArrayNode(elements)
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
    const functionName = this.curtt().content

    this.expectsContent(Tokens.LPAREN, "Expected open parenthesis for args list '('")
    this.nextToken() // eat '('

    const args: ValueNode[] = []

    if (!this.isContent(Tokens.RPAREN)) {
      do {
        args.push(this.parseExpr())
        if (this.isContent(Tokens.COMMA))
          this.nextToken()
      } while (!this.isContent(Tokens.RPAREN))
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
    const refName = this.curtt()
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
    if (this.checkNext(Tokens.LPAREN))
      return this.parseCall()

    return this.parseIdReference()
  }

  public parseControlBlock(): ControlStmtNode {
    const toBeParsed = this.curtt()

    switch (toBeParsed.content) {
      case Keywords.IF: return this.parseIf()

      default: this.scrapParseError(`Token '${toBeParsed.content}' unimplemented yet`)
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

    /**
     * Functions are the unique entity which can be used as value, for this reason:
     * We need to parse them outside the switch statement, because functions
     * aren't designed to be lexed as a single token which is associated with a type of token as numbers can (for example, a string or any other **value**).
     */
    if (this.isContent(Keywords.FN)) // casting first to unkown is needed due to `kind` field of FunctionNode doesn't fit in ValueNode `kind` field
      return this.parseFunction(true, false, false, false) as unknown as ValueNode

    if (this.isContent(Keywords.ASYNC)) // casting  first to unkown is needed due to `kind` field of FunctionNode doesn't fit in ValueNode `kind` field
      return parseAsyncFn(this, false, false, true) as unknown as ValueNode

    switch (this.curtt().type) {
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
    switch (this.curtt().content) {
      /* Parses non-primary entities */
      case Keywords.VAR:    return this.parseVar()

      /**
       * Parses primary entities
       * Same as when we casted the returned node to
       * unkown first. The `kind` field of FunctionNode doesn't fit in EnitytNode `kind` field
       */
      case Keywords.ASYNC:  return parseAsyncFn(this, false, false, false) as unknown as EntityNode
      case Keywords.FN:     return this.parseFunction(false, false, false, false) as unknown as EntityNode
      case Keywords.CONST:  return this.parseVar()
      case Keywords.CLASS:  return this.parseClass()
      case Keywords.MODULE: return this.parseModule()

      default: this.scrapParseError(`The ${this.curtt().type} '${this.curtt().content}' is not allowed here`)
    }
  }

  private parseRootEntity() {
    switch (this.curtt().content) {
      case Keywords.ASYNC:
      case Keywords.FN:
      case Keywords.CONST:
      case Keywords.CLASS:
      case Keywords.MODULE: return this.parseStatement()

      default: {
        const invalidTokenMessage = `The token '${this.curtt().content}' is not allowed here`

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
    if (this.curtt().content === Keywords.EXPORT) {
      const exported = this.parseExportedRoot()
      return exported
    }

    return this.parseRootEntity()
  }

  
  /* GETTERS & SETTERS */
  public get hasFinish()   { return this.cursor.isEOF() }
  public get getLexer()    { return this.lexer }
  public get getCursor()   { return this.cursor }
}
