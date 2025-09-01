/**
 * AST Nodes for Declarations
 *
 * This file defines the abstract syntax tree (AST) representation for declarations
 * in the language. Declarations include variables, functions, modules, classes,
 * interfaces, types, and enums. Each declaration type has its own class extending
 * `DeclarationNode`, which provides the common structure for all declarations.
 */

import { Undefinedable } from "@/typings.ts"
import { Position }      from "@frontend/position.ts"
import { ASTNode }       from "@frontend/ast/ast.ts"
import { Expression }    from "@frontend/ast/nodes/expressions.ts"
import { Statement }     from "@frontend/ast/nodes/statements.ts"
import { FunctionFlags, Param } from "@frontend/ast/nodes/unclassified.ts"

/**
 * Enumeration representing different kinds of declarations.
 */
export enum DeclarationKind {
  Module,
  Class,
  Function,
  Variable,
  Interface,
  Type,
  Enum,
  Import,
  Export
}

/**
 * Base interface for any declaration node.
 */
export interface Declaration {
  kind: DeclarationKind
}

/**
 * Base class for all declarations in the AST.
 * Stores the `kind` of declaration, its name, and source code positions.
 */
export class DeclarationNode extends ASTNode implements Declaration {
  public constructor(
    public kind: DeclarationKind, public name: string,
    start: Position, end: Position
  ) {
    super(start, end)
    this.kind = kind
  }
}

/**
 * Represents an import declaration in the AST.
 * - `symbols`: list of symbols being imported or `*` for all.
 * - `name`: module name from which symbols are imported.
 */
export class Import extends DeclarationNode {
  public constructor(
    public symbols: string[] | "*",
    name: string,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Import, name, start, end)
  }
}

/**
 * Represents a variable declaration in the AST.
 * - `isConst`: whether the variable is declared as a constant.
 * - `value`: the assigned expression value.
 */
export class Variable extends DeclarationNode {
  public constructor(
    name: string, public isConst: boolean, public value: Expression,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Variable, name, start, end)
  }
}

/**
 * Represents a function declaration in the AST.
 * - `params`: function parameters.
 * - `body`: list of statements forming the function body.
 */
export class Function extends DeclarationNode {
  public constructor(
    public params: Param[], public body: Statement[],
    public flag: Undefinedable<FunctionFlags>, name: string,
    start: Position, end: Position,
  ) {
    super(DeclarationKind.Function, name, start, end)
  }
}

/**
 * Represents a module declaration in the AST.
 * A module groups together other declarations such as classes, functions, or variables.
 */
export class Module extends DeclarationNode {
  public constructor(
    public body: Declaration[], name: string,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Module, name, start, end)
  }
}

/**
 * Represents a generic class-like declaration.
 * Used as a base for more specific class-related declarations.
 */
export class ClassDeclaration extends DeclarationNode {
  public constructor(kind: DeclarationKind, name: string, start: Position, end: Position) {
    super(kind, name, start, end)
  }
}

/**
 * Represents a class declaration in the AST.
 * - `body`: list of member declarations (methods, properties, etc.).
 */
export class Class extends DeclarationNode {
  public constructor(public body: Declaration[], name: string, start: Position, end: Position) {
    super(DeclarationKind.Class, name, start, end)
  }
}

/**
 * Represents an interface declaration in the AST.
 * - `body`: list of member declarations defining the contract of the interface.
 */
export class Interface extends DeclarationNode {
  public constructor(public body: Declaration[], name: string, start: Position, end: Position) {
    super(DeclarationKind.Interface, name, start, end)
  }
}

/**
 * Represents a type alias declaration in the AST.
 * Currently only stores the alias name.
 */
export class Type extends DeclarationNode {
  public constructor(name: string, start: Position, end: Position) {
    super(DeclarationKind.Type, name, start, end)
  }
}
