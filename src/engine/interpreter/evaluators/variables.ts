import { ExpressionNode } from "@ast/ast.ts"
import { BinaryExprNode, VariableNode } from "@ast/nodes.ts"

import { Scope } from "../../scope.ts"
import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"

import { Interpreter, scrapReferenceError, scrapRuntimeError } from "../interpreter.ts"

/**
 * Performs a reassignment to the targeted variable as long as the target isn't a variable
 * @param reassingment Node which contains the reassignment target and the reassigned value
 * @param scope Scope where the needed contents for the reassignment can be found
 * @returns The new reassigned value
 */
export function computeReassignment(interpreter: Interpreter, reassingment: BinaryExprNode, scope: Scope): ScrapValue {
    const target = scope.get(reassingment.getLHS.name)
    const newVal = interpreter.computeValue(reassingment.getRHS as ExpressionNode, scope)

    if (!target)
      scrapReferenceError(interpreter.parser)

    if (!guards.isVariable(target))
      scrapRuntimeError("Only variables can be reassigned")

    if (target.isConst)
      scrapRuntimeError("A constant can not change its value")

    if (guards.isReference(target.getVal))
      target.getVal.getReferencedVar.setVal = newVal
    else
      target.setVal = newVal
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
    interpreter.computeValue(variable.Value as ExpressionNode, scope),
    variable.isExported
  )
}