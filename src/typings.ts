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

export type EmptyObject = Record<string | number | symbol, never>

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