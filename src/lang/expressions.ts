import { Scope, type ValidEntities } from "./scope.ts"
import { ScrapClassMethod, ScrapClassProperty, ScrapParam } from "../typings.ts"

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
export class Entity {
    protected name: string

    public constructor(name: string) {
        this.name = name
    }

    public get getName() { return this.name }
}

export class TernaryExpression extends ScrapValue {}

/**
 * Represent an integer value
 * 
 * @example
 * 1000, 0o777112
 */
export class ScrapInteger extends ScrapValue {
    public constructor(val: number) {
        super(val)
    }

    public get getValue() { return this.value as number }
}

/**
 * Represent an float value
 * 
 * @example
 * 1.1, 2.20, 0xb000.f
 */
export class ScrapFloat extends ScrapValue {
    public constructor(val: number) {
        super(val)
    }

    public get getValue() { return this.value as number }
}

/**
 * Represent a reference to a variable
 * 
 * @example
 * var myNumber = 10
 * 
 * var myReference = &myNumber
 * 
 * myReference = 50
 * 
 * // now `myNumber` value is 50
 */
export class ScrapReference extends ScrapValue {
    public constructor(referenceTo: string) {
        super(referenceTo)
    }
}

/**
 * Represent an array. Which is an allocated space where can store values
 * 
 * @example
 * const myArray = [1, 2, 3, 4, 5]
 */
export class ScrapArray<T> extends ScrapValue {
    public constructor(elements: T[]) {
        super(elements)
    }

    public get getValue() { return this.value as T[] }
}

/**
 * Represents a String. Which is an array of characters
 * 
 * @example
 * const myString = "Hello, World!"
 */
export class ScrapString extends ScrapValue {
    private readonly length: number
    private readonly size: number

    public constructor(literal: string) {
        super(literal)
        this.length = literal.length
        this.size = new Blob([literal]).size
    }

    public get getValue() { return this.value as string }
}

/**
 * Represent a binary expressions.
 * Is the combination of three elements: two Expressions and a operator which defined the operation between these two operands
 * 
 * @example
 * const mySum = 10 + 20
 * 
 * const myStringConcatenation = "Hello, " + "World!"
 */
export class BinaryExpression extends ScrapValue {
    private lhs: ScrapValue
    private rhs: ScrapValue
    private operator: string

    public constructor(lhs: ScrapValue, rhs: ScrapValue, operator: string) {
        super(undefined)
        this.lhs = lhs
        this.rhs = rhs
        this.operator = operator
    }
}

/**
 * Represent a true value
 */
export class ScrapTrue extends ScrapValue {
    public constructor() {
        super(true)
    }

    public get getValue() { return this.value as true }
}

/**
 * Reprents a false value
 */
export class ScrapFalse extends ScrapValue {
    public constructor() {
        super(false)
    }

    public get getValue() { return this.value as false }
}

/**
 * Represents an `undefined` value
 */
export class ScrapUndefined extends ScrapValue {
    public constructor() {
        super(undefined)
    }

    public get getValue() { return this.value as undefined }
}

/**
 * Represent a char value. Which is a value that stores a single character and require 1 byte
 */
export class ScrapChar extends ScrapValue {
    private readonly length: number = 1
    private readonly size: number = 4

    public constructor(literal: string) {
        super(literal)
    }

    public get getValue() { return this.value as string }
}

/**
 * Represents the assignment of a value to a variable. This assignment returns a value
 * 
 * @example
 * var myNumber = 10
 * 
 * myNumber = 20
 * 
 * // The assignment returns the value that has been assigned. In this last case 20.
 */
export class AssignmentExpression extends ScrapValue {

    private varCandidate: ScrapVariable

    public constructor(varCandidate: ScrapVariable, assignedValue: ScrapValue) {
        super(assignedValue)
        this.varCandidate = varCandidate
    }

    public get getVarCandidate() { return this.varCandidate }
}

/**
 * Represents the call to a function
 */
export class ScrapCall extends ScrapValue {
    private caller: string
    private called: ScrapFunction
    private args: ScrapValue[]

    public constructor(caller: string, called: ScrapFunction, args: ScrapValue[]) {
        super(undefined)
        this.caller = caller
        this.called = called
        this.args = args
    }

    public get getCaller() { return this.caller }
    public get getCalled() { return this.called }
    public get getArgs() { return this.args }
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
export class ScrapLitObject extends ScrapValue {
    public constructor(keyValuePairs: [string, ScrapValue][]) {
        // TODO: the value assigned to the super constructor (Expression constructor) should be an instance of `SObject`
        super(keyValuePairs)
    }

    public get getValue() { return this.value as [string, ScrapValue][] }
}

/**
 * Represents a declaration. Either a constant or a variable
 * 
 * We calls variable to a value stored in memory. But this name is also received by a value that can change his value
 * 
 * In this case, we'll refer to variable as a value stored in memory and variable value to a value that can change his value
 * 
 * @example
 * const myConstant = 20
 * 
 * myConstant = 10 //! error, cant change the value of a constant variable
 * 
 * var myVariable = 20
 * 
 * myVariable = 10 // this will not cause an error because is a variable value
 */
export class ScrapVariable extends Entity {
    private declarationType: "variable" | "constant"
    private assignedValue: ScrapValue

    public constructor(declarationType: "variable" | "constant", name: string, assignedValue: ScrapValue) {
        super(name)
        this.declarationType = declarationType
        this.assignedValue = assignedValue
    }

    public get getVariableType() { return this.declarationType }

    public get getAssignedValue() { return this.assignedValue }

    public set setAssignedValue(newValue: ScrapValue) { this.assignedValue = newValue }
}

/**
 * Represents a Module. Which is a accessible block of code that can be accessed via his accessor token. `::` in this case.
 * 
 * Not all the Module members are accessible. Only the members that was declared with `export` keywords.
 * 
 * @example
 * 
 * module MyModule {
 *  export const PI = 3.14
 * 
 *  const privateConstant = PI * 20
 * }
 * 
 * MyModule::PI // correct syntax, PI constant has been exported
 * 
 * MyModule::privateConstant // error: privateConstant was not exported from his module. Is only accessible inside the module it has been declared
 */
export class ScrapModule extends Entity {
    private scope: Scope

    public constructor(name: string, scope: Scope) {
        super(name)
        this.scope = scope
    }

    public insert(name: string, value: ValidEntities) {
        this.scope.addEntry(name, value)
    }

    public bulkInsert(...vals: { name: string, value: ValidEntities }[]) {
        vals.forEach(val => this.scope.addEntry(val.name, val.value))
    }

    public get getName() { return this.name }

    public set setScope(newScope: Scope) { this.scope = newScope }

    public get getScope() { return this.scope }
}

export class DefinedModule extends ScrapModule {
    private body: (Entity | ScrapFunction)[]

    public constructor(name: string, body: (Entity | ScrapFunction)[], scope: Scope) {
        super(name, scope)
        this.body = body
    }

    public get getBody() { return this.body }
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
export class ScrapFunction extends ScrapValue {
    private name: string
    private params: ScrapParam[]
    private body: (ScrapValue | Entity)[]
    private scope: Scope
    private returnExpression: ScrapValue

    public constructor(name: string, params: ScrapParam[], body: (ScrapValue | Entity)[], scope: Scope, returnExpression: ScrapValue) {
        super(undefined)
        this.name = name
        this.params = params
        this.scope = scope
        this.body = body
        this.returnExpression = returnExpression
    }

    public get getName() { return this.name }
    public get getParams() { return this.params }
    public get getBody() { return this.body }
    public get getScope() { return this.scope }
    public get getReturnType() { return this.returnExpression }

    public set setReturnType(returnValue: ScrapValue) { this.returnExpression = returnValue }
}

/**
 * Represents a predefined functions. Which is a function that has been embbeded using TypeScript directly into the language engine
 */
export class ScrapNative extends ScrapFunction {
    private action: (...args: ScrapValue[]) => ScrapValue

    public constructor(name: string, params: ScrapParam[], scope: Scope, action: (...args: ScrapValue[]) => ScrapValue) {
        super(name, params, [], scope, new ScrapUndefined())
        this.action = action
    }

    public get getAction() { return this.action }
}

export class ScrapArrayAccess extends ScrapValue {

    private accessedPosition: ScrapInteger
    private accessedArray: ScrapArray<ScrapValue>


    public constructor(accessedArray: ScrapArray<ScrapValue>, accessedPosition: ScrapInteger) {
        super(undefined)
        this.accessedArray = accessedArray
        this.accessedPosition = accessedPosition
    }

    public get getAccessedPosition() { return this.accessedPosition }

    public get getAccessedArray() { return this.accessedArray }
}

export class ScrapControlBlock {
    private expression: ScrapTrue
    private body: (ScrapValue | Entity)[]

    public constructor(expression: ScrapTrue, body: (ScrapValue | Entity)[]) {
        this.expression = expression
        this.body = body
    }

    public get getExpression() { return this.expression }
    public get getBody() { return this.body }
}

export class ScrapIf extends ScrapControlBlock {}

export class ScrapWhile extends ScrapControlBlock {}

export class ScrapFor extends ScrapControlBlock {
    private varDeclaration: ScrapVariable
    private valueModifier: ScrapValue

    public constructor(varDeclaration: ScrapVariable, expression: ScrapTrue, valueModifier: ScrapValue, body: (ScrapValue | Entity)[]) {
        super(expression, body)
        this.varDeclaration = varDeclaration
        this.valueModifier = valueModifier
    }

    public get getVarDeclaration() { return this.varDeclaration }
    public get getValueModifier() { return this.valueModifier }
}

/**
 * Represent a class
 * 
 * A class is the another way to create objects using a pattern to create objects with the same methods and properties, but with different values.
 * 
 * * A variable inside a class is called _property_ or _instance variable_
 * * A function inside a class is called _method_
 * 
 * Properties and methods can be declared to be used once the object has been instanced preceding the declaration of them with `public`.
 * If their declarations are not preceeded using `public`, then the property or method will only accessible inside the class meaning that is `private`.
 * 
 * A class also can inherit from other, meaning that the class that inherit from other can access to their properties or methods that are not `private`
 * 
 * @example
 * class MyClass {
 *  id: String
 *  public name: String
 *  public age: u8
 * 
 *  public constructor(id: String, name: String, age: u8) {
 *      this.id = id
 *      this.name = name
 *      this.age = age
 *  }
 * }
 * 
 * const juan = new MyClass(33344111L, "Juan", 20) // creating a object using `MyClass` as pattern
 * 
 * juan.name // correct, `name` has been declared using `public`
 * juan.id // error, `id` does not have a accessor modifier, this means is `private` and can only be accessible inside the class
 */
export class ScrapClass extends Entity {
    private entities: (ScrapClassProperty | ScrapClassMethod)[]
    private scope: Scope
    private hasConstructor: boolean

    public constructor(className: string, entities: (ScrapClassProperty | ScrapClassMethod)[], scope: Scope, hasConstructor: boolean) {
        super(className)
        this.entities = entities
        this.scope = scope
        this.hasConstructor = hasConstructor
    }
}