import { EntityNode, EntityKind } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class TypeGuardsNodeEntities {
    public static isVariable(node: EntityNode): node is ast.VariableNode {
        return node.kind === EntityKind.Variable
    }
    
    public static isModule(node: EntityNode): node is ast.ModuleNode {
        return node.kind === EntityKind.Module
    }
    
    public static isClass(node: EntityNode): node is ast.ClassNode {
        return node.kind === EntityKind.Class
    }
}
