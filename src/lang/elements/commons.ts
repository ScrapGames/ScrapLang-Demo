import { Scope } from "@lang/scope.ts"
import { Nameable, ScrapParam } from "@typings"

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
export class ScrapFunction extends ScrapValue implements Nameable {
    name: string

    public constructor(name: string) {
        super(undefined)
        this.name = name
    }
}

export class DefinedFunction extends ScrapFunction {
    private params: ScrapParam[]
    private scope: Scope
    private returnExpression: ScrapValue

    body: (ScrapValue | ScrapEntity)[]

    public constructor(
        name: string, params: ScrapParam[], body: (ScrapValue | ScrapEntity)[],
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