import Parser from "@parser/parser.ts"
import { Keywords, Tokens } from "@lexer/lexer.ts"
import { parseAsync } from "@parser/components/functions.ts"
import { AccessorModifiers, ScrapClassEntityProps } from "@typings"

import { Scope } from "@lang/scope.ts"
import { DefinedFunction } from "@lang/elements/commons.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"

function parseClassEntity(parser: Parser, isStatic: boolean, scope: Scope): ScrapVariable | DefinedFunction {
  switch (parser.cursor.currentTok.content) {
    case Keywords.ASYNC: return parseAsync(parser, true, isStatic, scope)
    case Keywords.FN: return parser.parseFunction(false, true, isStatic, scope)
    case Keywords.CONST:
    case Keywords.VAR: return parser.parseVar(scope)
  }

  parser.scrapParseError("Unknown class entity")
}

function canStaticOrOverride(parser: Parser): { isStatic: boolean, canOverride: boolean } {
  parser.nextToken() // eat 'static'
  const isStatic = true
  let canOverride = false

  // @ts-ignore: parser.nextToken() has already advanced the position of the cursor
  // so the comparation is correct
  if (parser.cursor.currentTok.content === Keywords.OVERRIDE) {
    parser.nextToken() // eat 'override'
    canOverride = true
  }

  return { isStatic, canOverride }
}

function canOverrideF(parser: Parser): boolean {
  parser.nextToken() // place currentTok to 'override'
  const canOverride = true

  const nextToken = parser.cursor.next()

  switch (nextToken.content) {
    case Keywords.FN:
    case Keywords.CONST:
    case Keywords.VAR: break
    default: parser.scrapParseError("'override' keyword must be preceeded only by a function or variable declaration")   
    
  }

  return canOverride
}

/**
 * Same as `parseBody`, but since there are specific keywords inside a class body
 * like: public, private, protected or static. Parsing the content is different
 */
export function parseClassBody(
    parser: Parser, classEntities: ScrapClassEntityProps[], scope: Scope
  ): ScrapClassEntityProps[] {
    parser.nextToken() // eat '{'
    let accessor: AccessorModifiers = "private"
    let isStatic = false
    let canOverride = false

    while (parser.cursor.currentTok.content !== Tokens.RBRACE) {
      switch (parser.cursor.currentTok.content) {
        case Keywords.PUBLIC:
        case Keywords.PRIVATE:
        case Keywords.PROTECTED: {
          accessor = parser.cursor.currentTok.content
          
          parser.nextToken() // eat accessor modifier
        } break

        case Keywords.STATIC: {
          const entityProps = canStaticOrOverride(parser)
          isStatic = entityProps.isStatic
          canOverride = entityProps.canOverride
        } break
  
        case Keywords.OVERRIDE: {
          canOverride = canOverrideF(parser)
        } break
      }

      const parsedClassScrapEntity = parseClassEntity(parser, isStatic, scope)
      classEntities.push({ accessor, isStatic, canOverride, entitiyType: parsedClassScrapEntity })
  
      parser.addToScope(scope, parsedClassScrapEntity.name, parsedClassScrapEntity)
      
      isStatic = false
      canOverride = false
    }


    parser.nextToken() // eat '}'

    return classEntities
  }