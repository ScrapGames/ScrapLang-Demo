import { ASTEntityNode, NodeEntityType } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class TypeGuardsNodeEntities {
    public static isVariable(node: ASTEntityNode): node is ast.VariableNode {
        return node.kind === NodeEntityType.Variable
    }
    
    public static isModule(node: ASTEntityNode): node is ast.ModuleNode {
        return node.kind === NodeEntityType.Module
    }
    
    public static isClass(node: ASTEntityNode): node is ast.ClassNode {
        return node.kind === NodeEntityType.Class
    }
}
