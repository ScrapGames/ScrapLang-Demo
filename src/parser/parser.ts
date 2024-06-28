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
import { Type } from "./type-parser.ts"

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

export default class Parser {
  lexer: Lexer
  cursor: ParserCursor
  warnings: string[]
  functions: exp.FunctionAST[]
  typeRegistry: Type[]
  globalScope: Scope

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cursor = new ParserCursor(lexer)
    this.warnings = []
    this.typeRegistry = []
    this.functions = []
    this.globalScope = createEmptyScope(null, "MainModule")

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  public restart() {
    this.cursor.source = this.lexer.tokens()
    this.cursor.currentTok = this.cursor.source.at(0)!
    this.cursor.pos = 0

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  private scrapParseError(message: string, wrognToken: Token): never {
    throw new ParsingError(message, wrognToken)
  }

  private scrapGenerateWarn(message: string) {
    this.warnings.push(message)
  }

  private scrapReferenceError(undefinedVariable: Token): never {
    throw new UndefinedReferenceError(undefinedVariable)
  }

  public addToGlobalScope(key: string, value: ValidEntities) {
    const globalScp = this.globalScope
    if (!globalScp.addEntry(key, value)) // safety non-null assert: first node which is the global scope is always availabe
      this.scrapParseError("Duplicate identifier '" + key + "' at '" + globalScp.getOwner + "'", this.cursor.currentTok)
  }

  public addToScope(scope: Scope, key: string, value: ValidEntities) {
    if (!scope.addEntry(key, value)) {
      this.scrapParseError("Duplicate identifier '" + key + "' at '" + scope.getOwner + "'", this.cursor.currentTok)
    }
  }

  private consume() { return this.cursor.consume() }

  private nextToken() { return this.cursor.currentTok = this.consume() }

  private _parseBinaryExpression() {}

  private literalParsers = {
    parseString: function parseString(this: Parser) {
      const stringExpr = new exp.StringLiteralExpression(this.cursor.currentTok.content)

      this.nextToken()
      return stringExpr
    },
  
    parseChar: function parseChar(this: Parser) {
      if (this.cursor.currentTok.content.length > 1)
        this.scrapParseError("Character content overflows the size of this type, only a character allowed", this.cursor.currentTok)
  
      const charExpr = new exp.CharLiteralExpression(this.cursor.currentTok.content)

      this.nextToken()
      return charExpr
    },
  
    parseNumber: function parseNumber(this: Parser) {
      const numExpr = new exp.IntegerExpression(parseInt(this.cursor.currentTok.content))

      this.nextToken()
      return numExpr
    },
  
    parseFloatNumber: function parseFloatNumber(this: Parser) {
      const floatExpr = new exp.FloatExpression(parseFloat(this.cursor.currentTok.content))

      this.nextToken()
      return floatExpr
    }
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
          this.scrapParseError("Expecting variable identifier", this.cursor.currentTok)

        this.nextToken() // eat the identifier (variable)
        if (this.cursor.currentTok.content === Tokens.COMMA)
          if (this.cursor.next().type !== "IdentifierName")
            this.scrapParseError("Expected identifier name after comma", this.cursor.currentTok)
          else
            this.nextToken() // eats the comma, then in the next iteration the currentTok should be an identifier
      } while (this.cursor.currentTok.content !== Tokens.RSQRBR)
    } else
      this.scrapGenerateWarn("A destructing pattern should have at least a variable")
    
    return new exp.ExpressionAST()
  }

  /**
   * Parses the literal form of create an array
   * @returns 
   */
  private parseLiteralArray(scope: Scope) {
    this.nextToken() // eat '['
    const elements: exp.ExpressionAST[] = []

    while (this.cursor.currentTok.content !== Tokens.RSQRBR) {
      elements.push(this.parse(scope))
      if (this.cursor.currentTok.content !== Tokens.RSQRBR) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Expected comma after item", this.cursor.currentTok)
        } else this.nextToken() // consume the comma
      }
    }

    this.nextToken() // eat ']'

    return new exp.ArrayExpression(elements)
  }

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
        this.scrapParseError("object key from a key-value pair must be an identifier or a string", this.cursor.currentTok)
      }
      keyName = this.cursor.currentTok.content

      if (this.nextToken().content !== Tokens.COLON)
        this.scrapParseError("Missing colon ':'", this.cursor.currentTok)

      this.nextToken() // eat the colon ':'
      valueExpression = this.parse(scope)
      
      if (this.cursor.currentTok.content !== Tokens.RBRACE) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Missing comma after key-value", this.cursor.currentTok)
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
          this.scrapParseError("A constructor can not have a return statement", this.cursor.currentTok)
        else
          returnExpression = this.parseReturn(scope)
      else {
        const parsedObj = this.parse(scope)

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
      this.scrapParseError("Function name expected", this.cursor.currentTok)
    const fName = this.cursor.currentTok.content

    if (this.nextToken().content !== Tokens.LPAREN)
      this.scrapParseError("Missing function parameters", this.cursor.currentTok)

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
      this.scrapParseError("Missing function body open", this.cursor.currentTok)
    
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
          this.scrapParseError("Invalid class property declaration, expected an identifier", this.cursor.currentTok)

          name = this.cursor.currentTok.content
          this.nextToken() // eats identifier variable name

        //@ts-ignore: ???
        if (this.cursor.currentTok.content === Tokens.COLON) {
          if (this.nextToken().type !== "IdentifierName")
            this.scrapParseError("Missing data type after colon ':'", this.cursor.currentTok)
          else this.nextToken() // consume the data type
        }

        //@ts-ignore: ???
        if (this.cursor.currentTok.content !== Tokens.EQUAL)
          this.scrapParseError("Missing assignment operator '=' after const declaration. A constant must be initialized since his value can not change", this.cursor.currentTok)

        this.nextToken() // eat '='

        return new exp.DeclarationAST("constant", name, this.parse(scope))
      }

      case Keywords.VAR: {
        let name = ""
        let variableExpression: exp.ExpressionAST = new exp.ExpressionAST()

        this.nextToken() // eat 'var' keyword
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'", this.cursor.currentTok)

          name = this.cursor.currentTok.content
          this.cursor.currentTok
          this.nextToken() // eats identifier variable name

        //@ts-ignore: ???
        if (this.cursor.currentTok.content === Tokens.COLON) {
          if (this.nextToken().type !== "IdentifierName") {
            this.scrapParseError("Missing data type after colon ':'", this.cursor.currentTok)
          } else this.nextToken() // consume the data type
        }

        //@ts-ignore: ???
        if (this.cursor.currentTok.content === Tokens.EQUAL) {
          this.nextToken() // eat '='
      
          variableExpression = this.parse(scope)
        }

        return new exp.DeclarationAST("variable", name, variableExpression)
      }

      default: this.scrapParseError("Unknown class entity", this.cursor.currentTok)
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
        this.scrapParseError("Missing parameter name", this.cursor.currentTok)
      pName = this.cursor.currentTok.content

      if (this.nextToken().content !== Tokens.COLON)
        this.scrapParseError("Missing colon ':' after parameter name indicating data type", this.cursor.currentTok)

      this.nextToken()
      if (this.cursor.currentTok.content === "...") {
        if (this.nextToken().type !== "IdentifierName") {
          this.scrapParseError("Missing parameter data type", this.cursor.currentTok)
        } else {
          // Variable args is taked as an array by the compiler and must be managed in the same way by the user in the function body
          pType = this.cursor.currentTok.content + "[]"
          params.push({ pName, pType })
        }

        if (this.cursor.next().content === Tokens.COMMA) {
          this.scrapParseError("Variable arguments using elipsis \"...\" must be the last parameter in the list", this.cursor.currentTok)
        }
      } else
        if (this.cursor.currentTok.type !== "IdentifierName")
          this.scrapParseError("Missing parameter data type", this.cursor.currentTok)
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
      this.scrapParseError("Missing module name", this.cursor.currentTok)

    const moduleName = this.cursor.currentTok.content
    const firstModuleNameLetter = moduleName.charAt(0)
    if (!/[A-Z]/.test(firstModuleNameLetter))
      this.scrapGenerateWarn(`A module name should have a Pascal-Case format. '${firstModuleNameLetter.toUpperCase() + moduleName.substring(1)}' in this case.`)

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing module body opening '{'", this.cursor.currentTok)

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
          this.scrapParseError("'override' keyword must be preceeded only by a function or variable declaration", this.cursor.currentTok)          
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
      this.scrapParseError("Expected a class name", this.cursor.currentTok)
    const className = this.cursor.currentTok.content
    
    this.nextToken() // eat class name (identifier)
    if (this.cursor.currentTok.content === Keywords.EXTENDS || this.cursor.currentTok.content === Keywords.IMPLEMENTS) {
      if (this.cursor.currentTok.content === Keywords.EXTENDS) {
        if (this.nextToken().type !== "IdentifierName")
          this.scrapParseError("Expected an identifier", this.cursor.currentTok)

        if (this.cursor.next().content === Keywords.IMPLEMENTS) {
          this.nextToken() // now currentTok is "implements"

          if (this.nextToken().type !== "IdentifierName") {
            this.scrapParseError("Expected an identifier", this.cursor.currentTok)
          }
        }
      }

      if (this.cursor.currentTok.content === Keywords.IMPLEMENTS) {
        if (this.nextToken().type !== "IdentifierName")
          this.scrapParseError("Expected an identifier", this.cursor.currentTok)
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
      this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'", this.cursor.currentTok)
    }

    if (this.cursor.currentTok.content === Tokens.LSQRBR)
      this.parseArrayDestructing()
    else if (this.cursor.currentTok.content === Tokens.LBRACE)
      this.parseLiteralObject(scope) // TODO: make a 'parseObjectDestructing' function
    else {
      name = this.cursor.currentTok.content
      this.nextToken() // eats identifier variable name
    }


    if (this.cursor.currentTok.content === Tokens.COLON) {
      if (this.nextToken().type !== "IdentifierName") {
        this.scrapParseError("Missing data type after colon ':'", this.cursor.currentTok)
      } else this.nextToken() // consume the data type
    }

    if (this.cursor.currentTok.content !== Tokens.EQUAL)
      this.scrapParseError("Missing assignment operator '=' after const declaration. A constant must be initialized since his value can not change", this.cursor.currentTok)

    this.nextToken() // eat '='

    const constantExpression = this.parse(scope)

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
      this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'", this.cursor.currentTok)

    if (this.cursor.currentTok.content === Tokens.LSQRBR)
      this.parseArrayDestructing()
    else if (this.cursor.currentTok.content === Tokens.LBRACE)
      this.parseLiteralObject(scope)
    else {
      name = this.cursor.currentTok.content
      this.cursor.currentTok
      this.nextToken() // eats identifier variable name
    }

    if (this.cursor.currentTok.content === Tokens.COLON) {
      if (this.nextToken().type !== "IdentifierName") {
        this.scrapParseError("Missing data type after colon ':'", this.cursor.currentTok)
      } else this.nextToken() // consume the data type
    }

    if (this.cursor.currentTok.content === Tokens.EQUAL) {
      this.nextToken() // eat '='
  
      variableExpression = this.parse(scope)
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
      this.scrapParseError("A reference cant only points to an already existent variable", this.cursor.currentTok)

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
    return this.parse(scope)
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
  private parseAccessor(scope: Scope) {

    if (this.cursor.currentTok.content === Tokens.MODULE_ACCESSOR) {
      // TODO: parses as a module accessor token ( :: )
    }

    // else: suppose that is a object accessor ( . )
    
    this.nextToken()

    return new exp.ExpressionAST()
  }

  /**
   * Parse the different type of expressions and entities of ScrapLang* 
   * @param scope Scope where the parsed expression or declaration belongs to
   * @returns A parsed expression or a variable declaration
   */
  private parse(scope: Scope): exp.ExpressionAST | exp.EntityAST {
    switch (this.cursor.currentTok.type) {
      case "IdentifierName": return this.parseIdentifier(scope)
      case "NumericLiteral": return this.literalParsers.parseNumber.call(this)
      case "FloatLiteral": return this.literalParsers.parseFloatNumber.call(this)
      case "CharLiteral": return this.literalParsers.parseChar.call(this)
      case "StringLiteral": return this.literalParsers.parseString.call(this)
      case "TemplateString": return this.literalParsers.parseString.call(this) // TODO: Make a parseTemplateString function
      case "Operator": return new exp.BinaryExpression({}, {}, '+')
      case "Keyword": { // ignores no-fallthrough is safety use in this case statement since once reached the keywords class, module, interface, enum, export, import the program will crash throwing an error
        switch (this.cursor.currentTok.content) {
          case Keywords.FN: return this.parseFunction(false, false, scope) // here we suppose that the parsed function is not inside a class scope, so is not a method
          case Keywords.CONST: return this.parseConst(scope)
          case Keywords.VAR: return this.parseVar(scope)
          case Keywords.RETURN: return this.parseReturn(scope)
          
          case Keywords.CLASS:
          case Keywords.MODULE:
          case Keywords.INTERFACE:
          case Keywords.ENUM:
          case Keywords.EXPORT:
          case Keywords.IMPORT: {
            this.scrapParseError(
              "The keywords class, module, interface, enum, export, import. Are only permitted to be declared at the MainModule. Place them at the 'root' of the file",
              this.cursor.currentTok
            )
          }
        }
      }

      // deno-lint-ignore no-fallthrough
      case "Token": {
        if (this.cursor.currentTok.content === Tokens.LBRACE)
          return this.parseLiteralObject(scope)
        else if (this.cursor.currentTok.content === Tokens.LSQRBR)
          return this.parseLiteralArray(scope)
        else if (this.cursor.currentTok.content === Tokens.AMPER)
          return this.parseReference(scope)
        else if (this.cursor.currentTok.content === Tokens.DOT || this.cursor.currentTok.content === Tokens.COLON)
          return this.parseAccessor(scope)
      }

      case "Unknown": return this.scrapParseError("Unkown Token", this.cursor.currentTok)

      default: this.scrapParseError("Unexpected token while parsing", this.cursor.currentTok)
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
      case Keywords.FN: {
        const functionDeclaration = this.parseFunction(false, false, this.globalScope)
        this.addToGlobalScope(functionDeclaration.getName, functionDeclaration)


        return functionDeclaration
      }
      case Keywords.CONST: {
        const constantDeclaration = this.parseConst(this.globalScope)
        this.addToGlobalScope(constantDeclaration.getName, constantDeclaration)

        return constantDeclaration
      }
      case Keywords.CLASS: {
        const classDeclaration = this.parseClass(this.globalScope)
        this.addToGlobalScope(classDeclaration.getName, classDeclaration)

        return classDeclaration
      }
      case Keywords.MODULE: {
        const moduleDeclaration = this.parseModule(this.globalScope)
        this.addToGlobalScope(moduleDeclaration.getName, moduleDeclaration)

        return moduleDeclaration
      }

      default: {
        const invalidTokenHereErrorStringMessage = `The token '${this.cursor.currentTok.content}' after '${this.cursor.previous().content}', is not allowed here`

        this.scrapParseError(
          `${invalidTokenHereErrorStringMessage}. Only keywords: 'fn', 'const', 'class', 'module', 'interface', 'enum', 'import' and 'export' keywords are allowed as primary statements.
            Learn more at: https://lang.scrapgames.com/tutorial/primary_statements`, this.cursor.currentTok)
      }
      //case "interface"
      //case "enum"
      //case "export":
      //case import
      }
  }
}