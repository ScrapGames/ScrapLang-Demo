import { ScrapVariable, DefinedFunction, ScrapEntity, ScrapFunction } from "./lang/expressions.ts"

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
 * Represents a function parameter
 * 
 * A function parameter is util to pass values to a function, allowing a function returns a variable value
 */
export interface ScrapParam {
    pName: string,
    pType: string
}

export type AccessorModifiers = "public" | "private" | "protected"

export interface ScrapModuleEntity {
    entityType: ScrapFunction | ScrapEntity
    exports: boolean
}

export interface ScrapClassEntityProps {
    accessor: AccessorModifiers,
    isStatic: boolean,
    canOverride: boolean,
    entitiyType: ScrapVariable | DefinedFunction
}