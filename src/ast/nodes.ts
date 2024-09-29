import {
    NodeEntityType, NodeValueType,

    ASTEntityNode, ASTNode, ASTValueNode
} from "@ast/ast.ts"

import type { ScrapParam, ScrapClassEntityProps, Instructions } from "@typings"

export class NumericNode extends ASTValueNode {
    private value: number

    public constructor(value: number) {
        super(NodeValueType.Numeric)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class FloatNode extends ASTValueNode {
    private value: number

    public constructor(value: number) {
        super(NodeValueType.Float)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class StringNode extends ASTValueNode {
    private value: string

    public constructor(value: string) {
        super(NodeValueType.String)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class CharNode extends ASTValueNode  {
    private value: string

    public constructor(value: string) {
        super(NodeValueType.Char)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class LiteralObjectNode extends ASTValueNode {
    private entries: Map<string, ASTValueNode>

    public constructor(entries: Map<string, ASTValueNode>) {
        super(NodeValueType.LiteralObj)
        this.entries = entries
    }

    public get getEntries() { return this.entries }
}
    }

    public get getPairs() { return this.keyValuePairs }
}

export class ModuleAccessNode extends ASTValueNode {
    private accessedMod: string
    private accessType: CallNode | IdentifierNode

    public constructor(accessedMod: string, access: CallNode | IdentifierNode) {
        super(NodeValueType.ModAccess)
        this.accessedMod = accessedMod
        this.accessType = access
    }

    public get getAccessedMod()    { return this.accessedMod }
    public get getAccessedEntity() { return this.accessType }
}

export class ObjectAccessNode extends ASTValueNode {
    private accessedObj: string
    private access: ASTValueNode

    public constructor(accessedObj: string, access: ASTValueNode) {
        super(NodeValueType.ObjAccess)
        this.accessedObj = accessedObj
        this.access = access
    }

    public get getAccessedObj()    { return this.accessedObj }
    public get getAccessedEntity() { return this.access }
}

export class IdentifierNode extends ASTValueNode {
    private symbol: string

    public constructor(symbol: string) {
        super(NodeValueType.Identifier)
        this.symbol = symbol
    }

    public get getSymbol() { return this.symbol }
}

export class LiteralArrayNode<T> extends ASTValueNode {
    private array: T[]

    public constructor(array: T[]) {
        super(NodeValueType.LiteralArray)
        this.array = array
    }

    public get getArray() { return this.array }
}

export class ReferenceNode extends ASTValueNode {
    private target: string

    public constructor(target: string) {
        super(NodeValueType.Reference)
        this.target = target
    }

    public get getTarget() { return this.target }
}

export class CallNode extends ASTValueNode {
    private callee: string
    private args: ASTNode[]

    public constructor(callee: string, args: ASTNode[]) {
        super(NodeValueType.Call)
        this.callee = callee
        this.args = args
    }

    public get getCallee() { return this.callee }
    public get getArgs()   { return this.args }
}

export class ReassignmentNode extends ASTValueNode {
    private lhs: string
    private rhs: ASTNode

    public constructor(lhs: string, rhs: ASTNode) {
        super(NodeValueType.Reassignment)
        this.lhs = lhs
        this.rhs = rhs
    }

    public get getLHS() { return this.lhs }
    public get getRHS() { return this.rhs }
}

/**
 * Reprensets a 
 */
export class UndefinedNode extends ASTValueNode {
    public constructor() {
        super(NodeValueType.Undefined)
    }
}

/**
 * FuncitonNode can be returned when parsing a function as an entity or as a value.
 * 
 * This is why, unlike other entities, which extends from `ASTEntityNode` or
 * values from `ASTValueNode`, `FunctionNode` extends from `ASTNode` directly
 */
export class FunctionNode extends ASTNode implements Nameable, Exportable {
    public name: string
    public isExported: boolean = false
    public kind: NodeValueType | NodeEntityType
    public name: string
    private params: ScrapParam[]
    private body: Instructions[]
    private returnValue: ASTValueNode
    private async: boolean

    public constructor(
        name: string, kind: NodeValueType | NodeEntityType,
        params: ScrapParam[], body: Instruction[],
        returnValue: ASTValueNode, async: boolean
    ) {
        super()
        this.name = name
        this.kind = kind
        this.params = params
        this.body = body
        this.returnValue = returnValue
        this.async = async
    }

    public get getParams()      { return this.params }
    public get getBody()        { return this.body }
    public get getReturnValue() { return this.returnValue }
    public get isAsync()        { return this.async }
}

/**
 * Reprensets a variable declaration in the prgram
 */
export class VariableNode extends ASTEntityNode {
    private const: boolean
    private assignedValue: ASTNode

    public constructor(name: string, constant: boolean, assignedValue: ASTNode) {
        super(name, NodeEntityType.Variable)
        this.const = constant
        this.assignedValue = assignedValue
    }

    public get isConst()          { return this.const }
    public get getAssginedValue() { return this.assignedValue }
}

export class ModuleNode extends ASTEntityNode {
    private body: ASTEntityNode[]
    private defaultExport?: ASTEntityNode

    public constructor(name: string, body: ASTEntityNode[], defaultExport?: ASTEntityNode) {
        super(name, NodeEntityType.Module)
        this.body = body
        this.defaultExport = defaultExport
    }

    public get getBody()          { return this.body }
    public get getDefaultExport() { return this.defaultExport }
}

export class ClassNode extends ASTEntityNode {
    private options: { inherits?: string, implements?: string }
    private body: ScrapClassEntityProps[]

    public constructor(name: string, options: { inherits?: string, implements?: string }, body: ScrapClassEntityProps[]) {
        super(name, NodeEntityType.Class)
        this.options = options
        this.body = body
    }

    public get getOptions() { return this.options }
    public get getBody()    { return this.body }
}