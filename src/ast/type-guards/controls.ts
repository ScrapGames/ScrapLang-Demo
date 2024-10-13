import { ControlStmtNode, ControlStmtKind } from "@ast/ast.ts"
import * as ast from "@ast/nodes.ts"

export default class TypeGuardNodeControls {
    public static isIf(node: ControlStmtNode): node is ast.IfStmtNode {
        return node.kind === ControlStmtKind.If
    }

    //public static isFor(node: ASTControlNode): node is ast.ForNode {
    //    return node.kind === CnodeControlType.For
    //}
}