import type { ASTEntityNode } from "@ast/ast.ts"

import { Keywords, Tokens } from "@lexer/lexer.ts"
import Parser from "@parser/parser.ts"
import { EntityNode } from "@ast/ast.ts"
 */
export function parseModuleBody(parser: Parser) {
  const body: EntityNode[] = []

  while (parser.getCursor.currentTok.content !== Tokens.RBRACE) {
    const moduleEntity = parseModuleEntity(parser)

    if (moduleEntity.exports)
      exports.add(moduleEntity.entity.name)

    body.push(moduleEntity.entity) // does not need to explcitly add to the scope, because parsePrimary already adds to the passed scope
  }

  return { body, exports }
}

export function parseModuleAccessor(parser: Parser, accessedMod: string): ModuleAccessNode {
  parser.nextToken() // eat accessor (::)
  return new ModuleAccessNode(accessedMod, parser.parseExpr() as CallNode | IdentifierNode)
}