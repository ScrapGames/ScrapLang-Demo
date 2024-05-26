import { DeclarationAST, FunctionAST } from "../ast/Expressions.ts";

export interface ScrapParam {
    pName?: string,
    pType?: string
}

export interface ScrapFunction {
    name: string,
    params: ScrapParam,
    returnDataType: string
}

export type AccessorModifiers = "public" | "private" | "protected"

export interface ScrapClassEntity {
    accessor: AccessorModifiers,
    isStatic: boolean,
    canOverride: boolean,
    astNode: FunctionAST | DeclarationAST
}

export type ScrapClassProperty = ScrapClassEntity
export type ScrapClassMethod = ScrapFunction & ScrapClassEntity