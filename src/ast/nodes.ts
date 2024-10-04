import {
    NodeEntityType, NodeValueType,

    ASTNode, EntityNode, ValueNode,
} from "@ast/ast.ts"

import type { ScrapParam, ScrapClassEntityProps, Instructions } from "@typings"

export class NumericNode extends ValueNode {
    private value: number

    public constructor(value: number) {
        super(NodeValueType.Numeric)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class FloatNode extends ValueNode {
    private value: number

    public constructor(value: number) {
        super(NodeValueType.Float)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class StringNode extends ValueNode {
    private value: string

    public constructor(value: string) {
        super(NodeValueType.String)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class CharNode extends ValueNode  {
    private value: string

    public constructor(value: string) {
        super(NodeValueType.Char)
        this.value = value
    }

    public get getValue() { return this.value }
}

export class LiteralObjectNode extends ValueNode {
    private entries: Map<string, ValueNode>

    public constructor(entries: Map<string, ValueNode>) {
        super(NodeValueType.LiteralObj)
        this.entries = entries
    }

    public get getEntries() { return this.entries }
}

export class ObjectDestructuringNode extends ValueNode {
    private declarations: VariableNode[]

    public constructor(declarations: VariableNode[]) {
        super(NodeValueType.ObjDestruction)
        this.declarations = declarations
    }

    public get getDeclarations() { return this.declarations }
}

/**
 * Represents a module access in the AST
 */
export class ModuleAccessNode extends ValueNode {
    private modName: string
    private target: AccesibleTarget<ModuleAccessNode>

    public constructor(modName: string, target: AccesibleTarget<ModuleAccessNode>) {
        super(NodeValueType.ModAccess)
        this.modName = modName
        this.target = target
    }

    /**
     * Gets the name of the wrapped accessed entity
     * @returns The name of the wrapped acccessed entity
     */
    public getTargetName(): string {
        if (TypeGuardsNodeValues.isCall(this.target))
            return this.target.getCallee
        else if (TypeGuardsNodeValues.isIdentifier(this.target))
            return this.target.getSymbol
        else {
            return this.target.getTargetName()
        }
    }

    public get getModName() { return this.modName }
    public get getTarget()  { return this.target }
}

export class ObjectAccessNode extends ValueNode {
    }

    public get getAccessedObj()    { return this.accessedObj }
    public get getAccessedEntity() { return this.access }
}

export class IdentifierNode extends ValueNode {
    private symbol: string

    public constructor(symbol: string) {
        super(NodeValueType.Identifier)
        this.symbol = symbol
    }

    public get getSymbol() { return this.symbol }
}

export class LiteralArrayNode<T> extends ValueNode {
    private array: T[]

    public constructor(array: T[]) {
        super(NodeValueType.LiteralArray)
        this.array = array
    }

    public get getArray() { return this.array }
}

export class ReferenceNode extends ValueNode {
    private target: string

    public constructor(target: string) {
        super(NodeValueType.Reference)
        this.target = target
    }

    public get getTarget() { return this.target }
}

export class CallNode extends ValueNode {
    private callee: string
    private args: ValueNode[]

    public constructor(callee: string, args: ValueNode[]) {
        super(NodeValueType.Call)
        this.callee = callee
        this.args = args
    }

    public get getCallee() { return this.callee }
    public get getArgs()   { return this.args }
}

export class BinaryExprNode extends ValueNode {
    private lhs: string
    private rhs: ValueNode

    public constructor(lhs: string, rhs: ValueNode) {
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
export class UndefinedNode extends ValueNode {
    public constructor() {
        super(NodeValueType.Undefined)
    }
export class BooleanNode extends ValueNode {
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
    private returnValue: ValueNode
    private async: boolean

    public constructor(
        name: string, kind: NodeValueType | NodeEntityType,
        params: ScrapParam[], body: Instruction[],
        returnValue: ValueNode, async: boolean
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
export class VariableNode extends EntityNode {
    private const: boolean
    private assignedValue: ValueNode

    public constructor(name: string, constant: boolean, assignedValue: ValueNode) {
        super(name, NodeEntityType.Variable)
        this.const = constant
        this.assignedValue = assignedValue
    }

    public get isConst()          { return this.const }
    public get getAssginedValue() { return this.assignedValue }
}

export class ModuleNode extends EntityNode {
    private body: EntityNode[]
    private defaultExport?: EntityNode

    public constructor(name: string, body: EntityNode[], defaultExport?: EntityNode) {
        super(name, NodeEntityType.Module)
        this.body = body
        this.defaultExport = defaultExport
    }

    public get getBody()          { return this.body }
    public get getDefaultExport() { return this.defaultExport }
}

export class ClassNode extends EntityNode {
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