import { ReassignmentNode } from "@ast/nodes.ts"
import { Scope } from "@lang/scope.ts"
import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"

import { Interpreter, scrapReferenceError, scrapRuntimeError } from "@interpreter"

/**
 * Performs a reassignment to the targeted variable as long as the target isn't a variable
 * @param reassingment Node which contains the reassignment target and the reassigned value
 * @param scope Scope where the needed contents for the reassignment can be found
 * @returns The new reassigned value
 */
export function computeReassignment(interpreter: Interpreter, reassingment: ReassignmentNode, scope: Scope): ScrapValue {
    const target = scope.getReference(reassingment.getLHS)
    const newVal = interpreter.computeValue(reassingment.getRHS as ASTValueNode, scope)

    if (!target)
      scrapReferenceError(interpreter.parser)

    if (!(target instanceof ScrapVariable))
      scrapRuntimeError("Only variables can be reassigned")

    if (target.isConst)
      scrapRuntimeError("A constant can not change its value")

    target.setAssignedValue = newVal
    return newVal
  }

/**
 * Computes the value assigned to a `VariableNode`
 * @param variable `VariableNode` which contains the future SCrapValue
 * @param scope Scope where the assigned value can be found
 * @returns A new `ScrapVariable` which contains the value stored in `variable` node
 */
export function computeVar(interpreter: Interpreter, variable: VariableNode, scope: Scope): ScrapVariable {
  return new ScrapVariable(
    variable.isConst,
    variable.name,
    interpreter.computeValue(variable.getAssginedValue as ASTValueNode, scope),
    variable.isExported
  )
}