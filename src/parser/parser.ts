/**
 * Scraplang parser calls the lexer and collect all the tokens of that lexer
 * 
 * With the tokens already collected, that tokens needs to make sense.
 * 
 * For example, we cant assign a value to a keyword, e.g: const = 10,
 * this results on an error, since the const keyword represents a declaration instruction and cant be assigned.
 */

import * as exp from "../ast/Expressions.ts"
import { UndefinedReferenceError, Scope, createEmptyScope, type ValidEntities } from "../lang/scope.ts"

import Lexer, { Keywords, Token, Tokens } from "../lexer/lexer.ts"
import type { ScrapClassMethod, ScrapClassProperty, ScrapParam, AccessorModifiers } from "../typings.ts"

import ParsingError from "./parser-error.ts"
import ParserCursor from "./parser-cursor.ts"
import * as pUtils from "./parser-utils.ts"
import AST from "../ast/ast.ts"
import { inArray } from "../utils.ts"
import { BINARY_OPERATORS_PRECEDENCE } from "../ast/Expressions.ts";

/**
 * TODO: parse identifiers expressions: 
 *      * identifier_expression ::= identifier "(" expression* ")"
 */

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

export default class Parser {
  lexer: Lexer
  cursor: ParserCursor
  warnings: string[]
  functions: exp.FunctionAST[]
  globalScope: Scope
  ast: AST

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cursor = new ParserCursor(lexer)
    this.warnings = []
    this.functions = []
    this.globalScope = createEmptyScope(null, "MainModule")
    this.ast = new AST()

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  public restart() {
    this.cursor.source = this.lexer.tokens()
    this.cursor.currentTok = this.cursor.source.at(0)!
    this.cursor.pos = 0

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  public scrapParseError(message: string): never {
    throw new ParsingError(message, this.cursor.currentTok)
  }

  private scrapGenerateWarn(message: string): void {
    this.warnings.push(message)
  }

  private scrapReferenceError(undefinedVariable: Token): never {
    throw new UndefinedReferenceError(undefinedVariable)
  }

  public addToGlobalScope(key: string, value: ValidEntities) {
    const globalScp = this.globalScope
    if (!globalScp.addEntry(key, value)) // safety non-null assert: first node which is the global scope is always availabe
      this.scrapParseError("Duplicate identifier '" + key + "' at '" + globalScp.getOwner + "'")
  }

  public addToScope(scope: Scope, key: string, value: ValidEntities) {
    if (!scope.addEntry(key, value)) {
      this.scrapParseError("Duplicate identifier '" + key + "' at '" + scope.getOwner + "'")
    }
  }

  private consume() { return this.cursor.consume() }

  public nextToken() { return this.cursor.currentTok = this.consume() }

  private getTokPrecedence() {
    const tokPrec = BINARY_OPERATORS_PRECEDENCE[this.cursor.currentTok.content as keyof typeof BINARY_OPERATORS_PRECEDENCE]

    if (tokPrec <= 0)
        return -1;
    
    return tokPrec;
  }

  private parseBinaryExpression(exprPrec: number, lhs: exp.ExpressionAST, scope: Scope): exp.BinaryExpression {
    let tokPrec: number
    let binOp: Token
    let rsh: exp.ExpressionAST

    return new exp.BinaryExpression(1, 0, '+')
  }

  /**
   * Assign values to new declared variables inside an array pattern, where the values of that variables are the items of the array
   * Then, register the values of that values on the corresponding scope
   * 
   * @example
   * const arr = [1, 2, 3, 4, 5]
   * 
   * const [num1, num2, num3] = arr
   *
   * @returns // TODO: handle correctly the return value
   */
  private parseArrayDestructing() {
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
      this.scrapGenerateWarn("A destructing pattern should have at least a variable")
    
    return new exp.ExpressionAST()
  }

  /**
   * Parses the literal form of create an array
   * @param scope Scope where the elements of the array may be found
   * @returns A new ArrayExpression
   */
  private parseLiteralArray(scope: Scope) {
    this.nextToken() // eat '['
    const elements: exp.ExpressionAST[] = []

    while (this.cursor.currentTok.content !== Tokens.RSQRBR) {
      elements.push(this.parseExpr(scope))
      if (this.cursor.currentTok.content !== Tokens.RSQRBR) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Expected comma after item")
        } else this.nextToken() // consume the comma
      }
    }

    this.nextToken() // eat ']'

    return new exp.ArrayExpression(elements)
  }

  /**
   * Parses a literal object
   * @param scope Scope where the values of the object may be found
   * @returns A new `LiteralObjectExpression`
   */
  private parseLiteralObject(scope: Scope) {
    this.nextToken() // eat '{'
    let keyName = ""
    let valueExpression: exp.ExpressionAST
    const keyValuePairs: [string, exp.ExpressionAST][] = []

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

    return new exp.LiteralObjectExpression(keyValuePairs)
  }

  /**
   * Parse the block of code that correspond with a function. Which is represented by contain code between '{' and a '}'
   * @param isMethod
   * @param scope `Scope` where the function can registry variables that has been declared inside his body
   */
  private parseFunctionBody(isMethod: boolean, scope: Scope): exp.ExpressionAST {
    let returnExpression: exp.UndefinedExpression = new exp.UndefinedExpression()
    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      if (this.cursor.currentTok.content === Keywords.RETURN)
        if (isMethod)
          this.scrapParseError("A constructor can not have a return statement")
        else
          returnExpression = this.parseReturn(scope)
      else {
        const parsedObj = this.parseStatement(scope, false)

        if (parsedObj instanceof exp.EntityAST || parsedObj instanceof exp.FunctionAST) {
          this.addToScope(scope, parsedObj.getName, parsedObj)
        }
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
  private parseFunction(isMethod: boolean, isStatic: boolean, scope: Scope) {
    this.nextToken() // eat 'fn' keyword
    const params: ScrapParam[] = []

    if (this.cursor.currentTok.type !== "IdentifierName" &&
        (this.cursor.currentTok.content !== Keywords.CONSTRUCTOR &&
        this.cursor.currentTok.content !== Keywords.DESTRUCTOR)
        // we admit that the name can be only 2 keywords
        // allowing be possible make constructor and destructor function for objects          
      )
      this.scrapParseError("Function name expected")
    const fName = this.cursor.currentTok.content

    if (this.nextToken().content !== Tokens.LPAREN)
      this.scrapParseError("Missing function parameters")

    if (isMethod && isStatic)
      params.push({ pName: "this", pType: "this" })

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
    const returnExpression = this.parseFunctionBody(isMethod, fScope)

    this.nextToken() // eat '}'


    const newFunction = new exp.FunctionAST(fName, params, fScope, returnExpression)
    this.functions.push(newFunction)
    return newFunction
  }

  private parseClassEntity(isStatic: boolean, scope: Scope): exp.DeclarationAST | exp.FunctionAST {
    switch (this.cursor.currentTok.content) {
      case Keywords.FN: return this.parseFunction(true, isStatic, scope)
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

        return new exp.DeclarationAST("constant", name, this.parseExpr(scope))
      }

      case Keywords.VAR: {
        let name = ""
        let variableExpression: exp.ExpressionAST = new exp.ExpressionAST()

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

        return new exp.DeclarationAST("variable", name, variableExpression)
      }

      default: this.scrapParseError("Unknown class entity")
    }
  }

  /**
   * Same as `parseBody`, in this case, a module could contains another module.
   * By this reason, this reason, the body module parsing is separated from the normal `parseBody`
   */
  private parseModuleBody(mScope: Scope) {
    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      const parsedModuleEntity = this.parsePrimary()

      this.addToScope(mScope, parsedModuleEntity.getName, parsedModuleEntity)
    }
  }

  /**
   * Fills the array passed as parameter `param` with the parameters of the parsed function
   * @param param Array of params that the function receive
   */
  private parseParamList(params: ScrapParam[]) {
    let pName, pType

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
          pType = this.cursor.currentTok.content + "[]"
          params.push({ pName, pType })
        }

        if (this.cursor.next().content === Tokens.COMMA) {
          this.scrapParseError("Variable arguments using elipsis \"...\" must be the last parameter in the list")
        }
      } else
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Missing parameter data type")
        else {
          pType = this.cursor.currentTok.content
          params.push({ pName, pType })
        }

      if (this.nextToken().content === Tokens.COMMA) {
        pName = ""
        pType = ""
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
  private parseModule(scope: Scope) {
    this.nextToken() // eat 'module' keyword

    if (this.cursor.currentTok.type !== "IdentifierName")
      this.scrapParseError("Missing module name")

    const moduleName = this.cursor.currentTok.content
    const firstModuleNameLetter = moduleName.charAt(0)
    if (!/[A-Z]/.test(firstModuleNameLetter))
      this.scrapGenerateWarn(`A module name should have a Pascal-Case format. '${firstModuleNameLetter.toUpperCase() + moduleName.substring(1)}' in this case.`)

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing module body opening '{'")

    this.nextToken() // eat '{'

    const mScope = createEmptyScope(scope, moduleName)
    this.parseModuleBody(mScope)

    this.nextToken() // eat '}'

    return new exp.ModuleAST(moduleName, mScope)
  }

  /**
   * Same as `parseBody`, but since there are specific keywords inside a class body
   * like: public, private, protected or static. Parsing the content is different
   */
  private parseClassBody(classEntities: (ScrapClassProperty | ScrapClassMethod)[], scope: Scope) {
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

  private parseClass(scope: Scope) {
    this.nextToken() // eat class keyword
    const classEntities: (ScrapClassProperty | ScrapClassMethod)[] = []

    if (this.cursor.currentTok.type !== "IdentifierName")
      this.scrapParseError("Expected a class name")
    const className = this.cursor.currentTok.content
    
    this.nextToken() // eat class name (identifier)
    if (this.cursor.currentTok.content === Keywords.EXTENDS || this.cursor.currentTok.content === Keywords.IMPLEMENTS) {
      if (this.cursor.currentTok.content === Keywords.EXTENDS) {
        if (this.nextToken().type !== "IdentifierName")
          this.scrapParseError("Expected an identifier")

        if (this.cursor.next().content === Keywords.IMPLEMENTS) {
          this.nextToken() // now currentTok is "implements"

          if (this.nextToken().type !== "IdentifierName") {
            this.scrapParseError("Expected an identifier")
          }
        }
      }

      if (this.cursor.currentTok.content === Keywords.IMPLEMENTS) {
        if (this.nextToken().type !== "IdentifierName")
          this.scrapParseError("Expected an identifier")
      }
    }

    const cScope = createEmptyScope(scope, className)
    if (this.cursor.currentTok.content === Tokens.LBRACE) {
      this.parseClassBody(classEntities, cScope)
    }

    const constructor = classEntities.find(entity => entity.nodeType instanceof exp.FunctionAST && entity.nodeType.getName === "constructor")

    if (constructor)
      (constructor.nodeType as exp.FunctionAST).setReturnType = className

    return new exp.ClassAST(className, classEntities, cScope, constructor !== undefined)
  }

  /**
   * Parse a constant declaration and initialization.
   * A const is a value allocated in memory which the value which points cant change, but the memory pointed to can
   *
   * @example
   * // error e.g:
   * // in this example will try to change the value where the declared constant `num` points
   * const num = 10
   * num = 20 // error!
   *
   *
   * @example
   * // valid e.g:
   * fn sum(n1: i32, n2: i32) { return n1 + n2 }
   * const num = sum(10, 20)
   *
   * @explain
   * The value returned by `sum` is not kwnowed at compile-time, but still is a valid syntaxis.
   * This is a simple case, but thinks in a request to a db, where the data are not hardcoded in the program. Even that case it is still valid.
   *
   * Occurs similar with arrays:
   * const myArray = [1, 2, 3, 4, 5] // correct constat
   * myArray.push(6) // valid, since the memory which the constant points has not changed
   *
   * A constant must be initialized always, since the value where points cant change. In few words, can be reassigned.
   * @returns A VariableDeclaration AST
   */
  private parseConst(scope: Scope): exp.DeclarationAST {
    let name = ""
    this.nextToken() // eat 'const' keyword
    if (this.cursor.currentTok.type !== "IdentifierName" && (this.cursor.currentTok.content !== Tokens.LSQRBR && this.cursor.currentTok.content !== Tokens.LBRACE)) {
      this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'")
    }

    if (this.cursor.currentTok.content === Tokens.LSQRBR)
      this.parseArrayDestructing()
    else if (this.cursor.currentTok.content === Tokens.LBRACE)
      this.parseLiteralObject(scope) // TODO: make a 'parseObjectDestructing' function
    else {
      name = this.cursor.currentTok.content
      if (inArray(name, RESERVERD_VAR_NAMES))
        this.scrapParseError(`'${name}' is not allowed as a variable declaration name.`)
      this.nextToken() // eats identifier variable name
    }


    if (this.cursor.currentTok.content === Tokens.COLON) {
      if (this.nextToken().type !== "IdentifierName") {
        this.scrapParseError("Missing data type after colon ':'")
      } else this.nextToken() // consume the data type
    }

    if (this.cursor.currentTok.content !== Tokens.EQUAL)
      this.scrapParseError("Missing assignment operator '=' after const declaration. A constant must be initialized since his value can not change")

    this.nextToken() // eat '='

    const constantExpression = this.parseExpr(scope)

    return new exp.DeclarationAST("constant", name, constantExpression)
  }

  /**
   * Parse a variable declaration
   * A variable is a value allocated in memory which the value and the pointer which points that value can change
   *
   * @returns A `DeclarationAST` entity
   */
  private parseVar(scope: Scope): exp.DeclarationAST {
    let name = ""
    let variableExpression: exp.ExpressionAST = new exp.UndefinedExpression()

    this.nextToken() // eat 'var' keyword
    if (this.cursor.currentTok.type !== "IdentifierName" && (this.cursor.currentTok.content !== Tokens.LSQRBR && this.cursor.currentTok.content !== Tokens.LBRACE))
      this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'")

    if (this.cursor.currentTok.content === Tokens.LSQRBR)
      this.parseArrayDestructing()
    else if (this.cursor.currentTok.content === Tokens.LBRACE)
      this.parseLiteralObject(scope)
    else {
      name = this.cursor.currentTok.content
      if (inArray(name, RESERVERD_VAR_NAMES))
        this.scrapParseError(`'${name}' is not allowed as a variable declaration name.`)

      this.nextToken() // eats identifier variable name
    }

    if (this.cursor.currentTok.content === Tokens.COLON) {
      if (this.nextToken().type !== "IdentifierName") {
        this.scrapParseError("Missing data type after colon ':'")
      } else this.nextToken() // consume the data type
    }

    if (this.cursor.currentTok.content === Tokens.EQUAL) {
      this.nextToken() // eat '='
  
      variableExpression = this.parseExpr(scope)
    }

    return new exp.DeclarationAST("variable", name, variableExpression)
  }

  /**
   * Parses a reference to a variable
   * @explain
   * - A reference is a variable (variable or constant) which points to the data allocated in the variable which has been assigned
   *
   * @returns A `ReferenceExpression` expression
   */
  private parseReference(scope: Scope): exp.ReferenceExpression {
    this.nextToken() // eat '&'
    const referenceTo = this.cursor.currentTok
    if (referenceTo.type !== "IdentifierName")
      this.scrapParseError("A reference cant only points to an already existent variable")

    this.parseIdentifier(scope)

    return new exp.ReferenceExpression(referenceTo.content)
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
  private parseReturn(scope: Scope) {
    this.nextToken() // eat 'return' keyword
    return this.parseExpr(scope)
  }

  /**
   * Parses if the eated identifier exists as a valid function or variable in the current or upper scope(s)
   *
   * @returns must be still resolved
   */
  private parseIdentifier(scope: Scope) {

    // TODO: parse a function call
    //
    // function call: IdentifierName

    // a variable ref
    if (!scope.searchReference(this.cursor.currentTok.content))
      this.scrapReferenceError(this.cursor.currentTok)

    this.nextToken() // eat the identifier
    return new exp.ExpressionAST()
  }

  /**
   * Parse an accessor token, either module or object accessor ( :: ) ( . ) respectively
   * @returns 
   */
  private parseAccessor(_scope: Scope) {

    if (this.cursor.currentTok.content === Tokens.MODULE_ACCESSOR) {
      // TODO: parses as a module accessor token ( :: )
    }

    // else: suppose that is a object accessor ( . )
    
    this.nextToken()

    return new exp.ExpressionAST()
  }

  private parseToken(scope: Scope) {
    switch (this.cursor.currentTok.content) {
      case Tokens.LBRACE: return this.parseLiteralObject(scope)
      case Tokens.LSQRBR: return this.parseLiteralArray(scope)
      case Tokens.AMPER: return this.parseReference(scope)
      case Tokens.DOT: return this.parseAccessor(scope)
      case Tokens.COLON: return this.parseAccessor(scope)
      case Tokens.PLUS:
      case Tokens.MINUS:
      case Tokens.STAR:
      case Tokens.SLASH: return this.parseBinaryExpression(0, this.parseExpr(scope), scope)
      default: this.scrapParseError("Token does not implemented yet")
    }
  }

  /**
   * Parse the different type of expressions and entities of ScrapLang* 
   * @param scope Scope where the parsed expression or declaration belongs to
   * @returns A parsed expression or a variable declaration
   */
  private parseExpr(scope: Scope): exp.ExpressionAST {

    // 
    if (this.cursor.currentTok.content === Keywords.FN)
      return this.parseFunction(false, false, scope)

    switch (this.cursor.currentTok.type) {
      case "IdentifierName": return this.parseIdentifier(scope)
      case "NumericLiteral": return pUtils.parseNumber.call(this)
      case "FloatLiteral": return pUtils.parseFloatNumber.call(this)
      case "CharLiteral": return pUtils.parseChar.call(this)
      case "StringLiteral": return pUtils.parseString.call(this)
      case "TemplateString": return pUtils.parseString.call(this) // TODO: Make a parseTemplateString function
      case "Operator": return new exp.BinaryExpression(20, 30, '+')
      case "Token": return this.parseToken(scope)

      case "Unknown": return this.scrapParseError("Unkown Token")

      default: this.scrapParseError("Unexpected token while parsing. Maybe it is not an expression")
    }
  }

  private parseStatement(scope: Scope, isPrimary: boolean): exp.EntityAST | exp.FunctionAST {
    if (isPrimary) {
      switch (this.cursor.currentTok.content) {
        case Keywords.FN: return this.parseFunction(false, false, scope)
        case Keywords.CONST: return this.parseConst(scope)
        case Keywords.CLASS: return this.parseClass(scope)
  
        default: this.scrapParseError(`'${this.cursor.currentTok.content}' does not appear to be a statement`)
      }
    } else {
      switch (this.cursor.currentTok.content) {
        case Keywords.FN: return this.parseFunction(false, false, scope)
        case Keywords.CONST: return this.parseConst(scope)
        case Keywords.VAR: return this.parseVar(scope)
  
        default: {
          const message = this.cursor.currentTok.type === "Statement" ?
            `'${this.cursor.currentTok.content}' is a primary statement and is not allowed here
            Learn more at: https://lang.scrapgames.com/tutorial/primary_statements` :
            `'${this.cursor.currentTok.content}' does not appear to be a statement`
            this.scrapParseError(message)
        }
      }
    }
  }

  /**
   * Parse the primary AST nodes that are allowed to appear in the 'root' of the file
   * Instead of call 'parse' this way is clearest because it call directly the methods that can parse the 'primary' structures.
   * 
   * In this way, we avoid that the program have posibilities of declare global variables.
   * Which in the long term, results confusing and make hard read code for the users which needs to read the source code of a program.
   * 
   * We reach this goal simply dont parsing the keywords in `parse` method
   * @returns 
   */
  public parsePrimary(): exp.EntityAST | exp.FunctionAST {
    switch (this.cursor.currentTok.content) {
      case Keywords.FN:
      case Keywords.CONST:
      case Keywords.CLASS:
      case Keywords.MODULE: {
        const parsedStatement = this.parseStatement(this.globalScope, true)
        this.addToGlobalScope(parsedStatement.getName, parsedStatement)

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
