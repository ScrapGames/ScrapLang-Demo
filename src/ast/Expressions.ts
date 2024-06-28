import { Scope, type ValidEntities } from "../lang/scope.ts"
import { ScrapClassMethod, ScrapClassProperty, ScrapParam } from "../typings.ts"

export class ExpressionAST {}

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

export class TernaryExpression extends ExpressionAST {}

export class IntegerExpression extends ExpressionAST {
    private val: number

    public constructor(val: number) {
        super()
        this.val = val
    }
}

export class FloatExpression extends ExpressionAST {
    private val: number
    
    public constructor(val: number) {
        super()
        this.val = val
    }
}

export class ReferenceExpression extends ExpressionAST {
    private referenceTo: string

    public constructor(referenceTo: string) {
        super()
        this.referenceTo = referenceTo
    }
}

export class ArrayExpression extends ExpressionAST {
    private elements: ExpressionAST[]

    public constructor(elements: ExpressionAST[]) {
        super()
        this.elements = elements
    }
}

export class StringLiteralExpression extends ExpressionAST {
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

export class BinaryExpression extends ExpressionAST {
    private lhs: ExpressionAST
    private rhs: ExpressionAST
    private operator: string

    public constructor(lhs: ExpressionAST, rhs: ExpressionAST, operator: string) {
        super()
        this.lhs = lhs
        this.rhs = rhs
        this.operator = operator
    }
}

export class CharLiteralExpression extends ExpressionAST {
    private readonly length: number = 1
    private readonly size: number = 4
    private data: string 

    public constructor(literal: string) {
        super()
        this.data = literal
    }
}

export class AssignmentExpression extends ExpressionAST {
    private assignedValue: ExpressionAST

    public constructor(assignedValue: ExpressionAST) {
        super()
        this.assignedValue = assignedValue
    }
}

export class CallExpression extends ExpressionAST {
    private name: string
    private args: ExpressionAST[]

    public constructor(name: string, args: ExpressionAST[]) {
        super()
        this.name = name
        this.args = args
    }
}

export class LiteralObjectExpression extends ExpressionAST {
    private keyValuePairs: [string, ExpressionAST ][]

    public constructor(keyValuePairs: [string, ExpressionAST][]) {
        super()
        this.keyValuePairs = keyValuePairs
    }

    public get getKeyValuePairs() { return this.keyValuePairs }
}

export class ObjectExpression extends ExpressionAST {

    public constructor() {
        super()
    }

}

export class UndefinedExpression extends ExpressionAST {}

export class DeclarationAST extends EntityAST {
    private declarationType: "variable" | "constant"
    private assignedValue: ExpressionAST

    public constructor(declarationType: "variable" | "constant", name: string, assignedValue: ExpressionAST) {
        super(name)
        this.declarationType = declarationType
        this.assignedValue = assignedValue
    }

    public get getAssignedValue() { return this.assignedValue }
}

export class ModuleAST extends EntityAST {
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

export class FunctionAST extends ExpressionAST {
    private name: string
    private params: ScrapParam[]
    private scope: Scope
    private returnExpression: ExpressionAST

    public constructor(name: string, params: ScrapParam[], scope: Scope, returnExpression: ExpressionAST) {
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

    public set setReturnType(returnValue: ExpressionAST) { this.returnExpression = returnValue }
}

export class ClassAST extends EntityAST {
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