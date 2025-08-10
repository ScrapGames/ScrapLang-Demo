import type { Chain, Nameable } from "@typings"

export class Scope implements Chain<Scope, Nameable> {
  parent?: Scope
  storage: Map<string, Nameable>
  private owner: string

  public constructor(owner: string, parent?: Scope) {
    this.parent = parent
    this.storage = new Map()
    this.owner = owner
  }

  set(symbol: string, value: Nameable): boolean {
    if (this.storage.has(symbol))
      return false

    return !!this.storage.set(symbol, value)
  }

  /**
   * Gets the value stored in `this` scope or parents scopes of `this`
   * @param name Name of the variable (or entity)
   * @returns The variable, if has been stored using `addEntry`, undefined otherwise
   */
  get(name: string): Nameable | undefined {
    const ref = this.storage.get(name)
    if (ref)
      return ref

    return this.parent && this.parent.get(name)
  }

  /**
   * Checks that a variable exists in `this` object scope and superior scopes if exists
   * @param name Name of the variable, which is unique
   * @returns true, if was already registered, false in other case
   */
  has(name: string): boolean {
    return !!this.get(name)
  }

  public get Owner() { return this.owner }
}

/**
 * Creates a new empty `Scope` for the entitiy `belongsTo` parameter
 * @param belongsTo The entity which belongs the new Scope
 * @returns A new `Scope` where his `scopedEntities` Map is empty
 */
export function createEmptyScope(
  owner: string,
  parent?: Scope
): Scope {
  return new Scope(owner, parent)
}

