import { addToScope, Interpreter, scrapReferenceError, scrapRuntimeError } from "@interpreter"
import { computeVar } from "./variables.ts"

import { Scope } from "@lang/scope.ts"

import { ObjectAccessNode, ObjectDestructuringNode } from "@ast/nodes.ts"
import guardsNodeV from "@ast/type-guards/values.ts"

import guards from "@lang/elements/guards.ts"
import { ScrapObject } from "@lang/elements/commons.ts"
import { ScrapUndefined } from "@lang/elements/values/absence.ts"

import { Exportable, Nameable } from "@typings"
import { VERSION } from "@scrap"

/**
 * Computes the parsed object destruction
 * @param obj Object to be destructed
 * @param scope Scope where the destructed elements will be added
 */
export function computeObjectDestruction(interpreter: Interpreter, obj: ObjectDestructuringNode, scope: Scope) {
    for (const declaration of obj.getDeclarations)
        addToScope(computeVar(interpreter, declaration, scope), scope)

    return new ScrapUndefined()
}

function computeObjAccess(access: ObjectAccessNode, obj: ScrapObject, superObjName: string) {
    const deepObj = obj.get(access.getObjName) as ScrapObject | undefined

    if (!deepObj)
        scrapRuntimeError(`Prperty '${access.getObjName}' doesn't exists in '${superObjName}'`)

    if (guardsNodeV.isObjectAccess(access.getTarget))
        return computeObjAccess(access.getTarget, deepObj, access.getObjName)

    const deepTarget = deepObj.get(access.getTargetName())
    if (!deepTarget)
        scrapRuntimeError(`Property '${access.getTargetName()}' does not exists in '${access.getObjName}'`)

    return deepTarget
}

export function getObjectFromContainer(interpreter: Interpreter, access: ObjectAccessNode, scope: Scope) {
    const objContainer = scope.get(access.getObjName) as (Nameable & Exportable) | undefined
    if (!objContainer)
        scrapReferenceError(interpreter.parser)

    // TODO: improve error messages and checks
    if (!guards.isVariable(objContainer))
        scrapRuntimeError(`ScrapLang ${VERSION} only supports property access to literal objects`)

    if (!guards.isObject(objContainer.getVal))
        scrapRuntimeError("Trying access to properties of a value which isn't a object")

    const obj = objContainer.getVal
    if (guardsNodeV.isObjectAccess(access.getTarget))
        return computeObjAccess(access.getTarget, obj, access.getObjName)

    return computeObjAccess(access, obj, access.getObjName)
}