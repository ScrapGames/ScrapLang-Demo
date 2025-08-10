import { Scope } from "../../../engine/scope.ts"
import { ScrapStatement } from "@lang/elements/commons.ts"

import type { Nameable } from "@typings"

/**
 * Represents a Module. Which is block which contains multiple entities that can be accessed via his accessor token `::`.
 *
 * Only the entity members that was declared with `export` keywords can be accessed outside a module.
 *
 * @example
 *
 * module MyModule {
 *  export const PI = 3.14
 *
 *  const privateConstant = PI * 20
 * }
 *
 * MyModule::PI // correct syntax, PI constant has been exported
 *
 * MyModule::privateConstant // error: privateConstant is not exported from his module. Is only accessible inside the module it has been declared
 */
export class ScrapModule extends ScrapStatement implements Nameable {
  name: string
  private scope: Scope
  private exports: Map<string, Nameable>

  public constructor(name: string, scope?: Scope) {
    super()
    this.name = name
    this.scope = scope ?? new Scope(null, name)
    this.exports = new Map()
  }

  /**
   * Stores a nameable statement in `this` scope
   * @param value The nameable statement to be stored
   */
  public insert(value: Nameable, exports: boolean = false): boolean {
    if (this.scope.has(value.name)) return false

    this.scope.set(value.name, value)
    if (exports) this.exports.set(value.name, value)

    return true
  }

  public has(name: string): boolean {
    return this.scope.has(name)
  }

  /**
   * Checks if an entity exists in `this` scope
   * @param name of searched entity
   * @returns a reference to the searched entity if exists, `undefined` in other way
   */
  public get(name: string): Nameable | undefined {
    return this.scope.get(name)
  }

  public get Scope()   { return this.scope }
  public get Exports() { return this.exports }
}
