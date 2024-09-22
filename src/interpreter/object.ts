import { Scope } from "@lang/scope.ts"
import { Interpreter } from "@interpreter"
import { IdentifierNode, LiteralObjectNode } from "@ast/nodes.ts"

/**
 * Computes the parsed object destruction
 * @param obj Object to be destructed
 * @param scope Scope where the destructed elements will be added
 */
export function computeObjectDestruction(this: Interpreter, _obj: IdentifierNode | LiteralObjectNode, _scope: Scope) {

}