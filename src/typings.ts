import { DeclarationAST, FunctionAST } from "./ast/Expressions.ts"

export type Nullable<T> = T | null

export type EmptyObject = Record<string | number | symbol, never>

export interface ScrapParam {
    pName: string,
    pType: string
}

export type AccessorModifiers = "public" | "private" | "protected"

export interface ScrapClassEntity {
    accessor: AccessorModifiers,
    isStatic: boolean,
    canOverride: boolean,
    nodeType: FunctionAST | DeclarationAST
}

export type ScrapClassProperty = ScrapClassEntity
export type ScrapClassMethod = ScrapClassEntity & FunctionAST