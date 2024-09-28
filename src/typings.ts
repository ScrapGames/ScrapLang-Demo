import { ASTControlNode } from "@ast/ast.ts"
import { CallNode, FunctionNode, IdentifierNode, ModuleAccessNode, ObjectAccessNode, ReassignmentNode, VariableNode } from "@ast/nodes.ts"

import { ScrapValue } from "@lang/elements/commons.ts"

/**
 * Converts the type parameter to a possible null value
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
export interface Nameable {
    name: string
}

/**
 * Makes the class who implements to define a method which
 * 
 */
export interface Exportable {
    isExported: boolean
}

/**
 * Makes the class who implements to define a method which
 * represents the info about the value
 */
export interface Formattable {
    format(): string
}

export type AccessOperators = "[]" | "::" | "."

/**
 * Defines 
 */
export interface Accessible<T> {
    //accessOperators: Record<AccessOperators, () => ScrapValue>
    get(from: T): ScrapValue
}

export interface Operable {
    operator(operator: string): ScrapValue
}

export interface Ajustable {
    increment(): ScrapValue
    decrement(): ScrapValue
}

export type Primitive = number | string | boolean | null | undefined

/**
 * Represents allowable nodes to appear inside a function body
 */
export type Instruction = FunctionNode | CallNode | ReassignmentNode | VariableNode | ASTControlNode

export type AccesibleTarget<T extends ModuleAccessNode | ObjectAccessNode> = CallNode | IdentifierNode | T

/**
 * Represents a function parameter
 * 
 * A function parameter is util to pass values to a function, allowing a function returns a variable value
 */
export interface ScrapParam {
    pName: string,
    pType: string
}

/**
 * Represents possible values for accessor modifiers of a class entity
 */
export type ClassAccessorModifier = "public" | "private" | "protected"

/**
 * Represents flags for a class implementation of from where 
 */
export interface ClassMetadata {
    inherits?: string,
    implements?: string
}

/**
 * Flags which indicate if a class entity is static or overrides another entity
 */
export interface ClassEntityMetadata {
    isStatic: boolean,
    canOverride: boolean
}

/**
 * Represents metadata for a class entity
 */
export interface ClassEntity {
    accessor: ClassAccessorModifier,
    entityFlags: ClassEntityMetadata,
    entity: FunctionNode | VariableNode
}

interface ExecutionContext {
    callee: string,
    instructions: Instruction[]
}
