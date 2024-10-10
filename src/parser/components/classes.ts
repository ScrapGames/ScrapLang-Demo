import { Keywords, Tokens } from "@tokens"

import Parser from "@parser/parser.ts"
import { FunctionNode, VariableNode, ClassEntityNode } from "@ast/nodes.ts"

import { ClassEntityMetadata, ClassEntityVisibility } from "@typings"

export function parseClassImplementsList(parser: Parser): string[] {
  const implementsList: string[] = []

  /**
   * Since there is no way to resolve when a list of implemented interfaces ends when a class hasn't
   * body, semicolon is used to determine the end of the class signature unless it contains a body.
   * 
   * In this example, semicolo is needed, ebcause class doesnt has a body
   * @example
   * class Server extends Socket implements Closeable;
   * 
   * --------------------------------------------------
   * 
   * Unlikely the past example, in this case, semicolon is not needed, because the class contains a body
   * even if it's empty
   * @example
   * class Server extends Socket implements Closeable {}
   */
  while (parser.curtt().content !== Tokens.LBRACE && parser.curtt().content !== Tokens.SEMICOLON) {
    implementsList.push(parser.nextToken().content)
    const endOfSign = parser.checkNext(Tokens.LBRACE) || parser.checkNext(Tokens.SEMICOLON)

    if (!endOfSign)
      parser.expectsContent(Tokens.COMMA, "Expected comma after interface name")
    
    parser.nextToken()
  }

  return implementsList
}

function varOrFnCheck(parser: Parser) {
  const tok = parser.curtt()

  // simply checks if parsed entity is valid
  // using `switch` is cleaner than use an `if`
  switch (tok.content) {
    case Keywords.VAR:
    case Keywords.CONST:
    case Keywords.ASYNC:
    case Keywords.FN: return true

    default: return false
  }
}

function parseClassEntityModifiers(parser: Parser): ClassEntityMetadata {
  let visibility: ClassEntityVisibility = "private"
  let canOverride = false
  let isStatic = false

  while (!varOrFnCheck(parser)) {
    switch (parser.curtt().content) {
      case Keywords.PUBLIC:
      case Keywords.PRIVATE:
      case Keywords.PROTECTED: {
        visibility = parser.curtt().content as ClassEntityVisibility
        parser.nextToken()
      } break

      case Keywords.OVERRIDE: {
        parser.nextToken()
        if (!varOrFnCheck(parser))
          parser.scrapParseError("'override' keyword must be preceeded by a class entity itself ('fn', 'const' or 'var')")

        canOverride = true
      } break

      /**
       * Eating 'override' and 'static' keywords is completly neccesary
       * unlikely visibility modifiers ('public', 'private', 'override'), which are 'ated' at the end of its case block
       * 
       * This is why both 'override' and 'static' needs to check if its preceeded token
       * is an entity itself ('fn', 'const' or 'var') in case of 'overrider'
       * or an 'override' or entity itself in case of 'static'
       * 
       * @example
       * class Server extends Socket {
       *  public fn override listen(opts: {...}) {...}
       * }
       * 
       * class Server extends Socket {
       *  public static override fn isListening(server: Server) {...}
       * }
       */

      case Keywords.STATIC: {
        parser.nextToken()
        if (!varOrFnCheck(parser) && !parser.isContent(Keywords.OVERRIDE))
          parser.scrapParseError("'static' keyword must be preceeded by a class entity itself or an override keyword")

        isStatic = true
      } break
    }
  }

  return { visibility, isStatic, canOverride }
}

/**
 * Parses a class entity, either property or method
 */
function parseClassEntity(parser: Parser): ClassEntityNode {
  const { visibility, isStatic, canOverride } = parseClassEntityModifiers(parser)

  return new ClassEntityNode(visibility, isStatic, canOverride, parser.parseStatement() as FunctionNode | VariableNode)
}

/**
 * TODO: complete this JSDoc comment accordsing to this method
 * @param parser 
 * @param classEntities 
 * @returns 
 */
export function parseClassBody(parser: Parser): ClassEntityNode[] {
  const classBody: ClassEntityNode[] = []

  while (parser.curtt().content !== Tokens.RBRACE) {
    classBody.push(parseClassEntity(parser))
  }

  return classBody
}