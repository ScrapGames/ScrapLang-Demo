import { Scope } from "@lang/scope.ts"
import { Nameable, Primitive, ScrapParam, AllowedBlockEntities, Nullable } from "@typings"

export const BINARY_OPERATORS_PRECEDENCE = {
    '*': 4,
    '/': 4,
    '%': 4,

    '+': 3,
    '-': 3,


    '<': 2,
    '>': 2,
    "<=": 2,
    ">=": 2,
    "instanceof": 2,
    "in": 2
}

export class ScrapValue {
    protected value: unknown

    public constructor(value: unknown) {
        this.value = value
    }

    public get getValue() { return this.value }
    public toString() { this.value + "" }
}

export class ScrapPrimitive extends ScrapValue {    
    public constructor(value: Primitive) {
        super(value)
    }

    public get getValue() { return this.value as Primitive }
}

/**
 * Represent a literal object expression. Which is a way to write objects in a literal way assigning value to keys
 * 
 * @example
 * const myObject = {
 *  a: 10,
 *  b: 20,
 *  c: "Hello, World!"
 * }
 */
export class ScrapObject extends ScrapValue {

    prototype: Nullable<ScrapObject>

    public constructor(prototype: Nullable<ScrapObject>, keyValuePairs?: Map<string, ScrapValue>) {
        super(keyValuePairs)
        this.prototype = prototype
    }

    public get getValue() { return this.value as Map<string, ScrapValue> }
}

/**
 * Represents a code entity that can handle / contain blocks of code, it can be:
 *  - Class
 *  - Module
 *  - Variable (or constant) declaration
 */
export class ScrapEntity implements Nameable {
    name: string

    public constructor(name: string) {
        this.name = name
    }
}

/**
 * Represent a function value or declaration.
 * 
 * A function can be used as a value. This means that can be assigned to a variable.
 * In this way is easier to declare lambda expressions and pass functions as parameters
 * 
 * @example
 * fn myFunction() {}
 * 
 * const myFunctionInVariable = myFunction
 */
export class ScrapFunction extends ScrapObject implements Nameable {
    name: string

// TODO: gives the constructor a better initial value
    public constructor(name: string) {
        super(null)
        this.name = name
    }
}

export class DefinedFunction extends ScrapFunction {
    private params: ScrapParam[]
    private scope: Scope
    private returnExpression: ScrapValue

    body: AllowedBlockEntities[]

    public constructor(
        name: string, params: ScrapParam[], body: AllowedBlockEntities[],
        scope: Scope, returnExpression: ScrapValue
    ) {
        super(name)
        this.params = params
        this.scope = scope
        this.body = body
        this.returnExpression = returnExpression
    }


    public get getParams() { return this.params }
    public get getScope() { return this.scope }
    public get getReturnType() { return this.returnExpression }

    public set setReturnType(returnValue: ScrapValue) { this.returnExpression = returnValue }
    public toString() { return this.name }
}

/**
 * Represents a predefined functions. Which is a function that has been embbeded using TypeScript directly into the language engine
 */
export class ScrapNative extends ScrapFunction {
    private action: (...args: ScrapValue[]) => ScrapValue
    private argsCount: number | true

    public constructor(
        name: string, argsCount: number | true,
        action: (...args: ScrapValue[]) => ScrapValue
    ) {
        super(name)
        this.argsCount = argsCount
        this.action = action
    }

    public get getArgsCount() { return this.argsCount }
    public get getAction() { return this.action }
}