import * as mods from "./modules.ts"
import * as fns from "./functions.ts"
import * as vars from "./variables.ts"
import * as objs from "./objects.ts"
import * as ctrls from "./controls.ts"

import Parser from "@parser/parser.ts"

import { ControlStmtNode, EntityNode, ValueNode, EntityKind, ValueKind } from "@ast/ast.ts"
import {
  CallNode, FunctionNode,
  LiteralObjectNode, LiteralArrayNode,
  IdentifierNode,
  BinaryExprNode
} from "@ast/nodes.ts"

import guardsNodeV from "@ast/type-guards/values.ts"
import guardsNodeE from "@ast/type-guards/entities.ts"
import guardsNodeC from "@ast/type-guards/controls.ts"

import guards from "@lang/elements/guards.ts"

import { RuntimeError } from "@lang/lang-errors.ts"
import { Scope, UndefinedReferenceError } from "@lang/scope.ts"

import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"

import { ScrapArray } from "@lang/elements/values/array.ts"
import { ScrapChar, ScrapString } from "@lang/elements/values/textuals.ts"
import { ScrapFloat, ScrapInteger } from "@lang/elements/values/numerics.ts"

import {
  ScrapValue,
  ScrapNativeFn,
  DefinedFunction,
  ScrapEntity,
  ScrapObject,
  ScrapFunction,
  ScrapUndefined
} from "@lang/elements/commons.ts"

import { VERSION } from "@scrap"
import type { Nameable, Exportable, Instruction, ScrapObjectProperty } from "@typings"

/**
 * Causes the program stop by a undefined referenced
 */
export function scrapReferenceError(parser: Parser): never {
  throw new UndefinedReferenceError(parser.getCursor.currentTok)
}

export function addToScope(entity: Nameable & Exportable, scope: Scope) {
  if (!scope.addEntry(entity.name, entity))
    scrapRuntimeError(`'${entity.name}' is already defined at '${scope.getOwner}'`)

  return entity
}

/**
 * Causese the program to stop cause an error at runtime
 * @param message Informational error message that will be printed in the console
 */
export function scrapRuntimeError(message: string): never {
  throw new RuntimeError(message)
}

  /**
 * The interpreter is the responsible of finally execute the code and register the declared entites
 * It's like the engine of the language
 */
export class Interpreter {
  parser: Parser

  public constructor(parser: Parser) {
    this.parser = parser
  }

  private computeRestParameters(callee: DefinedFunction, calleerScope: Scope, params: IScrapParam[], args: ValueNode[]) {
    const restIdx = params.length - 1
    const slicedParams = params.slice(0, restIdx)
    const slicedArgs = args.slice(0, restIdx)

    if (slicedArgs.length !== slicedParams.length)
      scrapRuntimeError(`'${callee.name}' expects from ${slicedParams.length} to multiple arguments, but received ${slicedArgs.length}`)

    for (const i in slicedParams) {
      callee.getScope.addEntry(
        params[i].pName,
        new ScrapVariable(false, params[i].pName, this.computeValue(slicedArgs[i], calleerScope), false)
      )
    }

    callee.getScope.addEntry(
      params[params.length - 1].pName,
      new ScrapVariable(
        true, params[params.length - 1].pName,
        new ScrapArray(args.slice(restIdx, args.length).map(node => {
          return ({
            metaproperties: {
              isStatic: true,
              visibility: "public",
              writeable: true
            },
            value: this.computeValue(node, calleerScope)
          })
        })), false
      )
    )
  }

  private execDefinedFunc(call: CallNode, callee: DefinedFunction, scope: Scope, calleerScope: Scope) {
    const params = callee.getParams
    const args = call.getArgs

    if (params.length > 0 && params[params.length - 1].isRest) {
      this.computeRestParameters(callee, calleerScope, params, args)
    } else {
      if (args.length !== params.length)
        scrapRuntimeError(`'${callee.name}' expects ${callee.getParams.length} arguments, but received ${call.getArgs.length}`)

      for (const i in callee.getParams) {
        callee.getScope.addEntry(
          params[i].pName,
          new ScrapVariable(false, params[i].pName, this.computeValue(args[i], calleerScope), false)
        )
      }
    }

    for (const instruction of callee.getBody)
      this.computeInstruction(instruction, scope)

    // handles that returns value doesn't be a locally scoped variable
    if (callee.getReturnValue.isIdentifier() && callee.getScope.getEntries.has(callee.getReturnValue.getSymbol))
      scrapRuntimeError(`You returned a locally scoped value in '${callee.name}', which will be destroyed after the execution ends`)

    callee.getScope.clean() // cleanup the scope, freeing memory
    return (
        callee.getReturnValue.isUndefined() ?
        new ScrapUndefined() :
        this.computeValue(callee.getReturnValue, scope)
      )
    // The return value is deleted by the JavaScript garbage collector itself, since it's not part of the function scope, i't cant be explicitly deleted
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

      return callee.getAction(...call.getArgs.map(arg => this.computeValue(arg as ValueNode, scope)))
    }

    return this.execDefinedFunc(call, callee as DefinedFunction, (callee as DefinedFunction).getScope, scope)
  }

  public findCallee(call: CallNode, whereIsCallee: Scope) {
    const callee = whereIsCallee.get(call.getCallee) as ScrapFunction | undefined
    if (!callee)
      this.scrapReferenceError()

    if (guards.isVariable(callee)) {
      if (!guards.isDefinedFn(callee.getVal))
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
  public computeIdentifier(node: IdentifierNode, scope: Scope, searcher?: (name: string) => (ScrapVariable | ScrapFunction) | undefined): ScrapValue {
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
   * @param node Node containing the value of the new ScrapValue
   * @param scope Scope where the data of some nodes, like 'identifiers' can be founded
   * @returns A new ScrapValue based on the received `node`
   */
  public computeValue(node: ValueNode, scope: Scope): ScrapValue {
    // switch statement is weird af using type guards, add match to js pls :)
    if (node.kind === NodeValueType.Function)           return fns.computeFn(node as FunctionNode, scope)
    if (guardsNodeV.isReassignment(node))               return vars.computeReassignment(this, node, scope)
    if (guardsNodeV.isModuleAccess(node))               return mods.computeModuleAccess(this, node, scope)
    if (guardsNodeV.isObjectDestruction(node))          return objs.computeObjectDestruction(this, node, scope)
    if (guardsNodeV.isObjectAccess(node))               return objs.computeObjAccess(this, node, scope)
    if (guardsNodeV.isCall(node))                       return this.computeCall(node, scope)
    if (guardsNodeV.isIdentifier(node))                 return this.computeIdentifier(node, scope)
    if (guardsNodeV.isLiteralObject(node))              return this.computeLitObj(node, scope)
    if (guardsNodeV.isLiteralArray<ASTValueNode>(node)) return this.computeLitArr(node, scope)
    if (guardsNodeV.isString(node))                     return new ScrapString(node.getValue)
    if (guardsNodeV.isNumeric(node))                    return new ScrapInteger(node.getValue)
    if (guardsNodeV.isFloat(node))                      return new ScrapFloat(node.getValue)
    if (guardsNodeV.isChar(node))                       return new ScrapChar(node.getValue)
    
    scrapRuntimeError(`ScrapLang ${VERSION} still doesn't support '${node.constructor.name}' interpreting`)
    

  }

  /**
   * Returns a ScrapEntity based on `node.kind`
   * @param node Node who contains the data of the entity, like: function body, module exports, etc
   * @param scope Scope where the declared entites on each entity will be stored
   * @returns A new ScrapEntity containing the data stored at `node`
   */
  public computeEntity(node: EntityNode, scope: Scope): ScrapEntity {
    if (node.kind === NodeEntityType.Function) return fns.computeFn(node as FunctionNode, scope)
    if (guardsNodeE.isModule(node))   return mods.computeMod(this, node, scope)
    if (guardsNodeE.isVariable(node)) return vars.computeVar(this, node, scope)

    scrapRuntimeError(`ScrapLang ${VERSION} still doesn't support '${node.constructor.name}' interpreting`)
  }

  public computeControl(node: ControlStmtNode, scope: Scope) {
    if (guardsNodeC.isIf(node)) ctrls.computeIf(this, node, scope)
  }

  /**
   * Resolve the type of node of a function body
   * 
   * Since functions can contains both some specific nodes, inherited from ASTEntityNode and ASTValueNode
   * @param node Node of instruction type, they can be: FunctionNode | CallNode | ReassignmentNode | VariableNode
   * @param fnScope Scope of the function to execute
   */
  public computeInstruction(node: Instruction, fnScope: Scope) {
    if (node instanceof ValueNode)
      this.computeValue(node, fnScope)
    else if (node instanceof ControlStmtNode) {
      if (guardsNodeC.isIf(node)) ctrls.computeIf(this, node, fnScope)
    } else
      // at this point, the value of `node` is an instance of `ASTEntityNode`
      addToScope(this.computeEntity(node as EntityNode, fnScope), fnScope)
  }

  /**
   * Inits the Interpreter and execute the contents in the AST
   * @param parser Parser to _parse_ the source
   * @param globalMod Global module where all the priamry statements will be parsed
   */
  public static run(parser: Parser, globalMod: ScrapModule) {
    const interpreter = new Interpreter(parser)

    while (!parser.hasFinish) {
      const parsedEntity = parser.parseRoot()
      const computedEntity = interpreter.computeEntity(parsedEntity, globalMod.getScope)
      globalMod.insert(computedEntity.name, computedEntity)
    }

    const mainFn = globalMod.getEntity("main") as DefinedFunction | undefined
    if (!mainFn)
      scrapRuntimeError("Missing program entry point (main function)")

    for (const instruction of mainFn.getBody) {
      interpreter.computeInstruction(instruction, mainFn.getScope)
    }
  }
}
