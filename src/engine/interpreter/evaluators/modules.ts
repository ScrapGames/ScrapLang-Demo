import { Interpreter, scrapReferenceError, scrapRuntimeError } from "../interpreter.ts"

import { Scope, createEmptyScope } from "../../scope.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"
import { ScrapFunction, ScrapValue } from "@lang/elements/commons.ts"

import { CallNode, ModuleAccessNode, ModuleNode } from "@ast/nodes.ts"

export function evalModuleStmt(interpreter: Interpreter, mod: ModuleNode, scope: Scope): ScrapModule {
  const newMod = new ScrapModule(mod.name, mod.isExported, createEmptyScope(scope, mod.name))

  for (const nodeEntity of mod.Body) {
    const computedEntity = interpreter.computeEntity(nodeEntity, newMod.Scope)
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
export function evalModuleAccess(interpreter: Interpreter, node: ModuleAccessNode, scope: Scope): ScrapValue {
  const target = scope.get(node.getTarget.Symbol) as ScrapModule | undefined
  if (!target)
    scrapReferenceError(interpreter.parser)

  const member = target.get("print")
  if (!member)
    scrapReferenceError(interpreter.parser)

  if (!member.isExported)
    scrapRuntimeError(`The module '${node.getTarget.Symbol}', defines '${"print"}' but doesn't exports it`)

  if (node.getTarget.isCall()) {
    const callee = interpreter.findCallee(node.getTarget as CallNode, target.Scope)
    return interpreter.execCallee(node.getTarget as CallNode, callee, scope)
  }

  // PROVISIONAL: weird way to access elements just inside the target module (Target::searchedEntity)
  const searcher = (name: string) => target.Scope.Entries.get(name) as (ScrapVariable | ScrapFunction) | undefined
  return interpreter.computeIdentifier(node.getTarget, target.Scope, searcher)
}