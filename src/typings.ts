export type Undefinedable<T> = T | undefined

/**
 * Represents a chainable environment for symbol resolution.
 * Typically used for nested scopes like modules, classes, or functions.
 *
 * @template T The type of the parent context.
 * @template S The type of the values stored in the context.
 */
export interface Chain<T, S> {
  /** Optional reference to the parent context in the chain. */
  parent?: T

  /** Internal storage for symbol bindings in this context. */
  storage: Map<string, S>

  /**
   * Stores a new symbol in the current context.
   *
   * @param symbol The name of the symbol to store.
   * @param value The metadata or value associated with the symbol.
   * @returns `true` if the symbol was successfully stored; `false` if it already exists.
   */
  set(symbol: string, value: S): boolean

  /**
   * Retrieves the value of a symbol from the current or parent contexts.
   *
   * @param symbol The name of the symbol to retrieve.
   * @returns The associated value if found; otherwise, `undefined`.
   */
  get(symbol: string): S | undefined

  /**
   * Checks if a symbol exists in the current or parent contexts.
   *
   * @param symbol The name of the symbol to check.
   * @returns `true` if the symbol exists; otherwise, `false`.
   */
  has(symbol: string): boolean
}
