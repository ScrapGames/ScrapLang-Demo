import { Interpreter } from "../interpreter.ts"

import { IfStmtNode } from "@ast/nodes.ts"
import { createEmptyScope, Scope } from "../../scope.ts"

export function computeIf(interpreter: Interpreter, node: IfStmtNode, scope: Scope) {
    if (node.condition.getValue) {
        const localScope = createEmptyScope(scope, "<Anonymous>")
        for (const instruction of node.getBody)
            interpreter.computeInstruction(instruction, localScope)
    }
}