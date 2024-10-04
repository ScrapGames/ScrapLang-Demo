import { EntityNode, EntityKind } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class TypeGuardsNodeEntities {
    public static isVariable(node: EntityNode): node is ast.VariableNode {
        return node.kind === NodeEntityType.Variable
    }
    
    public static isModule(node: EntityNode): node is ast.ModuleNode {
        return node.kind === NodeEntityType.Module
    }
    
    public static isClass(node: EntityNode): node is ast.ClassNode {
        return node.kind === NodeEntityType.Class
    }
}
