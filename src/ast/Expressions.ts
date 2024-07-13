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

export class Expression {}

/**
 * Represents a code entity that can handle / contain blocks of code, it can be:
 *  - Class
 *  - Module
 *  - Variable (or constant) declaration
 */
export class EntityAST {
    protected name: string

    public constructor(name: string) {
        this.name = name
    }

    public get getName() { return this.name }
}

export class TernaryExpression extends Expression {}

export class IntegerExpression extends Expression {
    private val: number

    public constructor(val: number) {
        super()
        this.val = val
    }
}

export class FloatExpression extends Expression {
    private val: number
    
    public constructor(val: number) {
        super()
        this.val = val
    }
}

export class ReferenceExpression extends Expression {
    private referenceTo: string

    public constructor(referenceTo: string) {
        super()
        this.referenceTo = referenceTo
    }
}

export class ArrayExpression extends Expression {
    private elements: Expression[]

    public constructor(elements: Expression[]) {
        super()
        this.elements = elements
    }
}

export class StringLiteralExpression extends Expression {
    private readonly length: number
    private readonly size: number
    private data: string

    public constructor(literal: string) {
        super()
        this.length = literal.length
        this.size = new Blob([literal]).size
        this.data = literal
    }
}

export class BinaryExpression extends Expression {
    private lhs: Expression
    private rhs: Expression
    private operator: string

    public constructor(lhs: Expression, rhs: Expression, operator: string) {
        super()
        this.lhs = lhs
        this.rhs = rhs
        this.operator = operator
    }
}

export class CharLiteralExpression extends Expression {
    private readonly length: number = 1
    private readonly size: number = 4
    private data: string 

    public constructor(literal: string) {
        super()
        this.data = literal
    }
}

export class AssignmentExpression extends Expression {
    private assignedValue: Expression

    public constructor(assignedValue: Expression) {
        super()
        this.assignedValue = assignedValue
    }
}

export class CallExpression extends Expression {
    private name: string
    private args: Expression[]

    public constructor(name: string, args: Expression[]) {
        super()
        this.name = name
        this.args = args
    }
}

export class LiteralObjectExpression extends Expression {
    private keyValuePairs: [string, Expression ][]

    public constructor(keyValuePairs: [string, Expression][]) {
        super()
        this.keyValuePairs = keyValuePairs
    }

    public get getKeyValuePairs() { return this.keyValuePairs }
}

export class ObjectExpression extends Expression {

    public constructor() {
        super()
    }

}

export class UndefinedExpression extends Expression {}

export class DeclarationAST extends EntityAST {
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

export class Module extends EntityAST {
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
        super()
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

export class Class extends EntityAST {
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