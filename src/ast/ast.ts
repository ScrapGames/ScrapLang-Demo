import type { Nameable, Exportable, Instruction } from "@typings"
export class ASTNode {}

/**
 * Discriminant for Nodes which represents an entity in the AST
 */
export enum NodeEntityType {
    Module,
    Function,
    Variable,
    Class
}

/**
 * Discriminant for Nodes which represents a value in the AST
 */
export enum NodeValueType {
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
export class ASTEntityNode extends ASTNode implements Nameable, Exportable {
    name: string
    isExported: boolean = false
    public kind: NodeEntityType

    public constructor(name: string, kind: NodeEntityType) {
        super()
        this.name = name
        this.kind = kind
    }
}

/**
 * Represents a value in the AST
 */
export class ASTValueNode extends ASTNode {
    public kind: NodeValueType

    public constructor(kind: NodeValueType) {
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