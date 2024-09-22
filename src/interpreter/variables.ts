import { ReassignmentNode } from "@ast/nodes.ts"
import { Scope } from "@lang/scope.ts"
import { ScrapValue } from "@lang/elements/commons.ts"
import { ASTValueNode } from "@ast/ast.ts"
import { Interpreter } from "@interpreter"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"

/**
 * Performs a reassignment to the targeted variable as long as the target isn't a variable
 * @param reassingment Node which contains the reassignment target and the reassigned value
 * @param scope Scope where the needed contents for the reassignment can be found
 * @returns The new reassigned value
 */
export function computeReassignment(this: Interpreter, reassingment: ReassignmentNode, scope: Scope): ScrapValue {
    const target = scope.getReference(reassingment.getLHS)
    const newVal = this.computeValue(reassingment.getRHS as ASTValueNode, scope)

    if (!target)
      this.scrapReferenceError()

    if (!(target instanceof ScrapVariable))
      this.scrapRuntimeError("Only variables can be reassigned")

    if (target.isConst)
      this.scrapRuntimeError("A constant can not change its value")

    target.setAssignedValue = newVal
    return newVal
  }