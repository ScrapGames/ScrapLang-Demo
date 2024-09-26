import { Interpreter } from "@interpreter"

import { Scope, createEmptyScope } from "@lang/scope.ts"

import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"

import { NodeValueType } from "@ast/ast.ts"
import { CallNode, IdentifierNode, ModuleAccessNode, ModuleNode } from "@ast/nodes.ts"

/**
 * 
 * @param mod
 * @param scope
 * @returns
 */
export function computeMod(this: Interpreter, mod: ModuleNode, scope: Scope): ScrapModule {
  const newMod = new ScrapModule(mod.name, createEmptyScope(scope, mod.name), mod.getExports)

  for (const nodeEntity of mod.getBody) {
    const computedEntity = this.computeEntity(nodeEntity, newMod.getScope)
    newMod.insert(computedEntity.name, computedEntity)
  }

  return newMod
}

/**
 * Returns the ScrapValue stored in the accessed entity ()
 * @param node Node which contains the accessed entity and in which module it is defined
 * @param scope Scope where the accessed
 * @returns
 */
export function computeModuleAccess(this: Interpreter, node: ModuleAccessNode, scope: Scope): ScrapValue {
  const mod = scope.getReference(node.getAccessedMod) as ScrapModule | undefined
  if (!mod)
    this.scrapReferenceError()

  const entityName = node.getAccessedEntity instanceof CallNode ? node.getAccessedEntity.getCallee : node.getAccessedEntity.getSymbol
  if (!mod.getEntity(entityName))
    this.scrapReferenceError()

  if (!mod.isExported(entityName))
    this.scrapRuntimeError(`The module '${node.getAccessedMod}', defines '${entityName}' but doesn't exports it`)

  if (guardsV.isCall(node.getTarget)) {
    // module scope is only used 
    const callee = this.findCallee(node.getAccessedEntity as CallNode, mod.getScope)
    return this.execCallee(node.getAccessedEntity as CallNode, callee, scope)
  }

  // At this point, 'node.getAccessedEntity' is an IdentifierNode
  return this.computeIdentifier(node.getAccessedEntity as IdentifierNode, mod.getScope)
}