import { Tokens } from "../../frontend/tokens/tokens.ts"
import Parser, { MixedParser } from "../../frontend/parser/base.ts"

import * as mods from "./evaluators/modules.ts"
import * as fns from "./evaluators/functions.ts"
import * as vars from "./evaluators/variables.ts"
import * as objs from "./evaluators/objects.ts"
import * as ctrls from "./evaluators/controls.ts"

import { DeclarationNode, ExpressionNode } from "@ast/ast.ts"
import {
  CallNode,
  LiteralObjectNode,
  ArrayNode,
  IdentifierNode,
  BinaryExprNode,
  UnaryExprNode
} from "@ast/nodes.ts"

import { RuntimeError } from "@lang/lang-errors.ts"
import { Scope, UndefinedReferenceError } from "../scope.ts"

import {
  ScrapValue,
  ScrapNativeFn,
  ScrapDefinedFn,
  ScrapStatement,
  ScrapFunction
} from "@lang/elements/commons.ts"

// entities
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"

// values
import { ScrapArray } from "@lang/elements/values/array.ts"
import { ScrapTrue } from "@lang/elements/values/booleans.ts"
import { ScrapFalse } from "@lang/elements/values/booleans.ts"
import { ScrapChar, ScrapString } from "@lang/elements/values/textuals.ts"
import { ScrapFloat, ScrapInteger } from "@lang/elements/values/numerics.ts"

import { VERSION } from "@scrap"
import type { Nameable, Exportable, Instruction, IScrapParam, Nullable } from "@typings"
import { getDefaultMetaproperties } from "@utils";

/**
 * Causes the program stop by a undefined referenced
 */
export function scrapReferenceError(parser: Parser): never {
  throw new UndefinedReferenceError(parser.currentTok)
}

export function addToScope(entity: Nameable & Exportable, scope: Scope) {
  if (!scope.set(entity.name, entity))
    scrapRuntimeError(`'${entity.name}' is already defined at '${scope.Owner}'`)

  return entity
}

/**
 * Causese the program to stop cause an error at runtime
 * @param message Informational error message that will be printed in the console
 */
export function scrapRuntimeError(message: string): never {
  throw new RuntimeError(message)
}

export class ExecutionContext {
  fn: Nullable<ScrapFunction>
  isRunning = true
  scope: Scope

  public constructor(fn: Nullable<ScrapFunction>, scope: Scope) {
    this.fn = fn
    this.scope = scope
  }

  public free() {
    this.scope.clean()
  }

  public resume() {
    this.isRunning = true
  }

  public suspend() {
    this.isRunning = false
  }
}

/**
 * The ScrapLang interpreter
 */
export class Interpreter {
  parser: Parser

  public constructor(parser: Parser) {
    this.parser = parser


  }

  private computeRestParameters(callee: ScrapDefinedFn, calleerScope: Scope, params: IScrapParam[], args: ExpressionNode[]) {
    const restIdx = params.length - 1
    const slicedParams = params.slice(0, restIdx)
    const slicedArgs = args.slice(0, restIdx)

    if (slicedArgs.length !== slicedParams.length)
      scrapRuntimeError(`'${callee.name}' expects from ${slicedParams.length} to multiple arguments, but received ${slicedArgs.length}`)

    for (const i in slicedParams) {
      callee.Scope.set(
        params[i].pName,
        new ScrapVariable(false, params[i].pName, this.computeValue(slicedArgs[i], calleerScope), false)
      )
    }

    callee.Scope.set(
      params[params.length - 1].pName,
      new ScrapVariable(
        true, params[params.length - 1].pName,
        new ScrapArray(args.slice(restIdx, args.length).map(node => {
          return ({
            metaproperties: getDefaultMetaproperties(),
            value: this.computeValue(node, calleerScope)
          })
        })), false
      )
    )
  }

  private execDefinedFunc(call: CallNode, callee: ScrapDefinedFn, scope: Scope, calleerScope: Scope) {
    const params = callee.Params
    const args = call.getArgs

    console.log(callee)

    if (params.length > 0 && params[params.length - 1].isRest) {
      this.computeRestParameters(callee, calleerScope, params, args)
    } else {
      if (args.length !== params.length)
        scrapRuntimeError(`'${callee.name}' expects ${callee.Params.length} arguments, but received ${call.getArgs.length}`)

      for (const i in callee.Params) {
        callee.Scope.set(
          params[i].pName,
          new ScrapVariable(false, params[i].pName, this.computeValue(args[i], calleerScope), false)
        )
      }
    }

    for (const instruction of callee.Body)
      this.computeInstruction(instruction, scope)

    const returnVal = callee.Value.isUndefined() ?
    new ScrapUndefined() :
    this.computeValue(callee.Value, scope)

    callee.Scope.clean() // cleanup the scope, freeing memory
    return returnVal
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
      // TODO: handle functions which have rest parameters
      if (callee.getArgsCount && call.getArgs.length !== callee.getArgsCount)
        scrapRuntimeError(`'${callee.name}' expects ${callee.getArgsCount} arguments, but ${call.getArgs.length} has been received`)

      return callee.Action(...call.getArgs.map(arg => this.computeValue(arg as ExpressionNode, scope)))
    }

    return this.execDefinedFunc(call, callee as ScrapDefinedFn, (callee as ScrapDefinedFn).Scope, scope)
  }

  public findCallee(call: CallNode, whereIsCallee: Scope) {
    const callee = whereIsCallee.get(call.getCallee) as (ScrapFunction | ScrapVariable) | undefined
    if (!callee)
      scrapReferenceError(this.parser)

    if (callee.isVariable()) {
      if (!callee.getVal.isDefinedFn())
        scrapRuntimeError(`The expression is not callable. '${call.getCallee}' doesn't contains values with call signatures`)
        // call signatures is the concept to call a identifier which can be called using `()`

      return callee.getVal
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
    const referred = searcher ? searcher(node.Symbol) : scope.get(node.Symbol) as (ScrapVariable | ScrapFunction) | undefined
    if (!referred)
      scrapReferenceError(this.parser)

    const storedValue = referred instanceof ScrapVariable ? referred.getVal : referred

    if (guards.isReference(storedValue))
      return storedValue.getReferencedVar.getVal
    else if (guards.isPrimitive(storedValue))
      return new ScrapValue(storedValue.getValue)
    else
      return storedValue
  }

  /**
   * Creates a ScrapObject from the items contained in `node`
   * @param node Object AST node, where the items are stored
   * @param scope Scope where the item pairs exists
   * @returns A new ScrapObject
   */
  private computeLitObj(node: LiteralObjectNode, scope: Scope): ScrapObject {
    const entries = (node as LiteralObjectNode).getEntries.entries()
    const mappedValues: Map<string, ScrapObjectProperty> = new Map()

    for (const entry of entries)
      mappedValues.set(
        entry[0], {
          metaproperties: getDefaultMetaproperties(),
          value: this.computeValue(entry[1], scope)
        }
      )

    return new ScrapObject(null, mappedValues)
  }

  /**
   * Creates a ScrapArray from the items contained in `node`
   * @param node Array AST node, where the items are stored
   * @param scope Scope where the items exists
   * @returns A new ScrapArray
   */
  private computeLitArr(node: ArrayNode<ExpressionNode>, scope: Scope): ScrapArray {
    return new ScrapArray(
      node.Array.map(item => ({
        metaproperties: getDefaultMetaproperties(),
        value: this.computeValue(item, scope)
      }))
    )
  }

  private computeBinExpr(lhs: ExpressionNode, rhs: ExpressionNode, operator: Tokens, scope: Scope) {
    const lhsVal = this.computeValue(lhs, scope)
    const rhsVal = this.computeValue(rhs, scope)

    switch (operator) {
      case Tokens.IN:
      case Tokens.AND:
      case Tokens.OR:
      case Tokens.INSTANCEOF:
      case Tokens.AS:
      case Tokens.PLUS:
      case Tokens.MINUS:
      case Tokens.STAR:
      case Tokens.SLASH:
      case Tokens.PERCEN:
      case Tokens.LESS:
      case Tokens.GREATER:
      case Tokens.DOT:
      case Tokens.LSQRBR:
      case Tokens.RSQRBR:
      case Tokens.LPAREN:
      case Tokens.RPAREN:
      case Tokens.AMPER:
      case Tokens.EQUAL:
      case Tokens.MOD_ACCESSOR:
      case Tokens.LESS_EQUAL:
      case Tokens.GREAT_EQUAL:
      case Tokens.EQUALS:
      case Tokens.NOT_EQUALS:
      case Tokens.ADD_ASSIGN:
      case Tokens.MINUS_ASSIGN:
      case Tokens.MULT_ASSIGN:
      case Tokens.DIV_ASSIGN:
      case Tokens.MOD_ASSIGN:
    }
  }

  private computeUnaryExpr(lhs: UnaryExprNode, scope: Scope): ScrapValue {

  }

  public resolveBinaryExpr(node: BinaryExprNode, scope: Scope): ScrapValue {
    const operator = node.getOperator
    const lhs = this.computeValue(node.getLHS, scope)
    const rhs = this.computeValue(node.getRHS, scope)

    switch (operator) {
      case '=': return new ScrapValue(lhs.Value === rhs.Value)
      case '+':  return new ScrapValue(lhs.Value + rhs.Value)
      case "and":  return lhs.Value && rhs.Value ? new ScrapTrue() : new ScrapFalse()
      case "or": return lhs.Value as boolean || rhs.Value as boolean
    }

    scrapRuntimeError("BRUH por arreglar")
  }

  /**
   * Returns a ScrapValue based on `node.kind`
   * @param node Node containing the value of the new ScrapValue
   * @param scope Scope where the data of some nodes, like 'identifiers' can be founded
   * @returns A new ScrapValue based on the received `node`
   */
  public computeValue(node: ExpressionNode, scope: Scope): ScrapValue {
    // switch statement is weird af using type guards, add match to js pls :)
    if (node.isFunctionExpr())       return fns.computeFn(this, node, scope)
    if (node.isReassignment())      return vars.computeReassignment(this, node, scope)
    if (node.isModuleAccess())      return mods.evalModuleAccess(this, node, scope)
    if (node.isObjectDestruction()) return objs.computeObjectDestruction(this, node, scope)
    if (node.isObjectAccess())      return objs.computeObjectAccess(this, node, scope)
    if (node.isBinaryExpr())        return this.resolveBinaryExpr(node, scope)
    if (node.isUnaryExpr())         return this.computeUnaryExpr(node, scope)
    if (node.isCall())              return this.computeCall(node, scope)
    if (node.isIdentifier())        return this.computeIdentifier(node, scope)
    if (node.isLiteralObject())     return this.computeLitObj(node, scope)
    if (node.isLiteralArray())      return this.computeLitArr(node, scope)
    if (node.isString())            return new ScrapString(node.getValue)
    if (node.isNumeric())           return new ScrapInteger(node.getValue)
    if (node.isFloat())             return new ScrapFloat(node.getValue)
    if (node.isChar())              return new ScrapChar(node.getValue)

    scrapRuntimeError(`ScrapLang ${VERSION} still doesn't support '${node.constructor.name}' interpreting`)
  }

  /**
   * Returns a ScrapEntity based on `node.kind`
   * @param node Node who contains the data of the entity, like: function body, module exports, etc
   * @param scope Scope where the declared entites on each entity will be stored
   * @returns A new ScrapEntity containing the data stored at `node`
   */
  public computeEntity(node: DeclarationNode, scope: Scope): ScrapStatement {
    if (node.isFunctionStmt()) return fns.computeFn(node, scope)
    if (node.isModule())       return mods.evalModuleStmt(this, node, scope)
    if (node.isVariable())     return vars.computeVar(this, node, scope)

    scrapRuntimeError(`ScrapLang ${VERSION} still doesn't support '${node.constructor.name}' interpreting`)
  }

  public computeControl(node: ControlStmtNode, scope: Scope) {
    if (node.isIf()) ctrls.computeIf(this, node, scope)
  }

  /**
   * Resolve the type of node of a function body
   * 
   * Since functions can contains both some specific nodes, inherited from ASTEntityNode and ASTValueNode
   * @param node Node of instruction type, they can be: FunctionNode | CallNode | ReassignmentNode | VariableNode
   * @param fnScope Scope of the function to execute
   */
  public computeInstruction(node: Instruction, fnScope: Scope) {
    if (node instanceof ExpressionNode)
      this.computeValue(node, fnScope)
    else if (node instanceof ControlStmtNode) {
      if (node.isIf()) ctrls.computeIf(this, node, fnScope)
    } else
      // at this point, the value of `node` is an instance of `ASTEntityNode`
      addToScope(this.computeEntity(node as DeclarationNode, fnScope), fnScope)
  }

  /**
   * Inits the Interpreter and execute the contents in the AST
   * @param parser A parser instance
   * @param mainMod Module of the entry point file
   */
  public static run(parser: MixedParser, mainMod: ScrapModule, std: ScrapModule) {
    const interpreter = new this(parser)

    while (!parser.HasEnd) {
      const parsedEntity = parser.parseStatement()
      const computedEntity = interpreter.computeEntity(parsedEntity, mainMod.Scope)
      mainMod.insert(computedEntity.name, computedEntity)
    }

    const mainFn = mainMod.get("main") as ScrapDefinedFn | undefined
    if (!mainFn)
      scrapRuntimeError("Missing program entry point (main function)")

    const scrapArgs = new ScrapArray(Deno.args.slice(1).map(arg => ({
      metaproperties: getDefaultMetaproperties(),
      value: new ScrapString(arg)
    })));

    std.insert("args", new ScrapVariable(true, "args", scrapArgs, true))
    interpreter.execDefinedFunc(new CallNode(new IdentifierNode("main"), []), mainFn, mainFn.Scope, mainMod.Scope)
  }
}
