import type { Nameable, Exportable, Instruction } from "@typings"
export class ASTNode {}

/**
 * Discriminant for Nodes which represents an entity in the AST
 */
export enum EntityKind {
    Module,
    Function,
    Variable,
    Class
}

/**
 * Discriminant for Nodes which represents a value in the AST
 */
export enum ValueKind {
    Numeric,
    Float,
    String,
    Char,
    LiteralObj,
    ModAccess,
    ObjAccess,
    Identifier,
    LiteralArray,
    Reference,
    Call,
    Reassignment,
    Undefined,
    Function
}

/**
 * Represents an entity, like classes or modules in the AST
 */
export class EntityNode extends ASTNode implements Nameable, Exportable {
    name: string
    isExported: boolean = false
    public kind: EntityKind

    public constructor(name: string, kind: EntityKind) {
        super()
        this.name = name
        this.kind = kind
    }
}

export class ControlStmtNode extends ASTNode {
    public condition: BooleanNode
    public kind: ControlStmtKind
    private body: Instruction[]

    public constructor(condition: BooleanNode, body: Instruction[], kind: ControlStmtKind) {
        super()
        this.condition = condition
        this.body = body
        this.kind = kind
    }

    public get getBody() { return this.body }
}

/**
 * Represents a value in the AST
 */
export class ValueNode extends ASTNode {
    public kind: ValueKind

    public constructor(kind: ValueKind) {
        super()
        this.kind = kind
    }
}

/**
 * The AST stores the program in nodes
 */
export class AST {
    private program: ASTNode[]

    public constructor() {
        this.program = []
    }

    public pushNode(node: ASTNode) {
        this.program.push(node)
    }

    public get getProgram() { return this.program }
}