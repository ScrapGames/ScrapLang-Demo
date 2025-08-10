import { Scope } from "../../engine/scope.ts"
import { ExpressionNode } from "@ast/ast.ts"

import type {
  Nameable,
  Primitive, IScrapParam,
  Instruction, Formattable,
  Nullable
} from "@typings"
import { ScrapObjectProperty } from "@lang/elements/typings.ts";

export class ScrapValue implements Formattable {
  protected value: unknown

  public constructor(value: unknown) {
      this.value = value
  }

  public get Value() { return this.value }
  public format() { return String(this.value) }
}

export class ScrapPrimitive extends ScrapValue {    
  public constructor(value: Primitive) {
    super(value)
  }

  public override get Value() { return this.value as Primitive }
}

/**
 * Represents a code entity that can handle / contain blocks of code, it can be:
 *  - Class
 *  - Module
 *  - Variable (or constant) declaration
 */
export class ScrapStatement {}

/**
 * Represent a literal object expression. Which is a way to write objects in a literal way assigning value to keys
 * 
 * @example
 * const myObject = {
 *  a: 10,
 *  b: 20,
 *  c: "Hello, World!"
 * }
 */
export class ScrapObject extends ScrapValue {
  public prototype: Nullable<ScrapObject>

  public constructor(prototype: Nullable<ScrapObject>, entries: Map<string, ScrapObjectProperty>) {
    super(entries)
    this.prototype = prototype
  }

  /**
   * Gets the value which is prop of `this` ScrapObject
   * @param name 
   * @returns 
   */
  public get(name: string): ScrapValue {
    const prop = this.Value.get(name)
    return prop ? prop.value : new ScrapValue(undefined)
  }

  /**
   * 
   * @param key 
   * @param value 
   */
  public set(key: string, value: ScrapObjectProperty) {
    this.Value.set(key, value)
  }

  /**
   * Checks if an object has `name` property
   * @param name Name of the searched property
   * @returns 
   */
  public has(name: string): boolean {
    return this.Value.has(name)
  }

  public index(item: string): ScrapValue {
    return this.get(item)
  }

  public override get Value() { return this.value as Map<string, ScrapObjectProperty> }

  private formatObject(deep: number = 0) {
    const arr = Array.from(this.value as Map<string, ScrapObjectProperty>)
    const isMultiline = arr.length > 2
    let str = isMultiline ? "{\n" : "{"

    for (const [idx, [k, v]] of arr.entries()) {
      const stringWithDeep = v instanceof ScrapObject ? v instanceof ScrapFunction ? v.format() : v.formatObject(deep + 1) : v.value.format()
      const formatedString = `${" ".repeat(deep)} ${k}: ${stringWithDeep}`

      if ((idx + 1) === arr.length)
        str += `${formatedString} `
      else {
        isMultiline
          ? str += `${formatedString},\n`
          : str += `${formatedString},`
      }
    }

    return str += `${isMultiline ? "\n" : " ".repeat(deep)}}`
  }

  public override format() { return this.formatObject() }
}

/**
 * Represent a function value or declaration.
 * 
 * A function can be used as a value. This means that can be assigned to a variable.
 * In this way is easier to declare lambda expressions and pass functions as parameters
 * 
 * @example
 * fn myFunction() {}
 * 
 * const myFunctionInVariable = myFunction
 */
export class ScrapFunction extends ScrapObject implements Nameable {
  name: string

  public constructor(name: string) {
    super(null, new Map())
    this.name = name
  }
}

export class ScrapDefinedFn extends ScrapFunction {
  private scope: Scope
  private params: IScrapParam[]
  private ret: ExpressionNode
  private body: Instruction[]

  public constructor(
      name: string, scope: Scope, params: IScrapParam[],
      body: Instruction[], ret: ExpressionNode
  ) {
      super(name)
      this.scope = scope
      this.params = params
      this.body = body
      this.ret = ret
  }

  public get Scope()  { return this.scope }
  public get Params() { return this.params }
  public get Body()   { return this.body }
  public get Ret()    { return this.ret }

  public override format() { return `fn ${this.name}(${this.params.length} params) []` }
}

/**
 * Represents a predefined functions which has been embbeded
 * using `TypeScript` directly into the language engine
 */
export class ScrapNativeFn extends ScrapFunction {
    private action: (...args: ScrapValue[]) => ScrapValue
    private argsCount: number | undefined

    // if `argsCount` is setted to `undefined`, then the number of args is _variable_
    // which means and undefined number of arguments
    public constructor(
      name: string,
      argsCount: number | undefined,
      action: (...args: ScrapValue[]) => ScrapValue
    ) {
      super(name)
      this.argsCount = argsCount
      this.action = action
    }

    public get getArgsCount() { return this.argsCount }
    public get Action() { return this.action }
    public override format() { return `fn ${this.name}(${this.argsCount ? this.argsCount : "..."}) [ native code ]` }
}
