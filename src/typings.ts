import { ScrapVariable, DefinedFunction, ScrapEntity, ScrapFunction } from "./lang/expressions.ts"

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