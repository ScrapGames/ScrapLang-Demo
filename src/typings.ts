import { ScrapCall } from "@lang/elements/values/call.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"
import { DefinedFunction, ScrapEntity } from "@lang/elements/commons.ts"
import { ReassignmentExpression } from "@lang/elements/values/reassignment.ts"

/**
 * Converts the type parameter to a possible null type
 * 
 * The next example shows how it works with the number type
 * @example
 * function showNumberString(num: Nullable<number>) {
 *   if (num)
 *     console.log(num.toString())
 * }
 */
export type Nullable<T> = T | null

/**
 * Represents values which has `name` as a common property
 * 
 * The `name` property is util and fundamental to search and save items in scopes or other data structured
 * 
 * These values can include:
 *  * Any type that extends from `ScrapEntity`, like: variables, classes, modules, etc
 *  * Any type that extends from `ScrapFunction`
 */
export interface Nameable extends ScrapEntity {
    name: string
}

export type Primitive = number | string | boolean | null | undefined

export type AllowedBlockEntities = DefinedFunction | ScrapVariable | ScrapCall | ReassignmentExpression

/**
 * Represents a function parameter
 * 
 * A function parameter is util to pass values to a function, allowing a function returns a variable value
 */
export interface ScrapParam {
    pName: string,
    pType: string
}

export type AccessorModifiers = "public" | "private" | "protected"

export interface ScrapClassEntityProps {
    accessor: AccessorModifiers,
    isStatic: boolean,
    canOverride: boolean,
    entitiyType: ScrapVariable | DefinedFunction
}