import { ASTNode } from "@frontend/ast/ast.ts"
import { Expression } from "@frontend/ast/nodes/expressions.ts"
import type { Position } from "@frontend/typings.ts"

/**
 * Enumeration representing different kinds of declarations.
 */
export enum DeclarationKind {
  Module,
  Class,
  Function,
  Variable,
  Interface,
  Type
}

/**
 * Flags that can be applied to function declarations.
 */
export type FunctionFlags = | "inline" | "async"

/**
 * Represents a generic declaration node in the AST.
 * Serves as a base class for more specific declaration types.
 */
export class Declaration extends ASTNode {
  public kind: DeclarationKind
  public name: string

  /**
   * Creates a new Declaration instance.
   * @param kind - The kind of the declaration (e.g., Function, Variable).
   * @param name - The identifier name of the declaration.
   * @param position - The source code position of the declaration.
   */
  public constructor(kind: DeclarationKind, name: string, position: Position) {
    super(position)
    this.name = name
    this.kind = kind
  }
}

/**
 * Represents a function declaration in the AST.
 * Includes function name, flags, and its position in the source.
 */
export class Function extends Declaration {
  private flags: Map<FunctionFlags, boolean>
  private params: any[]
  private body: ASTNode[]

  /**
   * Creates a new FunctionStmtNode instance.
   * @param name - The name of the function.
   * @param flags - A map of flags applied to this function.
   * @param position - The source code position of the function.
   * @param body - The function instructions
   */
  public constructor(name: string, flags: Map<FunctionFlags, boolean>, position: Position, params: any[], body: ASTNode[]) {
    super(DeclarationKind.Function, name, position)
    this.flags = flags
    this.body = body
  }

  /**
   * Returns the flags set on the function.
   */
  public get Flags() { return this.flags }

  /**
   * Returns the body 
   */
  public get Body() { return this.body }
}

/**
 * Represents a variable declaration in the AST.
 * Stores whether it's constant and its assigned value.
 */
export class Variable extends Declaration {
  private isConst: boolean
  private value: Expression

  /**
   * Creates a new VariableNode instance.
   * @param name - The variable name.
   * @param isConst - Whether the variable is declared as a constant.
   * @param value - The expression assigned to the variable.
   * @param pos - The position in the source code.
   */
  public constructor(name: string, isConst: boolean, value: Expression, pos: Position) {
    super(DeclarationKind.Variable, name, pos)
    this.isConst = isConst
    this.value = value
  }

  /**
   * Returns whether the variable is constant.
   */
  public get IsConst() { return this.isConst }

  /**
   * Returns the expression assigned to the variable.
   */
  public get Value() { return this.value }
}

/**
 * Represents a module declaration.
 * Modules can contain other declarations (classes, functions, etc.).
 */
export class Module extends Declaration {
  private body: Declaration[]

  /**
   * Creates a new ModuleNode instance.
   * @param name - The module's name.
   * @param body - The list of declarations contained in the module.
   * @param pos - The position in the source code.
   */
  public constructor(name: string, body: Declaration[], pos: Position) {
    super(DeclarationKind.Module, name, pos)
    this.body = body
  }

  /**
   * Returns the list of declarations in the module.
   */
  public get Body() { return this.body }
}

export class Class extends Declaration {
  private body: Declaration[]

  public constructor(name: string, body: Declaration[], pos: Position) {
    super(DeclarationKind.Class, name, pos)
    this.body = body
  }

  /**
   * Returns the list of declarations in the class.
   */
  public get Body() { return this.body }
}

export class Interface extends Declaration {

  public constructor(name: string, pos: Position) {
    super(DeclarationKind.Interface, name, pos)
  }

}

export class Type extends Declaration {
  
  public constructor(name: string, pos: Position) {
    super(DeclarationKind.Type, name, pos)
  }

}
