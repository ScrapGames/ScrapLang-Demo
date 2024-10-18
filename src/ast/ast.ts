import * as ast from "@ast/nodes.ts"
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
    ObjDestructuring,
    ModAccess,
    ObjAccess,
    Identifier,
    LiteralArray,
    Reference,
    Call,
    Reassignment,
    Undefined,
    Function,
    Boolean,
    BinaryExpr
}

export enum ControlStmtKind {
    If,
    For,
    ForOf,
    ForIn,
    While,
    DoWhile
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

    public isVariable(): this is ast.VariableNode {
        return this.kind === EntityKind.Variable
    }

    public isFunctionStmt(): this is ast.FunctionNode {
        return this.kind === EntityKind.Function
    }
    
    public isModule(): this is ast.ModuleNode {
        return this.kind === EntityKind.Module
    }
    
    public isClass(): this is ast.ClassNode {
        return this.kind === EntityKind.Class
    }
}

export class ControlStmtNode extends ASTNode {
    public condition: ast.BooleanNode
    public kind: ControlStmtKind
    private body: Instruction[]

    public constructor(condition: ast.BooleanNode, body: Instruction[], kind: ControlStmtKind) {
        super()
        this.condition = condition
        this.body = body
        this.kind = kind
    }

    public isIf(): this is ast.IfStmtNode {
        return this.kind === ControlStmtKind.If
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

    public isNumeric(): this is ast.NumericNode {
        return this.kind === ValueKind.Numeric
    }
    
    public isFloat(): this is ast.FloatNode {
        return this.kind === ValueKind.Float
    }
    
    public isString(): this is ast.StringNode {
        return this.kind === ValueKind.String
    }
    
    public isChar(): this is ast.CharNode {
        return this.kind === ValueKind.Char
    }
    
    public isLiteralObject(): this is ast.LiteralObjectNode {
        return this.kind === ValueKind.LiteralObj
    }
    
    public isObjectDestruction(): this is ast.ObjectDestructuringNode {
        return this.kind === ValueKind.ObjDestructuring
    }
    
    public isModuleAccess(): this is ast.ModuleAccessNode {
        return this.kind === ValueKind.ModAccess
    }
    
    public isObjectAccess(): this is ast.ObjectAccessNode {
        return this.kind === ValueKind.ObjAccess
    }
    
    public isCall(): this is ast.CallNode {
        return this.kind === ValueKind.Call
    }
    
    public isIdentifier(): this is ast.IdentifierNode {
        return this.kind === ValueKind.Identifier
    }
    
    public isLiteralArray(): this is ast.ArrayNode<ValueNode> {
        return this.kind === ValueKind.LiteralArray
    }
    
    public isReference(): this is ast.ReferenceNode {
        return this.kind === ValueKind.Reference
    }
    
    public isReassignment(): this is ast.ReassignmentNode {
        return this.kind === ValueKind.Reassignment
    }
    
    public isUndefined(): this is ast.UndefinedNode {
        return this.kind === ValueKind.Undefined
    }

    public isBinaryExpr(): this is ast.BinaryExprNode {
        return this.kind === ValueKind.BinaryExpr
    }

    public isFunctionExpr(): this is ast.FunctionNode {
        return this.kind === ValueKind.Function
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
