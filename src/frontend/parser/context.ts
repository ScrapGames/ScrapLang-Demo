import type { Chain } from "@typings"

/**
 * Enum that defines the type of lexical context.
 * Used to distinguish between different semantic scopes.
 */
export enum ContextType {
  MODULE,
  CLASS,
  FUNCTION,
  BLOCK,
  EXPRESSION
}

/**
 * Interface describing the metadata associated with a symbol.
 */
export interface SymbolInfo {
  name: string,
  type: string
}

/**
 * Represents a semantic context in which symbols are declared and resolved.
 * Supports hierarchical lookup by chaining to a parent context.
 */
export default class Context implements Chain<Context, SymbolInfo> {
  parent?: Context
  storage: Map<string, SymbolInfo>

  /** The type of the current context (module, class, or function) */
  private type: ContextType

  /**
   * Creates a new context of a given type, optionally with a parent context.
   * @param type The kind of context to create
   * @param parent Optional parent context to enable chained lookup
   */
  public constructor(type: ContextType, parent?: Context) {
    this.parent = parent
    this.storage = new Map()
    this.type = type
  }

  /**
   * Declares a new symbol in the current context.
   * If the symbol already exists, it will not be overwritten.
   * @param symbol The name of the symbol
   * @param value The associated metadata for the symbol
   * @returns `true` if the symbol was added, `false` if it already exists
   */
  set(symbol: string, value: SymbolInfo): boolean {
    if (this.storage.has(symbol))
      return false

    return !!this.storage.set(symbol, value)
  }

  /**
   * Retrieves a symbol from the current context or recursively from its parent.
   * @param symbol The name of the symbol to retrieve
   * @returns The corresponding `SymbolInfo` if found, otherwise `undefined`
   */
  get(symbol: string): SymbolInfo | undefined {
    const ref = this.storage.get(symbol)
    if (ref)
      return ref

    return this.parent && this.parent.get(symbol)
  }

  /**
   * Checks whether a symbol exists in the current or any parent context.
   * @param symbol The name of the symbol to check
   * @returns `true` if the symbol exists, `false` otherwise
   */
  has(symbol: string): boolean {
    return !!this.get(symbol)
  }

  /** Sets the context type */
  public set Type(type: ContextType) { this.type = type }

  /** Gets the context type */
  public get Type() { return this.type }
}
