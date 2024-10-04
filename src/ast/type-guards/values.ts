import { ValueNode, ValueKind } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class guardsNodeV {
    public static isNumeric(node: ValueNode): node is ast.NumericNode {
        return node.kind === ValueKind.Numeric
    }
    
    public static isFloat(node: ValueNode): node is ast.FloatNode {
        return node.kind === ValueKind.Float
    }
    
    public static isString(node: ValueNode): node is ast.StringNode {
        return node.kind === ValueKind.String
    }
    
    public static isChar(node: ValueNode): node is ast.CharNode {
        return node.kind === ValueKind.Char
    }
    
    public static isLiteralObject(node: ValueNode): node is ast.LiteralObjectNode {
        return node.kind === ValueKind.LiteralObj
    }
    
    public static isObjectDestruction(node: ValueNode): node is ast.ObjectDestructuringNode {
        return node.kind === ValueKind.ObjDestruction
    }
    
    public static isModuleAccess(node: ValueNode): node is ast.ModuleAccessNode {
        return node.kind === ValueKind.ModAccess
    }
    
    public static isObjectAccess(node: ValueNode): node is ast.ObjectAccessNode {
        return node.kind === ValueKind.ObjAccess
    }
    
    public static isCall(node: ValueNode): node is ast.CallNode {
        return node.kind === ValueKind.Call
    }
    
    public static isIdentifier(node: ValueNode): node is ast.IdentifierNode {
        return node.kind === ValueKind.Identifier
    }
    
    public static isLiteralArray<T>(node: ValueNode): node is ast.LiteralArrayNode<T> {
        return node.kind === ValueKind.LiteralArray
    }
    
    public static isReference(node: ValueNode): node is ast.ReferenceNode {
        return node.kind === ValueKind.Reference
    }
    
    public static isReassignment(node: ValueNode): node is ast.ReassignmentNode {
        return node.kind === ValueKind.Reassignment
    }
    
    public static isUndefined(node: ValueNode): node is ast.UndefinedNode {
        return node.kind === ValueKind.Undefined
    }

    }
}
