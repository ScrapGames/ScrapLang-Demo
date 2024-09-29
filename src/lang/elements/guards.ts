import { ScrapVariable } from "@lang/elements/entities/variables.ts"
import { DefinedFunction, ScrapFunction, ScrapNativeFn, ScrapObject, ScrapPrimitive, ScrapValue } from "@lang/elements/commons.ts"

import type { Nameable, Exportable } from "@typings"
import { ScrapReference } from "@lang/elements/values/reference.ts"
import { ScrapString } from "@lang/elements/values/textuals.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts"


export default class TypeGuards {
    public static isVariable(variable: Nameable & Exportable): variable is ScrapVariable {
        return variable instanceof ScrapVariable
    }

    public static isPrimitive(val: ScrapValue): val is ScrapPrimitive {
        return val instanceof ScrapPrimitive
    }

    public static isObject(obj: ScrapValue): obj is ScrapObject {
        return obj instanceof ScrapObject
    }

    public static isReference(ref: ScrapValue): ref is ScrapReference {
        return ref instanceof ScrapReference
    }

    public static isString(str: ScrapValue): str is ScrapString {
        return str instanceof ScrapString
    }

    public static isNumber(num: ScrapValue): num is ScrapInteger {
        return num instanceof ScrapInteger
    }

    public static isFunction(fn: ScrapValue): fn is ScrapFunction {
        return fn instanceof ScrapFunction
    }

    public static isNativeFn(fn: ScrapValue): fn is ScrapNativeFn {
        return fn instanceof ScrapFunction
    }

    public static isDefinedFn(fn: ScrapValue): fn is DefinedFunction {
        return fn instanceof ScrapFunction
    }
}