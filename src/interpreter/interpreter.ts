import Parser from "@parser/parser.ts"

import { RuntimeError } from "@lang/lang-errors.ts"
import { Scope, UndefinedReferenceError } from "@lang/scope.ts"

import { ASTEntityNode, ASTValueNode, NodeEntityType, NodeValueType } from "@ast/ast.ts"

import {
  NumericNode, FloatNode,
  CallNode, FunctionNode,
  ModuleNode, ClassNode as _,
  ReassignmentNode, VariableNode,
  StringNode, CharNode,
  LiteralObjectNode, LiteralArrayNode,
  ModuleAccessNode, ObjectAccessNode as __,
  IdentifierNode, ReferenceNode
} from "@ast/nodes.ts"

import { Instructions, Nameable } from "@typings"

import { ScrapVariable } from "@lang/elements/entities/variables.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"

import {
  ScrapValue,
  ScrapNativeFn,
  DefinedFunction,
  ScrapEntity,
  ScrapObject,
  ScrapFunction,
  ScrapPrimitive
} from "@lang/elements/commons.ts"

import { ScrapArray } from "@lang/elements/values/array.ts"
import { ScrapUndefined } from "@lang/elements/values/absence.ts"
import { ScrapReference } from "@lang/elements/values/reference.ts"
import { ScrapChar, ScrapString } from "@lang/elements/values/textuals.ts"
import { ScrapFloat, ScrapInteger } from "@lang/elements/values/numerics.ts"

import * as mods from "./modules.ts"
import * as fns from "./functions.ts"
import * as vars from "./variables.ts"
import { VERSION } from "@scrap"

/**
 * The interpreter is the responsible of finally execute the code and register the declared entites
 * It's like the engine of the language
 */
export class Interpreter {
  private parser: Parser
  private globalMod: ScrapModule

  public constructor(parser: Parser, globalMod: ScrapModule) {
    this.parser = parser
    this.globalMod = globalMod
  }

  /**
   * Causese the program to stop cause an error at runtime
   * @param message Informational error message that will be printed in the console
   */
  public scrapRuntimeError(message: string): never {
    throw new RuntimeError(message)
  }

  /**
   * Causes the program stop by a undefined referenced
   */
  public scrapReferenceError(): never {
    throw new UndefinedReferenceError(this.parser.getCursor.currentTok)
  }

  private addToScope(entity: Nameable, scope: Scope) {
    if (!scope.addEntry(entity.name, entity))
      this.scrapRuntimeError(`'${entity.name}' is already defined at '${scope.getOwner}'`)
    
    return entity
  }

  /**
   * Computes the value assigned to a `VariableNode`
   * @param variable `VariableNode` which contains the future SCrapValue
   * @param scope Scope where the assigned value can be found
   * @returns A new `ScrapVariable` which contains the value stored in `variable` node
   */
  private computeVar(variable: VariableNode, scope: Scope): ScrapVariable {
    return new ScrapVariable(variable.isConst, variable.name, this.computeValue(variable.getAssginedValue as ASTValueNode, scope))
  }

  private computeReference(ref: ReferenceNode, scope: Scope) {
    const target = scope.getReference(ref.getTarget)

    if (!target)
      this.scrapReferenceError()

    if (target instanceof ScrapModule)
      this.scrapRuntimeError("Modules cannot be referenced")

    return new ScrapReference(target)
  }

  // TODO: handle number of arguments passed for DefinedFunction objects
  private execDefinedFunc(_call: CallNode, callee: DefinedFunction, scope: Scope) {
    for (const instruction of callee.getBody)
      this.inferFnInstruction(instruction, scope)

    callee.getScope.clean() // cleanup the scope, freeing memory
    return this.computeValue(callee.getReturnValue, scope) // The return value is deleted by the JavaScript garbage collector itself, since it's not part of the function scope, ins't necessary to explictly delete it
  }

  /**
   * Executes the function once previous checks like correct arguments length, among others
   * @param call The call node is needed cause of the number of provided arguments
   * @param callee Function to be executed
   * @param scope Scope where the arguments will be interpreted
   * @returns The ScrapValue returned after the execution of `callee`
   */
  public execCallee(call: CallNode, callee: ScrapFunction, scope: Scope): ScrapValue {
    if (callee instanceof ScrapNativeFn) {
      if (callee.getArgsCount && call.getArgs.length > callee.getArgsCount)
        this.scrapRuntimeError(`'${callee.name}' expects ${callee.getArgsCount} arguments, but ${call.getArgs.length} has been received`)

      return callee.getAction(...call.getArgs.map(arg => this.computeValue(arg as ASTValueNode, scope)))
    }

    return this.execDefinedFunc(call, callee as DefinedFunction, (callee as DefinedFunction).getScope)
  }

  public findCallee(call: CallNode, whereIsCallee: Scope) {
    const callee = whereIsCallee.getReference(call.getCallee) as ScrapFunction | undefined
    if (!callee)
      this.scrapReferenceError()

    if (callee instanceof ScrapVariable) {
      if (!(callee.getAssignedValue instanceof ScrapFunction))
        this.scrapRuntimeError(`The expression is not callable. '${call.getCallee}' doesn't contains values with call signatures`)

      return callee.getAssignedValue
    }


    return callee
  }

  /**
   * @param call
   * @param scope
   * @returns The ScrapValue computed after the function execution
   */
  public computeCall(call: CallNode, scope: Scope): ScrapValue {
    const callee = this.findCallee(call, scope)
    return this.execCallee(call, callee, scope)
  }

  /**
   * Returns the ScrapValue contained in the identifier. If value contained by `node` is an variable, returns the contained value, else, we suppose that the value is a function and simply returns it
   * @param node Identifier AST node, which contains the referred element name
   * @param scope Scope where the element can be founded
   * @returns A new ScrapValue of the founded element
   */
  public computeIdentifier(node: IdentifierNode, scope: Scope): ScrapValue {
    const referred = scope.getReference(node.getSymbol) as ScrapVariable | ScrapFunction
    if (!referred)
      this.scrapReferenceError()

    const storedValue = referred instanceof ScrapVariable ? referred.getAssignedValue : referred
    return storedValue instanceof ScrapPrimitive ? new ScrapValue(storedValue.getValue) : storedValue
  }

  /**
   * Creates a ScrapObject from the items contained in `node`
   * @param node Object AST node, where the items are stored
   * @param scope Scope where the item pairs exists
   * @returns A new ScrapObject
   */
  private computeLitObj(node: LiteralObjectNode, scope: Scope): ScrapObject {
    const entries = (node as LiteralObjectNode).getPairs.entries()
    const mappedValues = new Map()

    for (const entry of entries)
      mappedValues.set(entry[0], this.computeValue(entry[1], scope))

    return new ScrapObject(null, mappedValues)
  }

  /**
   * Creates a ScrapArray from the items contained in `node`
   * @param node Array AST node, where the items are stored
   * @param scope Scope where the items exists
   * @returns A new ScrapArray
   */
  private computeLitArr(node: LiteralArrayNode<ASTValueNode>, scope: Scope): ScrapArray<ScrapValue> {
    return new ScrapArray(node.getArray.map(item => this.computeValue(item, scope)))
  }

  /**
   * Returns a ScrapValue based on `node.kind`
   * @param node Node who contains the value of the new ScrapValue
   * @param scope Scope where the data of some nodes, like 'identifiers' can be founded
   * @returns A new ScrapValue based on the received `node`
   */
  public computeValue(node: ASTValueNode, scope: Scope): ScrapValue {
    switch (node.kind) {
      case NodeValueType.Function:     return fns.computeFn.call(this, node as FunctionNode, scope) // functions can also be assigned as values
      case NodeValueType.Reassignment: return vars.computeReassignment.call(this, node as ReassignmentNode, scope)
      case NodeValueType.ModAccess:    return mods.computeModuleAccess.call(this, node as ModuleAccessNode, scope)
      case NodeValueType.Call:         return this.computeCall(node as CallNode, scope)
      case NodeValueType.Identifier:   return this.computeIdentifier(node as IdentifierNode, scope)
      case NodeValueType.LiteralObj:   return this.computeLitObj(node as LiteralObjectNode, scope)
      case NodeValueType.LiteralArray: return this.computeLitArr(node as LiteralArrayNode<ASTValueNode>, scope)

      // for cleanest code, values who simply needs a casting are separated from values which needs to be processed
      case NodeValueType.String:        return new ScrapString((node as StringNode).getValue)
      case NodeValueType.Numeric:       return new ScrapInteger((node as NumericNode).getValue)
      case NodeValueType.Float:         return new ScrapFloat((node as FloatNode).getValue)
      case NodeValueType.Char:          return new ScrapChar((node as CharNode).getValue)
      case NodeValueType.Undefined:     return new ScrapUndefined()

      case NodeValueType.ObjAccess:
      case NodeValueType.Reference: this.scrapRuntimeError(`ScrapLang ${VERSION} still doesn't support '${node.constructor.name}' interpreting`)
    }
  }

  /**
   * Returns a ScrapEntity based on `node.kind`
   * @param node Node who contains the data of the entity, like: function body, module exports, etc
   * @param scope Scope where the declared entites on each entity will be stored
   * @returns A new ScrapEntity containing the data stored at `node`
   */
  public computeEntity(node: ASTEntityNode, scope: Scope): ScrapEntity {
    switch (node.kind) {
      case NodeEntityType.Module:   return mods.computeMod.call(this, node as ModuleNode, scope)
      case NodeEntityType.Function: return fns.computeFn.call(this, node as FunctionNode, scope)
      case NodeEntityType.Variable: return this.computeVar(node as VariableNode, scope)

      case NodeEntityType.Class: this.scrapRuntimeError(`${node.constructor.name} still isn't supported`)
    }
  }

  /**
   * Resolve the type of node of a function body
   * 
   * Since functions can contains both some specific nodes, inherited from ASTEntityNode and ASTValueNode
   * @param node Node of instruction type, they can be: FunctionNode | CallNode | ReassignmentNode | VariableNode
   * @param fnScope Scope of the function to execute
   */
  private inferFnInstruction(node: Instructions, fnScope: Scope) {
    if (node instanceof ASTValueNode)
      this.computeValue(node, fnScope)
    else
      // at this point, the value of `node` is an instance of `ASTEntityNode`
      this.addToScope(this.computeEntity(node as ASTEntityNode, fnScope), fnScope)
  }

  /**
   * Inits the Interpreter and execute the contents in the AST
   * @param inserts Entities and other nameables which will be inserted before the execution of the program
   */
  public run() {
    while (!this.parser.hasFinish) {
      const interpretedEntity = this.computeEntity(this.parser.parseRoot(), this.globalMod.getScope)
      this.globalMod.insert(interpretedEntity.name, interpretedEntity)
    }

    const mainFn = this.globalMod.getEntity("main") as DefinedFunction | undefined
    if (!mainFn)
      this.scrapRuntimeError("Missing program entry point (main function)")

    for (const instruction of mainFn.getBody) {
      this.inferFnInstruction(instruction, mainFn.getScope)
    }
  }
}
