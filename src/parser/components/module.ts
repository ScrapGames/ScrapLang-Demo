
import { Keywords, Tokens } from "@lexer/lexer.ts"
import Parser from "@parser/parser.ts"

import { Scope } from "@lang/scope.ts"
import { Nameable } from "@typings";

type ParsedModuleEntity = { entity: Nameable, exports?: true }

function parseModuleEntity(parser: Parser, scope: Scope): ParsedModuleEntity {
  if (parser.cursor.currentTok.content === Keywords.EXPORT) {
    parser.nextToken() // eat 'export' keyword

    return { entity: parser.parseStatement(scope), exports: true }
  }

  return { entity: parser.parseStatement(scope) }
}

/**
 * Parses the module body returning the body
 */
export function parseModuleBody(parser: Parser, scope: Scope) {
  const body: Nameable[] = []
  const exports: Set<string> = new Set()
  let moduleEntity: ParsedModuleEntity

  while (parser.cursor.currentTok.content !== Tokens.RBRACE) {
    moduleEntity = parseModuleEntity(parser, scope)

    if (moduleEntity.exports)
      exports.add(moduleEntity.entity.name)

    scope.addEntry(moduleEntity.entity.name, moduleEntity.entity)
    body.push(moduleEntity.entity) // does not need to explcitly add to the scope, because parsePrimary already adds to the passed scope
  }

  return { body, exports }
}