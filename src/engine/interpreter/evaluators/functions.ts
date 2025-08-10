import { FunctionStmtNode } from "@ast/nodes.ts"

import { Scope, createEmptyScope } from "../../scope.ts"
import { ScrapDefinedFn } from "@lang/elements/commons.ts"

/**
 * Computes the return value of the received `FunctionNode`
 * @param fn `FunctionNode` which contains all the needed element to create a new `DefinedFuncion` object
 * @param scope Scope where the 
 * @returns A new `DefinedFunction`
 */
export function computeFn(fn: FunctionStmtNode, scope: Scope): ScrapDefinedFn {
    const fScope = createEmptyScope(scope, fn.name)
    return new ScrapDefinedFn(fn.name, fn.isExported, fScope, fn.Params, fn.Body, fn.getCallVal)
}