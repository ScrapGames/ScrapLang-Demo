/**
 * Scraplang parser calls the lexer and collect all the tokens of that lexer
 * 
 * With the tokens already collected, that tokens needs to make sense.
 * 
 * For example, we cant assign a value to a keyword, e.g: const = 10,
 * this results on an error, since the const keyword represents a declaration instruction and cant be assigned.
 */

import * as exp from "../ast/Expressions.ts"

import Lexer, { Keywords, Tokens } from "../lexer/lexer.ts"
import type { ScrapClassMethod, ScrapClassProperty, ScrapParam, AccessorModifiers } from "../typings/Entities.ts"

import ParsingError from "./ParserErrors.ts"
import ParserCursor from "./parser-cursor.ts"

/**
 * TODO: parse identifiers expressions: 
 *      * identifier_expression ::= identifier
 *      * identifier_expression ::= identifier "(" expression* ")"
 * 
 * TODO: Handle scope where 
 */

export default class Parser {
  private lexer: Lexer
  cursor: ParserCursor
  warnings: string[]
  functions: exp.FunctionAST[]

  // deno-lint-ignore no-explicit-any
  rootScope: any[]

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cursor = new ParserCursor(lexer)
    this.warnings = []
    this.functions = []
    this.rootScope = []

    this.cursor.currentTok = this.cursor.consume() // gives an initial value to the parser
  }

  private scrapParseError(message: string) {
    throw new ParsingError(this.lexer, message)
  }

  private scrapGenerateWarn(message: string) {
    this.warnings.push(message)
  }

  public consume() { return this.cursor.consume() }

  public nextToken() { return this.cursor.currentTok = this.consume() }

  private _parseBinaryExpression() {}

  private literalParsers = {
    parseString: function parseString(this: Parser) {
      const stringExpr = new exp.StringLiteralExpression(this.cursor.currentTok.content)
      this.nextToken()
      return stringExpr
    },
  
    parseChar: function parseChar(this: Parser) {
      if (this.cursor.currentTok.content.length > 1)
        this.scrapParseError("Character content overflows the size of this type, only a character allowed")
  
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
    
    return new exp.Expression()
  }

  private parseLiteralArray() {
    this.nextToken() // eat '['
    const elements: exp.Expression[] = []

    while (this.cursor.currentTok.content !== Tokens.RSQRBR) {
      elements.push(this.parse())
      if (this.cursor.currentTok.content !== Tokens.RSQRBR) {
        if (this.cursor.currentTok.content !== Tokens.COMMA) {
          this.scrapParseError("Expected comma after item")
        } else this.nextToken() // consume the comma
      }
    }

    this.nextToken() // eat ']'

    return new exp.ArrayExpression(elements)
  }

  private parseLiteralObject() {
    this.nextToken() // eat '{'
    let keyName = ""
    let valueExpression: exp.Expression
    const keyValuePairs: [string, exp.Expression][] = []

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
      valueExpression = this.parse()
      
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
   * Parse a block of code. Which is represented by contain code between '{' and a '}'
   */
  private parseFunctionBody(): exp.Expression {
    let returnExpression: exp.Expression = "void"
    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      if (this.cursor.currentTok.content === Keywords.RETURN)
        returnExpression = this.parseReturn()
      else console.log(this.parse())
    }

    return returnExpression
  }

  /**
   * Same as `parseBody`, but since there are specific keywords inside a class body
   * like: public, private, protected or static. Parsing the content is different
   */
  private parseClassBody(classEntities: (ScrapClassProperty | ScrapClassMethod)[]) {
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
      

      classEntities.push({ accessor, isStatic, canOverride, astNode: this.parse() })

      isStatic = false
      canOverride = false
    }

    this.nextToken() // eat '}'

    return classEntities
  }

  /**
   * Same as `parseBody`, in this case, a module could contains another module.
   * By this reason, this reason, the body module parsing is separated from the normal `parseBody`
   */
  private parseModuleBody() {
    while (this.cursor.currentTok.content !== Tokens.RBRACE) {
      console.log(this.parsePrimary())
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

    } while (this.cursor.currentTok.content !== Tokens.RPAREN);
  }

  /**
   * A function is a block of code that can be accessed by type the name giben to the function.
   * In this way, we avoid to repeat the same code simultaneously over a program.
   * 
   * A function is compounded by a name, a list of parameters, comprises by a parenthesis pair and a body ( ( , ) ), comprises by a curly braces pair ( { , } )
   * @returns A new function statement
   */
  private parseFunction(isMethod: boolean) {
    const params: ScrapParam[] = []

    this.nextToken() // eat 'fn' keyword
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

    if (this.nextToken().content !== Tokens.RPAREN) {
      if (isMethod)
        params.push({ pName: "this", pType: "this" })
      this.parseParamList(params)
    }

    if (this.cursor.next().content === Tokens.COLON) {
      do {
        this.nextToken()
      } while (this.cursor.currentTok.content !== Tokens.LBRACE);
    }

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing function body open")

    this.nextToken() // eat '{'

    const returnType = this.parseFunctionBody()

    this.nextToken() // eat '}'

    const newFunction = new exp.FunctionAST(fName, params, returnType)
    this.functions.push(newFunction)
    return newFunction
  }

  /**
   * Parse a module declaration.
   * 
   * A Module is a block of code that recursively can contains other modules or other statements, like function, constants, etc.
   * @returns A Module declaration for the AST
   */
  private parseModule() {
    this.nextToken() // eat 'module' keyword
    const moduleName = this.cursor.currentTok.content
    const firstModuleNameLetter = moduleName.charAt(0)
    if (!/[A-Z]/.test(firstModuleNameLetter))
      this.scrapGenerateWarn(`A module name should have a Pascal-Case format. '${firstModuleNameLetter.toUpperCase() + moduleName.substring(1)}' in this case.`)

    if (this.nextToken().content !== Tokens.LBRACE)
      this.scrapParseError("Missing module body opening '{'")

    this.nextToken() // eat '{'

    this.parseModuleBody()

    this.nextToken() // eat '}'

    return new exp.ModuleAST(moduleName)
  }

  private parseClass() {
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

    if (this.nextToken().content === Tokens.LBRACE) {
      this.parseClassBody(classEntities)
    }

    return new exp.ClassAST(className, classEntities, false)
  }

  /**
   * Parse a constant declaration and initialization.
   * A const is a value allocated in memory which the value which points cant change, but that pointed memory can change
   * 
   * error e.g:
   * const num = 10
   * num = 20 // error!
   * 
   * valid e.g:
   * function sum(n1: i32, n2: i32) { return n1 + n2 }
   * const num = sum(10, 20)
   * 
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
  private parseConst() {
    let name = ""
    this.nextToken() // eat 'const' keyword
    if (this.cursor.currentTok.type !== "IdentifierName" && (this.cursor.currentTok.content !== Tokens.LSQRBR && this.cursor.currentTok.content !== Tokens.LBRACE))
      this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'")

    if (this.cursor.currentTok.content === Tokens.LSQRBR)
      return this.parseArrayDestructing()
    else if (this.cursor.currentTok.content === Tokens.LBRACE)
      return this.parseLiteralObject()
    else {
      name = this.cursor.currentTok.content
      this.cursor.currentTok
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

    const constantExpression = this.parse()

    return new exp.DeclarationAST("constant", name, constantExpression)
  }

  private parseVar() {
    let name = ""
    let variableExpression: exp.Expression = new exp.Expression()

    this.nextToken() // eat 'var' keyword
    if (this.cursor.currentTok.type !== "IdentifierName" && (this.cursor.currentTok.content !== Tokens.LSQRBR && this.cursor.currentTok.content !== Tokens.LBRACE))
      this.scrapParseError("Invalid variable declaration, expected an identifier, '[' or '{'")

    if (this.cursor.currentTok.content === Tokens.LSQRBR)
      return this.parseArrayDestructing()
    else if (this.cursor.currentTok.content === Tokens.LBRACE)
      return this.parseLiteralObject()
    else {
      name = this.cursor.currentTok.content
      this.cursor.currentTok
      this.nextToken() // eats identifier variable name
    }

    if (this.cursor.currentTok.content === Tokens.COLON) {
      if (this.nextToken().type !== "IdentifierName") {
        this.scrapParseError("Missing data type after colon ':'")
      } else this.nextToken() // consume the data type
    }

    if (this.cursor.currentTok.content === Tokens.EQUAL) {
      this.nextToken() // eat '='
  
      variableExpression = this.parse()
    }

    return new exp.DeclarationAST("variable", name, variableExpression)
  }

  private parseReference() {
    this.nextToken() // eat '&'
    const referenceTo = this.cursor.currentTok
    if (referenceTo.type !== "IdentifierName")
      this.scrapParseError("A reference cant only points to an already existent variable")

    this.nextToken() // advance for next parsings

    return new exp.ReferenceExpression(referenceTo.content)
  }

  private parseReturn() {
    this.nextToken() // eat 'return' keyword

    const parsedExpression = this.parse()
    
    console.log(this.cursor.currentTok)

    return parsedExpression
  }

  // deno-lint-ignore no-explicit-any
  private parse(): any {
    switch (this.cursor.currentTok.type) {
      case "IdentifierName": return new exp.Expression()
      case "Keyword": {
        switch (this.cursor.currentTok.content) {
          case Keywords.FN: return this.parseFunction(false) // here we suppose that the parsed function is not inside a class scope, so isnt a method
          case Keywords.CONST: return this.parseConst()
          case Keywords.VAR: return this.parseVar()
          case Keywords.RETURN: return this.parseReturn()
          
          case Keywords.CLASS:
          case Keywords.MODULE: {
            this.scrapParseError("The keywords class, module, interface, enum, export, import. Are only permitted as a first AST node. Place them at the 'root' of the file")
          }
        }
      } break
      case "Punctuator": return new exp.Expression()
      case "NumericLiteral": return this.literalParsers.parseNumber.call(this)
      case "FloatLiteral": return this.literalParsers.parseFloatNumber.call(this)
      case "CharLiteral": return this.literalParsers.parseChar.call(this) // needs lexer since this function can throws a 'ParsingError'
      case "StringLiteral": return this.literalParsers.parseString.call(this)
      case "TemplateString": return this.literalParsers.parseString.call(this) // TODO: Make a parseTemplateString function
      case "Operator": return new exp.Expression()
      case "Token": {
        if (this.cursor.currentTok.content === Tokens.LBRACE)
          return this.parseLiteralObject()
        else if (this.cursor.currentTok.content === Tokens.LSQRBR)
          return this.parseLiteralArray()
        else if (this.cursor.currentTok.content === Tokens.AMPER)
          return this.parseReference()
      } break
      case "Unknown": this.scrapParseError("Unkown Token"); break

      default: this.scrapParseError("Unexpected token while parsing")
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
  public parsePrimary() {
    switch (this.cursor.currentTok.content) {
      case Keywords.FN: return this.parseFunction(false)
      case Keywords.CONST: return this.parseConst()
      case Keywords.CLASS: return this.parseClass()
      case Keywords.MODULE: return this.parseModule()

      default: {
        const invalidTokenHereErrorStringMessage = `The token '${this.cursor.currentTok.content}' after '${this.cursor.previous().content}', is not allowed here`

        this.scrapParseError(`${invalidTokenHereErrorStringMessage}. Only keywords: 'fn', 'const', 'class', 'module', 'interface', 'enum', 'import' and 'export' keyword are allowed as primary statement`)
      }
      //case "interface"
      //case "enum"
      //case "export":
      //case import
      }
  }
}