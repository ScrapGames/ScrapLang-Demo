import { ScrapVariable, DefinedFunction } from "./lang/expressions.ts"

export type Nullable<T> = T | null

export type EmptyObject = Record<string | number | symbol, never>

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