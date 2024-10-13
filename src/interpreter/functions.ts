import { FunctionNode } from "@ast/nodes.ts"

import { Scope, createEmptyScope } from "@lang/scope.ts"
import { DefinedFunction } from "@lang/elements/commons.ts"

/**
 * Computes the return value of the received `FunctionNode`
 * @param fn `FunctionNode` which contains all the needed element to create a new `DefinedFuncion` object
 * @param scope Scope where the 
 * @returns A new `DefinedFunction`
 */
export function computeFn(fn: FunctionNode, scope: Scope): DefinedFunction {
    const fScope = createEmptyScope(scope, fn.name)
    return new DefinedFunction(fn.name, fn.isExported, fScope, fn.getParams, fn.getBody, fn.getReturnValue)
}