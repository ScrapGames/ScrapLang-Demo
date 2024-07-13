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

export class IntegerExpression extends Expression {
    public constructor(val: number) {
        super(val)
    }
}

export class FloatExpression extends Expression {
    public constructor(val: number) {
        super(val)
    }
}

export class ReferenceExpression extends Expression {
    public constructor(referenceTo: string) {
        super(referenceTo)
    }
}

export class ArrayExpression extends Expression {
    public constructor(elements: Expression[]) {
        super(elements)
    }
}

export class StringLiteralExpression extends Expression {
    private readonly length: number
    private readonly size: number

    public constructor(literal: string) {
        super(literal)
        this.length = literal.length
        this.size = new Blob([literal]).size
    }
}

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

export class TruthyExpression extends Expression {
    public constructor() {
        super(true)
    }
}

export class FalsyExpression extends Expression {
    public constructor() {
        super(false)
    }
}

export class CharLiteralExpression extends Expression {
    private readonly length: number = 1
    private readonly size: number = 4

    public constructor(literal: string) {
        super(literal)
    }
}

export class AssignmentExpression extends Expression {
    public constructor(assignedValue: Expression) {
        super(assignedValue)
    }
}

export class CallExpression extends Expression {
    private name: string
    private args: Expression[]

    public constructor(name: string, args: Expression[]) {
        super(undefined)
        this.name = name
        this.args = args
    }

    public get getName() { return this.name }

    public get getArgs() { return this.args }
}

export class LiteralObjectExpression extends Expression {
    public constructor(keyValuePairs: [string, Expression][]) {
        super(keyValuePairs)
    }
}

export class ObjectExpression extends Expression {
    public constructor() {
        super(undefined)
    }

}

export class UndefinedExpression extends Expression {
    public constructor() {
        super(undefined)
    }
}

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

export class Module extends Entity {
    private scope: Scope

    public constructor(name: string, scope: Scope) {
        super(name)
        this.scope = scope
    }

    public insert(name: string, value: ValidEntities) {
        this.scope.addEntry(name, value)
    }

    public get getScope() { return this.scope }
}

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