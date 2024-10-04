import { Scope } from "@lang/scope.ts"
import { ValueNode } from "@ast/ast.ts"

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

export class ScrapValue implements Formattable {
    protected value: unknown

    public constructor(value: unknown) {
        this.value = value
    }

    public get getValue() { return this.value }
    public format() { return String(this.value) }
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

    public constructor(prototype: Nullable<ScrapObject>, properties: Map<string, ScrapValue>) {
        super(properties)
        this.prototype = prototype
    }

    public has(name: string): boolean {
        return (this.value as Map<string, ScrapValue>).has(name)
    }

    public get(name: string): ScrapValue | undefined {
        return (this.value as Map<string, ScrapValue>).get(name)
    }

    /**
     * TODO: complete the method, which will be called when 'instanceof' keyword is found
     * @param obj An instance of an Object
     */
    /* public instanceOf(obj: ScrapObject): boolean {
        if (obj.instanceOf()) {}

        return false
    } */

    public get getValue() { return this.value as Map<string, ScrapValue> }

    private formatObject(deep: number = 0) {
        let str = "{\n"
        const vectoredProps = Array.from(this.value as Map<string, ScrapValue>)

        for (let i = 0; i < vectoredProps.length; i++) {
            const [k, v] = vectoredProps[i]
            const stringWithDeep = v instanceof ScrapObject ? v instanceof ScrapFunction ? v.format() : v.formatObject(deep + 1) : v.format()
            const formatedString = `${" ".repeat(deep)} ${k}: ${stringWithDeep}`

            // if is the last key-value pair iterated
            if ((i + 1) === vectoredProps.length)
                str += formatedString
            else {
                // if the object can be printed in one line
                if (vectoredProps.length < 2)
                    str += `${formatedString},`
                else
                    str += `${formatedString},\n`
            }
        }

        str += `\n${" ".repeat(deep)}}`
        return str
    }

    public format() { return this.formatObject() }
}

/**
 * Represents a code entity that can handle / contain blocks of code, it can be:
 *  - Class
 *  - Module
 *  - Variable (or constant) declaration
 */
export class ScrapEntity implements Nameable, Exportable {
    name: string
    isExported: boolean

    public constructor(name: string, isExported: boolean) {
        this.name = name
        this.isExported = isExported
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
export class ScrapFunction extends ScrapObject implements Nameable, Exportable {
    name: string
    isExported: boolean

    // TODO: gives the constructor a suitable initial value
    public constructor(name: string, isExported: boolean) {
        super(null)
        this.name = name
        this.isExported = isExported
    }
}

export class DefinedFunction extends ScrapFunction {
    private scope: Scope
    private params: ScrapParam[]
    private returnValue: ValueNode
    private body: Instructions[]

    public constructor(
        name: string, isExported: boolean, scope: Scope, params: ScrapParam[],
        body: Instruction[], returnValue: ValueNode
    ) {
        super(name, isExported)
        this.scope = scope
        this.params = params
        this.body = body
        this.returnValue = returnValue
    }

    public get getScope()  { return this.scope }
    public get getParams() { return this.params }
    public get getReturnValue() { return this.returnValue }
    public get getBody() { return this.body }

    public format() { return `fn ${this.name}(${this.params.length} params) []` }
}

/**
 * Represents a predefined functions. Which is a function that has been embbeded using TypeScript directly into the language engine
 */
export class ScrapNative extends ScrapFunction {
    private action: (...args: ScrapValue[]) => ScrapValue
    private argsCount: number | true

    public constructor(
        name: string, isExported: boolean,
        action: (...args: ScrapValue[]) => ScrapValue
    ) {
        super(name, isExported)
        this.argsCount = argsCount
        this.action = action
    }

    public get getArgsCount() { return this.argsCount }
    public get getAction() { return this.action }
    public format() { return `fn ${this.name}(${this.argsCount ? this.argsCount : "..."}) [ native code ]` }
}