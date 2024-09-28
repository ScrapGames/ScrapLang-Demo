import { ASTControlNode, NodeControlType } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class TypeGuardNodeControls {
    public static isIf(node: ASTControlNode): node is ast.IfNode {
        return node.kind === NodeControlType.If
    }

    //public static isFor(node: ASTControlNode): node is ast.ForNode {
    //    return node.kind === CnodeControlType.For
    //}
}