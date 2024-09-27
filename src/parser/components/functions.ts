import { ASTValueNode } from "@ast/ast.ts"
import { ScrapParam, Instructions } from "@typings"

import { Keywords, Tokens } from "@lexer/lexer.ts"

import Parser from "@parser/parser.ts"

import type { ScrapParam, Instruction } from "@typings"
export function parseAsyncFn(parser: Parser, isMethod: boolean, isStatic: boolean, isExpression: boolean): FunctionNode {
  parser.expectsContent(Keywords.FN, "'async' keywords is only applicable to functions")
  return parser.parseFunction(true, isMethod, isStatic, isExpression)
}

function parseParameter(parser: Parser): ScrapParam {
  const pName = parser.expectsType("IdentifierName", "Missing parameter name").content
  parser.nextToken() // eats ':' token
  const pType = parser.expectsType("IdentifierName", "Missing parameter data type").content

  return { pName, pType }
}

/**
 * Fills the array passed as parameter `param` with the parameters of the parsed function
 * @param param Array of params that the function receive
 */
export function parseParamList(parser: Parser): ScrapParam[] {
  const params: ScrapParam[] = []
  while (parser.getCursor.currentTok.content !== Tokens.RPAREN) {
    params.push(parseParameter(parser))

    if (parser.nextToken().content === Tokens.COMMA) {
      parser.nextToken()
    }
  }

  return params
}

/**
 * Parses a function entity, which is any element which is allowed to be placed inside a function body (between '{' and '}')
 *
 * @param parser Parser used to _parse_ the function body
 * @param scope scope where variabled are saved and references are searched
 * @returns An allowed element inside a function body: they can be: other `DefinedFunctions`, `ScrapVariables` or `ScrapCalls` to any function
 */
function parseFunctionEntity(parser: Parser): Instruction {
  const toBeParsedTok = parser.getCursor.currentTok

  if (toBeParsedTok.type === "IdentifierName") {
    const parsedId = parser.parseIdentifier()

    return parsedId as Instruction
  } else {
    switch (toBeParsedTok.content) {
      case Keywords.FN:
      case Keywords.VAR:
      case Keywords.CONST: return parser.parseStatement() as Instruction

      default: {
        parser.scrapParseError("Only 'fn', 'var', 'const', function calls and reassignments are allowed inside a function body")
      }
    }
  }
}

/**
 * Parse the block of code that correspond with a function. Which is represented by contain code between '{' and a '}'
 * @param isMethod
 * @param scope `Scope` where the function can registry variables that has been declared inside his body
 */
export function parseFunctionBody(parser: Parser, fName: string) {  
  const body: Instruction[] = []

  while (parser.getCursor.currentTok.content !== Tokens.RBRACE) {
    if (parser.getCursor.currentTok.content === Keywords.RETURN) {
      if (fName === "constructor")
        parser.scrapParseError("A constructor can not have a return statement")
      
      return { body, return: parseReturn(parser) }
    } else {
      body.push(parseFunctionEntity(parser))
    }
  }

  return { body, return: new UndefinedNode() }
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
export function parseReturn(parser: Parser): ASTValueNode {
  parser.nextToken() // eat 'return' keyword
  return parser.parseExpr()
}