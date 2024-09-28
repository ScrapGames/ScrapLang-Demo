import { ASTValueNode, NodeValueType } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class guardsNodeV {
    public static isNumeric(node: ASTValueNode): node is ast.NumericNode {
        return node.kind === NodeValueType.Numeric
    }
    
    public static isFloat(node: ASTValueNode): node is ast.FloatNode {
        return node.kind === NodeValueType.Float
    }
    
    public static isString(node: ASTValueNode): node is ast.StringNode {
        return node.kind === NodeValueType.String
    }
    
    public static isChar(node: ASTValueNode): node is ast.CharNode {
        return node.kind === NodeValueType.Char
    }
    
    public static isLiteralObject(node: ASTValueNode): node is ast.LiteralObjectNode {
        return node.kind === NodeValueType.LiteralObj
    }
    
    public static isObjectDestruction(node: ASTValueNode): node is ast.ObjectDestructuringNode {
        return node.kind === NodeValueType.ObjDestruction
    }
    
    public static isModuleAccess(node: ASTValueNode): node is ast.ModuleAccessNode {
        return node.kind === NodeValueType.ModAccess
    }
    
    public static isObjectAccess(node: ASTValueNode): node is ast.ObjectAccessNode {
        return node.kind === NodeValueType.ObjAccess
    }
    
    public static isCall(node: ASTValueNode): node is ast.CallNode {
        return node.kind === NodeValueType.Call
    }
    
    public static isIdentifier(node: ASTValueNode): node is ast.IdentifierNode {
        return node.kind === NodeValueType.Identifier
    }
    
    public static isLiteralArray<T>(node: ASTValueNode): node is ast.LiteralArrayNode<T> {
        return node.kind === NodeValueType.LiteralArray
    }
    
    public static isReference(node: ASTValueNode): node is ast.ReferenceNode {
        return node.kind === NodeValueType.Reference
    }
    
    public static isReassignment(node: ASTValueNode): node is ast.ReassignmentNode {
        return node.kind === NodeValueType.Reassignment
    }
    
    public static isUndefined(node: ASTValueNode): node is ast.UndefinedNode {
        return node.kind === NodeValueType.Undefined
    }
}
