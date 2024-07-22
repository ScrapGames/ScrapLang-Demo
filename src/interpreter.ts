import Parser from "@parser/parser.ts"

import { CompilationError } from "@lang/lang-errors.ts"
import { ScrapCall } from "@lang/elements/values/call.ts"
import { ScrapUndefined } from "@lang/elements/values/absence.ts"
import { DefinedModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"
import { ScrapReference } from "@lang/elements/values/reference.ts"
import { ScrapArray, ScrapArrayAccess } from "@lang/elements/values/array.ts"
import { ReassignmentExpression } from "@lang/elements/values/reassignment.ts"
import { DefinedFunction, ScrapEntity, ScrapNative, ScrapValue } from "@lang/elements/commons.ts"

export class Interpreter {
  private parser: Parser

  public constructor(parser: Parser) {
    this.parser = parser
  }

  private execScrapNative(value: ScrapNative, call: ScrapCall): ScrapValue {
    const computedArgs = call.getArgs.map((arg) => this.computeExpression(arg))
    return this.computeExpression(value.getAction(...computedArgs))
  }

  public execScrapFunction(value: DefinedFunction, call: ScrapCall): ScrapValue {
    call.getArgs.map((arg) => this.computeExpression(arg))

    for (const val of value.body)
      this.compute(val)

    return this.computeExpression(value.getReturnType)
  }

  private resolveExecutor(value: ScrapCall) {
    const calledFunction = value.getCalled

    if (calledFunction instanceof ScrapNative)
      return this.execScrapNative(calledFunction, value)
    else
      return this.execScrapFunction(
        calledFunction as DefinedFunction,
        value
      )
  }

  private computeReassignment(value: ReassignmentExpression): ScrapValue {
    const newValue = value.getValue as ScrapValue
    const target = value.getTarget

    if (value.getTarget.getAssignedValue instanceof ScrapReference)
      value.getTarget.getAssignedValue.getReferencedVar.setAssignedValue = newValue

    target.setAssignedValue = newValue

    return newValue
  }

  private computeArray(value: ScrapArray<ScrapValue>) {
    return new ScrapArray(
      value.getValue.map(item => this.computeExpression(item).getValue)
    )
  }

  private computeArrayAccess(value: ScrapArrayAccess): ScrapValue | ScrapUndefined {
    const accessedValue = value.getAccessedArray.getValue.at(value.getAccessedPosition.getValue)

    if (!accessedValue)
      return new ScrapUndefined()

    return accessedValue
  }

  private computeReference(value: ScrapReference): ScrapValue {
    return (value.getValue as ScrapVariable).getAssignedValue
  }

  /**
   * Receives a `DefiendModule`, which is a module defined in a .scrap file
   *
   * Since modules created using the language API does not need to be interpreted's.
   * Only those who are declared by user in .scrap files, need to be readed by the interpreter
   *
   * @param value A defined by user module
   * @returns
   */
  public computeModule(value: DefinedModule) {
    for (const val of value.getBody)
      this.compute(val)
  }

  private computeEntities(entity: ScrapEntity) {
    switch (true) {
      case entity instanceof ScrapVariable: this.computeExpression(entity.getAssignedValue); break
      case entity instanceof DefinedModule: this.computeModule(entity); break
      default:
        console.warn(`The interpreter can not compute '${entity.constructor.name}' yet.`)
        break
    }
  }

  private computeExpression(value: ScrapValue): ScrapValue {
    switch (true) {
      case value instanceof ScrapCall:               return this.resolveExecutor(value)
      case value instanceof ScrapArray:              return this.computeArray(value)
      case value instanceof ScrapArrayAccess:        return this.computeArrayAccess(value)
      case value instanceof ReassignmentExpression:  return this.computeReassignment(value)
      case value instanceof ScrapReference:          return this.computeReference(value)
      //case value instanceof ScrapReference:       return this.computeReference(value)
    }

    return value
  }

  public compute(node: ScrapValue | ScrapEntity) {
    if (node instanceof ScrapEntity)
      this.computeEntities(node)
    else
      this.computeExpression(node)
  }

  public run() {
    const program = this.parser.ast.getProgram

    if (program.length === 0)
      throw new CompilationError(
        "The AST is empty. You must run the parser before the interpreter"
      )

    //console.log(program)
    for (const node of program)
      this.compute(node.getNodeValue)
  }

  public get getParser() {
    return this.parser
  }
}