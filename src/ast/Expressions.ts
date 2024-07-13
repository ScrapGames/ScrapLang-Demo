import { Scope, type ValidEntities } from "../lang/scope.ts"
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

export class Expression {
    private value: unknown

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

export class TernaryExpression extends Expression {}

/**
 * Represent an integer value
 * 
 * @example
 * 1000, 0o777112
 */
export class IntegerExpression extends Expression {
    public constructor(val: number) {
        super(val)
    }
}

/**
 * Represent an float value
 * 
 * @example
 * 1.1, 2.20, 0xb000.f
 */
export class FloatExpression extends Expression {
    public constructor(val: number) {
        super(val)
    }
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
export class ReferenceExpression extends Expression {
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
export class ArrayExpression extends Expression {
    public constructor(elements: Expression[]) {
        super(elements)
    }
}

/**
 * Represents a String. Which is an array of characters
 * 
 * @example
 * const myString = "Hello, World!"
 */
export class StringLiteralExpression extends Expression {
    private readonly length: number
    private readonly size: number

    public constructor(literal: string) {
        super(literal)
        this.length = literal.length
        this.size = new Blob([literal]).size
    }
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
export class BinaryExpression extends Expression {
    private lhs: Expression
    private rhs: Expression
    private operator: string

    public constructor(lhs: Expression, rhs: Expression, operator: string) {
        super(undefined)
        this.lhs = lhs
        this.rhs = rhs
        this.operator = operator
    }
}

/**
 * Represent a true value
 */
export class TruthyExpression extends Expression {
    public constructor() {
        super(true)
    }
}

/**
 * Reprents a false value
 */
export class FalsyExpression extends Expression {
    public constructor() {
        super(false)
    }
}

/**
 * Represents an `undefined` value
 */
export class UndefinedExpression extends Expression {
    public constructor() {
        super(undefined)
    }
}

/**
 * Represent a char value. Which is a value that stores a single character and require 1 byte
 */
export class CharLiteralExpression extends Expression {
    private readonly length: number = 1
    private readonly size: number = 4

    public constructor(literal: string) {
        super(literal)
    }
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
export class AssignmentExpression extends Expression {
    public constructor(assignedValue: Expression) {
        super(assignedValue)
    }
}

/**
 * Represents the call to a function
 */
export class CallExpression extends Expression {
    private caller: string
    private args: Expression[]

    public constructor(caller: string, args: Expression[]) {
        super(undefined)
        this.caller = caller
        this.args = args
    }

    public get getCaller() { return this.caller }
    public get getArgs() { return this.args }
}

/**
 * Represents a predefined functions. Which is a function that has been embbeded using TypeScript directly into the language engine
 */
export class PredefinedFunction extends Expression {
    private caller: string
    private paramsLength: number
    private action: (args: Expression[]) => Expression

    public constructor(caller: string, paramsLength: number, action: (args: Expression[]) => Expression) {
        super(undefined)
        this.caller = caller
        this.paramsLength = paramsLength
        this.action = action
    }

    public get getCaller() { return this.caller }
    public get getArgsLength() { return this.paramsLength }
    public get getAction() { return this.action }
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
export class LiteralObjectExpression extends Expression {
    public constructor(keyValuePairs: [string, Expression][]) {
        // TODO: the value assigned to the super constructor (Expression constructor) should be an instance of `SObject`
        super(keyValuePairs)
    }
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
export class DeclarationAST extends Entity {
    private declarationType: "variable" | "constant"
    private assignedValue: Expression

    public constructor(declarationType: "variable" | "constant", name: string, assignedValue: Expression) {
        super(name)
        this.declarationType = declarationType
        this.assignedValue = assignedValue
    }

    public get getAssignedValue() { return this.assignedValue }
    public set setAssignedValue(newValue: Expression) { this.assignedValue = newValue }
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
export class Module extends Entity {
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

    public get getScope() { return this.scope }
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
export class Function extends Expression {
    private name: string
    private params: ScrapParam[]
    private scope: Scope
    private returnExpression: Expression

    public constructor(name: string, params: ScrapParam[], scope: Scope, returnExpression: Expression) {
        super(undefined)
        this.name = name
        this.params = params
        this.scope = scope
        this.returnExpression = returnExpression
    }

    public get getName() { return this.name }
    public get getParams() { return this.params }
    public get getScope() { return this.scope }
    public get getReturnType() { return this.returnExpression }

    public set setReturnType(returnValue: Expression) { this.returnExpression = returnValue }
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
export class Class extends Entity {
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