/**
 * Scraplang parser calls the lexer and collect all the tokens of that lexer
 * 
 * With the tokens already collected, that tokens needs to make sense.
 * 
 * For example, we cant assign a value to a keyword, e.g: const = 10,
 * this results on an error, since the const keyword represents a declaration instruction and cant be assigned.
 */

import * as exp from "../lang/expressions.ts"

import { UndefinedReferenceError, Scope, createEmptyScope, type ValidEntities } from "../lang/scope.ts"

import Lexer from "../lexer/lexer.ts"
import { Keywords, Token, Tokens } from "../lexer/lexer.ts"
import type { ScrapClassMethod, ScrapClassProperty, ScrapParam, AccessorModifiers, ScrapClassEntity } from "../typings.ts"

import * as pUtils from "./parser-utils.ts"
import ParsingError from "./parser-error.ts"
import ParserCursor from "./parser-cursor.ts"

import { inArray } from "../utils.ts"
import { AST } from "../ast/ast.ts"

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
  lexer: Lexer
  cursor: ParserCursor
  warnings: string[]
  functions: exp.ScrapFunction[]
  mainModule: exp.ScrapModule
  ast: AST

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cursor = new ParserCursor(lexer)
    this.warnings = []
    this.functions = []
    this.mainModule = new exp.ScrapModule("MainModule", createEmptyScope(null, "MainModule"))
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
    this.warnings.push(message)
  }

  /**
   * Causes the program stop by a undefined referenced
   * @param undefinedVariable Token which is a undefined reference
   */
  private scrapReferenceError(undefinedVariable: Token): never {
    throw new UndefinedReferenceError(undefinedVariable)
  }

  public addToScope(scope: Scope, key: string, value: ValidEntities) {
    if (!scope.addEntry(key, value)) {
      this.scrapParseError("Duplicate identifier '" + key + "' at '" + scope.getOwner + "'")
    }
  }

  public build(): this {
    while (!this.cursor.isEOF()) {
      this.parsePrimary(this.mainModule.getScope)
    }

    return this
  }

  /**
   * Advance the cursor one position on `Cursor.source`
   * @returns The new value where `Cursor.pos` is placed
   */
  private consume() { return this.cursor.consume() }

  /**
   * Assign to `Cursor.currentTok` the value of the next position getted by using `this.consume`
   * @returns The new value for `this.cursor.currentTok`
   */
  public nextToken() { return this.cursor.currentTok = this.consume() }

  
  public shouldBeLike(shouldBeLike: string, message: string) {
    const nextToken = this.nextToken()

    if (nextToken.content !== shouldBeLike)
      this.scrapParseError(message)

    return nextToken
  }

  public shouldBeOf(shouldBeOf: TokenType) {
    const nextToken = this.nextToken()

    if (nextToken.content !== shouldBeOf)
      this.scrapParseError(shouldBeOf)

    return nextToken
  }

  /**
   * # Still is an incompleted method
   */
  private getTokPrecedence() {
    const tokPrec = exp.BINARY_OPERATORS_PRECEDENCE[this.cursor.currentTok.content as keyof typeof exp.BINARY_OPERATORS_PRECEDENCE]

    if (tokPrec <= 0)
      return -1;
    
    return tokPrec;
  }

  private parseBinaryExpression(_exprPrec: number, _lhs: exp.ScrapValue, _scope: Scope): exp.BinaryExpression {
    let _tokPrec: number
    let _binOp: Token
    let _rsh: exp.ScrapValue

    return new exp.BinaryExpression(new exp.ScrapInteger(1), new exp.ScrapInteger(0), '+')
  }

  /**
   * As many variables will be declared as identifiers appear in the destructuring pattern
   */
  private parseArrayDestructuring() {
    this.nextToken() // eat '['

    if (this.cursor.currentTok.content !== Tokens.RSQRBR) {
      do {
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Expecting variable identifier")

        this.nextToken() // eat the identifier (variable)
        if (this.cursor.currentTok.content === Tokens.COMMA)
          if (this.cursor.next().type !== "IdentifierName")
            this.scrapParseError("Expected identifier name after comma")
          else
            this.nextToken() // eats the comma, then in the next iteration the currentTok should be an identifier
      } while (this.cursor.currentTok.content !== Tokens.RSQRBR)
    } else
      this.scrapGenerateWarn("A destructuring pattern should have at least a variable")
  }

  /**
   * Parses the literal form of create an object
   * @param scope Scope where the values of the object may be found
   * @returns A new `ScrapLitObject`
   */
  private parseLiteralObject(scope: Scope) {
    this.nextToken() // eat '{'
    let keyName = ""
    let valueExpression: exp.ScrapValue
    const keyValuePairs: [string, exp.ScrapValue][] = []

    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      if (
        this.cursor.currentTok.type !== "IdentifierName" &&
        this.cursor.currentTok.type !== "StringLiteral"
      ) {
        this.scrapParseError("object key from a key-value pair must be an identifier or a string")
      }
      keyName = this.cursor.currentTok.content

      if (this.nextToken().content !== Tokens.COLON)
        this.scrapParseError("Missing colon ':'")

      this.nextToken() // eat the colon ':'
      valueExpression = this.parseExpr(scope)
      
      if (this.cursor.currentTok.content !== Tokens.RBRACE) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Missing comma after key-value")
        } else this.nextToken() // eat the comma
      }

      keyValuePairs.push([keyName, valueExpression])
    }

    this.nextToken() // eat '}'

    const newObject = new exp.ScrapLitObject(keyValuePairs)

    this.ast.pushNode(newObject)
    return newObject
  }

  /**
   * Parses the literal form of create an array
   * @param scope Scope where the elements of the array may be found
   * @returns A new `ScrapArray`
   */
  private parseLiteralArray(scope: Scope) {
    this.nextToken() // eat '['
    const elements: exp.ScrapValue[] = []

    while (this.cursor.currentTok.content !== Tokens.RSQRBR) {
      elements.push(this.parseExpr(scope))
      if (this.cursor.currentTok.content !== Tokens.RSQRBR) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Expected comma after item")
        } else this.nextToken() // consume the comma
      }
    }

    this.nextToken() // eat ']'

    const newArray = new exp.ScrapArray(elements)

    this.ast.pushNode(newArray)
    return newArray
  }

  /**
   * Parse the block of code that correspond with a function. Which is represented by contain code between '{' and a '}'
   * @param isMethod
   * @param scope `Scope` where the function can registry variables that has been declared inside his body
   */
  private parseFunctionBody(isMethod: boolean, body: (exp.ScrapValue | exp.Entity)[], scope: Scope): exp.ScrapValue {
    let returnExpression: exp.ScrapValue = new exp.ScrapUndefined()
    let parsedVal: exp.ScrapValue | exp.Entity
    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      if (this.cursor.currentTok.content === Keywords.RETURN)
        if (isMethod)
          this.scrapParseError("A constructor can not have a return statement")
        else
          returnExpression = this.parseReturn(scope)
      else {
        if (this.cursor.currentTok.type === "IdentifierName") {
          parsedVal = this.parseIdentifier(scope)
        } else {
          parsedVal = this.parseStatement(scope, false)
          this.addToScope(scope, (parsedVal as exp.Entity | exp.ScrapFunction).getName, parsedVal)
        }

        body.push(parsedVal)
      }
    }

    return returnExpression
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
  public parseFunction(_mustAwait: boolean, isMethod: boolean, isStatic: boolean, scope: Scope): exp.DefinedFunction {
    const params: ScrapParam[] = []

    const fName = this.cursor.currentTok.content

    // we admit that the name can be only 2 keywords
    // allowing be possible make constructor and destructor function for classes
    const isKeywordName = this.cursor.currentTok.content === Keywords.CONSTRUCTOR || this.cursor.currentTok.content === Keywords.DESTRUCTOR
    if (!isMethod) {
      if (isKeywordName)
        this.scrapParseError(`'${fName}' as function name is not allowed outside classes`)
    } else if (this.cursor.currentTok.type !== "IdentifierName") {
      this.scrapParseError("Function name expected")
    }

    if (this.nextToken().content !== Tokens.LPAREN)
      this.scrapParseError("Missing function parameters")

    if (isMethod && isStatic)
      params.push({ pName: "this", pType: exp.ScrapUndefined }) //! Provisional value for 'pType'

    if (this.nextToken().content !== Tokens.RPAREN)
      this.parseParamList(params)

    if (this.cursor.next().content === Tokens.COLON) {
      do {
        this.nextToken()
      } while (this.cursor.currentTok.content !== Tokens.LBRACE)
    }

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing function body open")
    
    this.nextToken() // eat '{'
    
    const fScope = createEmptyScope(scope, fName)
    const functionBody: (exp.ScrapValue | exp.Entity)[] = []
    const returnExpression = this.parseFunctionBody(isMethod, functionBody, fScope)

    this.nextToken() // eat '}'

    const newFunction = new exp.DefinedFunction(fName, params, functionBody, fScope, returnExpression)

    this.functions.push(newFunction)
    this.ast.pushNode(newFunction)
    return newFunction
  }

  /**
   * Same as `parseBody`, in this case, a module could contains another module.
   * By this reason, this reason, the body module parsing is separated from the normal `parseBody`
   */
  private parseModuleBody(scope: Scope, body: (exp.Entity | exp.ScrapFunction)[]) {
    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      body.push(this.parsePrimary(scope)) // does not need to explcitly add to the scope, because parsePrimary already adds to the passed scope
    }
  }

  /**
   * Fills the array passed as parameter `param` with the parameters of the parsed function
   * @param param Array of params that the function receive
   */
  private parseParamList(params: ScrapParam[]) {
    let pName, _pType

    do {
      if (this.cursor.currentTok.type !== "IdentifierName")
        this.scrapParseError("Missing parameter name")
      pName = this.cursor.currentTok.content

      if (this.nextToken().content !== Tokens.COLON)
        this.scrapParseError("Missing colon ':' after parameter name indicating data type")

      this.nextToken()
      if (this.cursor.currentTok.content === "...") {
        if (this.nextToken().type !== "IdentifierName") {
          this.scrapParseError("Missing parameter data type")
        } else {
          // Variable args is taked as an array by the compiler and must be managed in the same way by the user in the function body
          _pType = this.cursor.currentTok.content + "[]"
          params.push({ pName, pType: exp.ScrapUndefined }) //! provisional value for 'pType'
        }

        if (this.cursor.next().content === Tokens.COMMA) {
          this.scrapParseError("Variable arguments using elipsis \"...\" must be the last parameter in the list")
        }
      } else
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Missing parameter data type")
        else {
          _pType = this.cursor.currentTok.content
          params.push({ pName, pType: exp.ScrapUndefined }) //! provisional value for 'pType'
        }

      if (this.nextToken().content === Tokens.COMMA) {
        pName = ""
        _pType = ""
        this.nextToken()
      }

    } while (this.cursor.currentTok.content !== Tokens.RPAREN)
  }

  /**
   * Parse a module declaration.
   * 
   * A Module is a block of code that recursively can contains other modules or other statements, like function, constants, etc.
   * @returns A Module declaration for the AST
   */
  private parseModule(scope: Scope): exp.ScrapModule {
    this.nextToken() // eat 'module' keyword

    if (this.cursor.currentTok.type !== "IdentifierName")
      this.scrapParseError("Missing module name")

    const moduleName = this.cursor.currentTok.content

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing module body opening '{'")

    this.nextToken() // eat '{'

    const mScope = createEmptyScope(scope, moduleName)
    const body: (exp.Entity | exp.ScrapFunction)[] = []
    this.parseModuleBody(mScope, body)

    this.nextToken() // eat '}'

    const newModule = new exp.DefinedModule(moduleName, body, mScope)

    this.ast.pushNode(newModule)
    return newModule
  }

  private parseClassEntity(isStatic: boolean, scope: Scope): exp.ScrapVariable | exp.ScrapFunction {
    switch (this.cursor.currentTok.content) {
      case Keywords.ASYNC: {
        if (this.nextToken().content !== Keywords.FN)
          this.scrapParseError("'async' keywords is only applicable to functions")

        return this.parseFunction(true, false, false, scope)
      }
      case Keywords.FN: return this.parseFunction(false, true, isStatic, scope)
      case Keywords.CONST: {
        let name = ""
        this.nextToken() // eat 'const' keyword
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Invalid class property declaration, expected an identifier")

          name = this.cursor.currentTok.content
          this.nextToken() // eats identifier variable name

        //@ts-ignore: ???
        if (this.cursor.currentTok.content === Tokens.COLON) {
          if (this.nextToken().type !== "IdentifierName")
            this.scrapParseError("Missing data type after colon ':'")
          else this.nextToken() // consume the data type
        }

        //@ts-ignore: ???
        if (this.cursor.currentTok.content !== Tokens.EQUAL)
          this.scrapParseError("Missing assignment operator '=' after const declaration. A constant must be initialized since his value can not change")

        this.nextToken() // eat '='

        return new exp.ScrapVariable("constant", name, this.parseExpr(scope))
      }

      case Keywords.VAR: {
        let name = ""
        let variableExpression: exp.ScrapValue = new exp.ScrapUndefined()

        this.nextToken() // eat 'var' keyword
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'")

          name = this.cursor.currentTok.content
          this.cursor.currentTok
          this.nextToken() // eats identifier variable name

        //@ts-ignore: ???
        if (this.cursor.currentTok.content === Tokens.COLON) {
          if (this.nextToken().type !== "IdentifierName") {
            this.scrapParseError("Missing data type after colon ':'")
          } else this.nextToken() // consume the data type
        }

        //@ts-ignore: ???
        if (this.cursor.currentTok.content === Tokens.EQUAL) {
          this.nextToken() // eat '='
      
          variableExpression = this.parseExpr(scope)
        }

        return new exp.ScrapVariable("variable", name, variableExpression)
      }

      default: this.scrapParseError("Unknown class entity")
    }
  }

  /**
   * Same as `parseBody`, but since there are specific keywords inside a class body
   * like: public, private, protected or static. Parsing the content is different
   */
  private parseClassBody(
    classEntities: (ScrapClassProperty | ScrapClassMethod)[], scope: Scope
  ): (ScrapClassEntity | ScrapClassMethod)[] {
    this.nextToken() // eat '{'
    // unlike `parseFunction`, a class could not contains a body
    // so this method is only called when a class have one

    let accessor: AccessorModifiers = "private"
    let isStatic = false
    let canOverride = false


    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      switch (this.cursor.currentTok.content) {
        case Keywords.PUBLIC:
        case Keywords.PRIVATE:
        case Keywords.PROTECTED: {
          accessor = this.cursor.currentTok.content
          this.nextToken() // eat accessor modifier
        }
      }

      if (this.cursor.currentTok.content === Keywords.STATIC) {
        this.nextToken() // eat 'static'
        isStatic = true

        // @ts-ignore: this.nextToken() has already advanced the position of the cursor
        // so the comparation is correct
        if (this.cursor.currentTok.content === Keywords.OVERRIDE) {
          this.nextToken() // eat 'override'
          canOverride = true
        }
      }

      if (this.cursor.currentTok.content === Keywords.OVERRIDE) {
        this.nextToken() // place currentTok to 'override'
        canOverride = true

        const nextToken = this.cursor.next()
        if (
          nextToken.content === Keywords.FN ||
          nextToken.content === Keywords.CONST ||
          nextToken.content === Keywords.VAR
        ) {
          this.scrapParseError("'override' keyword must be preceeded only by a function or variable declaration")          
        }
      }

      const parsedClassEntity = this.parseClassEntity(isStatic, scope)
      classEntities.push({ accessor, isStatic, canOverride, nodeType: parsedClassEntity })

      this.addToScope(scope, parsedClassEntity.getName, parsedClassEntity)
      
      isStatic = false
      canOverride = false
    }

    this.nextToken() // eat '}'

    return classEntities
  }

  private parseClass(scope: Scope): exp.ScrapClass {
    this.nextToken() // eat class keyword
    const classEntities: ScrapClassEntityProps[] = []
    const options: { inherits?: exp.ScrapClass, implements?: string } = {}

    const className = this.expectsType("IdentifierName", "current", "Expected a class name").content
    const relationalKW = this.nextToken() // eat class name (identifier)

    if (relationalKW.content === Keywords.EXTENDS || relationalKW.content === Keywords.IMPLEMENTS) {
      if (relationalKW.content === Keywords.EXTENDS) {
        const inheritedClassName = this.expectsType("IdentifierName", "next", "Identifier expected")
        const inheritedClass = scope.getReference(inheritedClassName.content)

        if (!(inheritedClass instanceof exp.ScrapClass))
          this.scrapParseError("Identifier after extends must be an already declared class")

        options.inherits = inheritedClass

        if (this.nextToken().content === Keywords.IMPLEMENTS) {
          const implemetedInterface = this.expectsType("IdentifierName", "next", "Identifier expected")
          options.implements = implemetedInterface.content
          this.nextToken() // eat the interface identifier
        }

      } else if (relationalKW.content === Keywords.IMPLEMENTS) {
        const implementedInterface = this.expectsType("IdentifierName", "next", "Identifier expected")
        options.implements = implementedInterface.content
        this.nextToken() // eat the interface identifier
      }
    }

    const cScope = createEmptyScope(scope, className)
    if (this.cursor.currentTok.content === Tokens.LBRACE) {
      this.parseClassBody(classEntities, cScope)
    }

    const constructor = cScope.getReference("constructor")

    if (constructor)
      (constructor as exp.DefinedFunction).setReturnType = new exp.ScrapString(className)

    const newClass = new exp.ScrapClass(className, classEntities, options, cScope, constructor !== undefined)

    this.ast.pushNode(newClass)
    return newClass
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
  private parseVar(scope: Scope): exp.ScrapVariable {
    let variableExpression: exp.ScrapValue = new exp.ScrapUndefined()
    const isConst = this.cursor.currentTok.content === Keywords.CONST

    const varTypeToken = this.nextToken() // eat 'var' or 'const' keyword


    switch (varTypeToken.content) {
      case Tokens.LSQRBR: this.parseArrayDestructuring(); break
      case Tokens.LBRACE: this.parseLiteralObject(scope); break
    }
    
    const name = this.cursor.currentTok.content
      if (inArray(name, RESERVERD_VAR_NAMES))
        this.scrapParseError(`'${name}' is not allowed as a variable declaration name.`)

    const typeOrEqToken = this.nextToken()
    if (typeOrEqToken.content === Tokens.COLON) {
      const _typeName =  this.parseDataType() // consume the data type
    }

    if (isConst)
      this.expectsContent(Tokens.EQUAL, "current", "A constant must have a assigned value")

    this.nextToken() // eat '='
    variableExpression = this.parseExpr(scope)

    const newVariable = new exp.ScrapVariable(isConst ? "constant" : "variable", name, variableExpression)

    this.ast.pushNode(newVariable)
    return newVariable
  }

  private parseDataType() {
    this.expectsType("IdentifierName", "next", "Missing data type after colon ':'")

    return this.nextToken() // eat data type
  }

      this.scrapParseError("A value that is not a variable can not be modified")

    if (candidateVar.getVariableType === "constant")
      this.scrapParseError("A constant can not change the value which points")

    this.nextToken() // eat '='

    const assignedValue = this.parseExpr(scope)

    const assignment = new exp.AssignmentExpression(candidateVar, assignedValue)

    this.ast.pushNode(assignment)
    return assignment
  }

  /**
   * Parses a reference to a variable
   * @explain
   * - A reference is a variable (variable or constant) which points to the data allocated in the variable which has been assigned
   *
   * @returns A `ReferenceExpression` expression
   */
  private parseReference(scope: Scope): exp.ScrapReference {
    this.nextToken() // eat '&'
    const referenceTo = this.cursor.currentTok
    if (referenceTo.type !== "IdentifierName")
      this.scrapParseError("A reference cant only points to an already existent variable")

    this.parseIdentifier(scope)

    return new exp.ScrapReference(referenceTo.content)
  }

  /**
   * Parses a return statement
   * @explain
   * - A `return` statement is used only inside a function body to indicate that the execution of that variable must stop
   *
   * - The `return` statement can be used to return an `Expression` from the function where `return` keyword was placed too.
   *
   * @returns An `Expression`
   */
  private parseReturn(scope: Scope): exp.ScrapValue {
    this.nextToken() // eat 'return' keyword
    return this.parseExpr(scope)
  }

  private parseArrayAccessor(accessedArray: exp.ScrapArray<exp.ScrapValue>, scope: Scope): exp.ScrapArrayAccess {
    this.nextToken() // eat '['

    const position = this.parseExpr(scope)

    if (!(position instanceof exp.ScrapInteger))
      this.scrapParseError("Numeric value expected")

    this.nextToken() // eat ']'

    return new exp.ScrapArrayAccess(accessedArray, position)
  }

  /**
   * Parses if the eated identifier exists as a valid function or variable in the current or upper scope(s)
   *
   * @returns must be still resolved
   * TODO: some logic of this method must be placed at `Interpreter`
   */
  private parseIdentifier(scope: Scope): exp.ScrapValue {
    if (this.cursor.next().content === Tokens.LPAREN) {

      const functionName = this.cursor.currentTok
      const calledFunction = scope.getReference(functionName.content)

      if (!calledFunction)
        this.scrapReferenceError(functionName)

      if (!(calledFunction instanceof exp.ScrapFunction))
        this.scrapParseError(`${functionName.content} is not callable since is not a function`)

      this.nextToken() // eat the function name
      this.nextToken() // eat '('

      const args: exp.ScrapValue[] = []

      if (this.cursor.currentTok.content !== Tokens.RPAREN) {
        do {
          args.push(this.parseExpr(scope))
          if (this.cursor.currentTok.content === Tokens.COMMA)
            this.nextToken()
        } while (this.cursor.currentTok.content !== Tokens.RPAREN)
      }

      this.nextToken() // eat ')'

      return new exp.ScrapCall(scope.getOwner, calledFunction, args)

    }

    //* if is a simple variable reference
    if (!scope.searchReference(this.cursor.currentTok.content))
      this.scrapReferenceError(this.cursor.currentTok)

    const variableTok = this.cursor.currentTok
    this.nextToken() // eat the identifier

    const variable = scope.getReference(variableTok.content)

    if (!variable)
      this.scrapReferenceError(variableTok)

    switch (this.cursor.currentTok.content) {
      case Tokens.EQUAL: return this.parseAssignment(variable, scope)
      case Tokens.LSQRBR: {
        if (!((variable as exp.ScrapVariable).getAssignedValue instanceof exp.ScrapArray))
          this.scrapParseError(`${variable}`)

        const newArrayAccessor = this.parseArrayAccessor((variable as exp.ScrapVariable).getAssignedValue as exp.ScrapArray<exp.ScrapValue>, scope)
        this.ast.pushNode(newArrayAccessor)
        return newArrayAccessor
      }
    }

    return (variable as exp.ScrapVariable).getAssignedValue
  }

  private parseToken(scope: Scope): exp.ScrapValue {
    switch (this.cursor.currentTok.content) {
      case Tokens.LBRACE: return this.parseLiteralObject(scope)
      case Tokens.LSQRBR: return this.parseLiteralArray(scope)
      case Tokens.AMPER: return this.parseReference(scope)
      case Tokens.PLUS:
      case Tokens.MINUS:
      case Tokens.STAR:
      case Tokens.SLASH: return this.parseBinaryExpression(0, this.parseExpr(scope), scope)
      default: this.scrapParseError("Token is not implemented yet")
    }
  }

  /**
   * Parse the different type of expressions of ScrapLang
   * @param scope Scope where the parsed expression or declaration belongs to
   * @returns A parsed expression
   */
  private parseExpr(scope: Scope): exp.ScrapValue {
    if (this.cursor.currentTok.type === "Statement" && this.cursor.currentTok.content === Keywords.FN)
      return this.parseFunction(false, false, false, scope)

    if (this.cursor.currentTok.content === Keywords.ASYNC) {
      if (this.nextToken().content !== Keywords.FN)
        this.scrapParseError("'async' keywords is only applicable to functions")

      return this.parseFunction(true, false, false, scope)
    }

    switch (this.cursor.currentTok.type) {
      case "IdentifierName": return this.parseIdentifier(scope)
      case "NumericLiteral": return pUtils.parseNumber.call(this)
      case "BinaryLiteral": return pUtils.parseBinary.call(this)
      case "OctalLiteral": return pUtils.parseOctal.call(this)
      case "HexaLiteral": return pUtils.parseHexa.call(this)
      case "FloatLiteral": return pUtils.parseFloatNumber.call(this)
      case "CharLiteral": return pUtils.parseChar.call(this)
      case "StringLiteral": return pUtils.parseString.call(this)
      case "TemplateString": return pUtils.parseString.call(this) // TODO: Make a parseTemplateString function
      case "Operator": return new exp.BinaryExpression(new exp.ScrapInteger(20), new exp.ScrapInteger(30), '+')
      case "Token": return this.parseToken(scope)

      default: this.scrapParseError("Expected expression")
    }
  }

  private parseStatement(scope: Scope, isPrimary: boolean): exp.Entity | exp.ScrapFunction {
    if (isPrimary) {
      switch (this.cursor.currentTok.content) {
        case Keywords.ASYNC: {
          if (this.nextToken().content !== Keywords.FN)
            this.scrapParseError("'async' keywords is only applicable to functions")

          return this.parseFunction(true, false, false, scope)
        }
        case Keywords.FN: return this.parseFunction(false, false, false, scope)
        case Keywords.CONST: return this.parseVar(scope)
        case Keywords.CLASS: return this.parseClass(scope)
        case Keywords.MODULE: return this.parseModule(scope)

        default: this.scrapParseError(`'${this.cursor.currentTok.content}' does not appear to be a valid primary statement`)
      }
    } else {
      switch (this.cursor.currentTok.content) {
        case Keywords.ASYNC: {
          if (this.nextToken().content !== Keywords.FN)
            this.scrapParseError("'async' keywords is only applicable to functions")

          return this.parseFunction(true, false, false, scope)
        }
        case Keywords.FN: return this.parseFunction(false, false, false, scope)
        case Keywords.CONST:
        case Keywords.VAR: return this.parseVar(scope)

        default: this.scrapParseError(`The ${this.cursor.currentTok.type} '${this.cursor.currentTok.content}' is not allowed in '${scope.getOwner}'`)
      }
    }
  }

  /**
   * `parseRoot` calls the methods which parses entities allowed the be declared at the file root.
   * 
   * * Not parsed example: A function declared inside another function will not be parsed since `parseRoot` is not invoked inside function body's.
   * * Parsed example: `main` function, since it is not declared inside another entity, `parseRoot` will call the method who parse functions
   */
  public parseRoot(scope: Scope): exp.ScrapFunction | exp.ScrapEntity {
    switch (this.cursor.currentTok.content) {
      case Keywords.ASYNC:
      case Keywords.FN:
      case Keywords.CONST:
      case Keywords.CLASS:
      case Keywords.MODULE: {
        const parsedStatement = this.parseStatement(scope, true)
        this.addToScope(scope, parsedStatement.getName, parsedStatement)

        return parsedStatement
      }

      default: {
        const invalidTokenHereErrorStringMessage = `The token '${this.cursor.currentTok.content}' is not allowed here`

        this.scrapParseError(
          `${invalidTokenHereErrorStringMessage}. Only: 'fn', 'const', 'class', 'module', 'interface', 'enum', 'import' and 'export' keywords are allowed as primary statements.
            Learn more at: https://lang.scrapgames.com/tutorial/primary_statements`)
      }
    }
  }
}
