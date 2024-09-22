import type { ASTEntityNode } from "@ast/ast.ts"

import { Keywords, Tokens } from "@lexer/lexer.ts"
import Parser from "@parser/parser.ts"
import { CallNode, IdentifierNode, ModuleAccessNode } from "@ast/nodes.ts";

function parseModuleEntity(parser: Parser): { entity: ASTEntityNode, exports?: true } {
  if (parser.getCursor.currentTok.content === Keywords.EXPORT) {
    parser.nextToken() // eat 'export' keyword

    return { entity: parser.parseStatement(), exports: true }
  }

  return { entity: parser.parseStatement() }
}

/**
 * Parses the module body returning the body
 */
export function parseModuleBody(parser: Parser) {
  const body: ASTEntityNode[] = []
  const exports: Set<string> = new Set()

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