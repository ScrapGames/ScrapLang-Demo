import type { ClassAccessorModifier, ClassEntityMetadata, ClassEntity } from "@typings"

import { Keywords, Tokens } from "@lexer/lexer.ts"

import Parser from "@parser/parser.ts"
import { parseAsyncFn } from "@parser/components/functions.ts"

import { FunctionNode, VariableNode } from "@ast/nodes.ts"

/**
 * Parses a class entity, either property or method
 * @param parser parser used to _parse_ the class entity
 * @param isStatic Tells the parser if the parsed function is _static_
 * @returns A new ClassEntity
 */
function parseClassEntity(parser: Parser, isStatic: boolean): FunctionNode | VariableNode {
  switch (parser.getCursor.currentTok.content) {

    // return for methods
    case Keywords.ASYNC: return parseAsyncFn(parser, true, isStatic, false)
    case Keywords.FN:    return parser.parseFunction(false, true, isStatic, false)

    // return for properties
    case Keywords.CONST:
    case Keywords.VAR:   return parser.parseVar()
  }

  parser.scrapParseError("Invalid class entity. Its doesn't appear to be an property nor method")
}

function checkStaticAccessOrOverride(parser: Parser): ClassEntityMetadata {
  parser.nextToken() // eat 'static'
  const isStatic = true
  let canOverride = false

  if (parser.getCursor.currentTok.content === Keywords.OVERRIDE) {
    parser.nextToken() // eat 'override'
    canOverride = true
  }

  return { isStatic, canOverride }
}

function checkOveride(parser: Parser): boolean {
  parser.nextToken() // place currentTok to 'override'
  const canOverride = true

  const classEntityKW = parser.getCursor.next() // eat 'override' keyword

  // Here just check if the next token is a valid keyword to be preceed by 'override' keyword
  switch (classEntityKW.content) {
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
  parser: Parser, classEntities: ClassEntity[]
): ClassEntity[] {
  parser.nextToken() // eat '{'
  let accessor: ClassAccessorModifier = "private"
  const entityFlags: ClassEntityMetadata = { isStatic: false, canOverride: false }

  while (parser.getCursor.currentTok.content !== Tokens.RBRACE) {
    switch (parser.getCursor.currentTok.content) {
      case Keywords.PUBLIC:
      case Keywords.PRIVATE:
      case Keywords.PROTECTED: {
        accessor = parser.getCursor.currentTok.content
        
        parser.nextToken() // eat accessor modifier
      } break

      case Keywords.STATIC: {
        const entityProps = checkStaticAccessOrOverride(parser)
        entityFlags.isStatic = entityProps.isStatic
        entityFlags.canOverride = entityProps.canOverride

        parser.nextToken()
      } break

      case Keywords.OVERRIDE: {
        entityFlags.canOverride = checkOveride(parser)

        parser.nextToken()
      } break
    }

    const entity = parseClassEntity(parser, entityFlags.isStatic)
    classEntities.push({ accessor, entityFlags, entity })

    // Reset value to his initial values
    entityFlags.isStatic = false
    entityFlags.canOverride = false
  }


  parser.nextToken() // eat '}'

  return classEntities
}