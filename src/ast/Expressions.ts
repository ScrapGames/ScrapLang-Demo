import { ScrapClassMethod, ScrapClassProperty } from "../typings/Entities.ts"

export class Expression {}

export class IntegerExpression extends Expression {
    private val: number

    public constructor(val: number) {
        super()
        this.val = val
    }
}

export class TernaryExpression extends Expression {
    private trulyExpression: Expression
    private falsyExpression: Expression

    public constructor(trulyExpression: Expression, falsyExpression: Expression) {
        super()
        this.trulyExpression = trulyExpression;
        this.falsyExpression = falsyExpression;
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
    private args: Expression[]

    public constructor(args: Expression[]) {
        super()
        this.args = args
    }
}

export class LiteralObjectExpression extends Expression {
    private keyValuePairs: [string, Expression][]

    public constructor(keyValuePairs: [string, Expression][]) {
        super()
        this.keyValuePairs = keyValuePairs
    }
}

export class DeclarationAST {
    private declarationType: "variable" | "constant"
    private name: string
    private assignedValue: Expression

    public constructor(declarationType: "variable" | "constant", name: string, assignedValue: Expression) {
        this.declarationType = declarationType
        this.name = name
        this.assignedValue = assignedValue
    }
}

export class ModuleAST {
    private name: string

    public constructor(name: string) {
        this.name = name
    }

    public get getName() { return this.name }
}

export class FunctionAST {
    private name: string
    private params: Expression[]
    private returnValue: Expression

    public constructor(name: string, params: Expression[], returnValue: Expression) {
        this.name = name
        this.params = params
        this.returnValue = returnValue
    }

    public get getName() { return this.name }
    public get getParams() { return this.params }
}

export class ClassAST extends Expression {
    private className: string
    private entities: (ScrapClassProperty | ScrapClassMethod)[]
    private hasConstructor: boolean

    public constructor(className: string, entities: (ScrapClassProperty | ScrapClassMethod)[], hasConstructor: boolean) {
        super()
        this.className = className
        this.entities = entities
        this.hasConstructor = hasConstructor
    }
}