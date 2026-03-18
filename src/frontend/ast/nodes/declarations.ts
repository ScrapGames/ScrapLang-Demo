/**
 * AST Nodes for Declarations
 *
 * This file defines the abstract syntax tree (AST) representation for declarations
 * in the language. Declarations include variables, functions, modules, classes,
 * interfaces, types, and enums. Each declaration type has its own class extending
 * `DeclarationNode`, which provides the common structure for all declarations.
 */

import { Maybe }             from "@/typings.ts"
import { Position }          from "@frontend/position.ts"
import { ASTNode }           from "@frontend/ast/ast.ts"
import { TType }             from "@frontend/ast/nodes/types.ts"
import { Statement }         from "@frontend/ast/nodes/statements.ts"
import { Expression }        from "@frontend/ast/nodes/expressions.ts"
import { FunctionSignature } from "@frontend/ast/nodes/functions.ts"
import { ImportMember }      from "@frontend/ast/nodes/imports.ts"

/**
 * Enumeration representing different kinds of declarations.
 */
export enum DeclarationKind {
  Module,
  Class,
  Function,
  Variable,
  Constant,
  Static,
  Interface,
  Type,
  Enum,
  Import,
  Extern
}

/**
 * Base class for all declarations in the AST.
 * Stores the `kind` of declaration, its name, and source code positions.
 */
export class Declaration extends ASTNode {
  public constructor(
    public kind: DeclarationKind,
    start: Position, end: Position
  ) {
    super(start, end)
    this.kind = kind
  }
}

export abstract class NamedDeclaration extends Declaration {
  public constructor(
    kind: DeclarationKind, start: Position, end: Position
  ) {
    super(kind, start, end)
  }

  abstract get name(): string
}

/**
 * Represents an import declaration in the ast
 * 
 * An import declaration is used to make symbols from other module available in the module
 * which the import declaration was performed
 * 
 * An import declaration can be formed by a single symbol or by a list of them
 * @example
 * ```rust
 * // using single symbols
 * import Galua
 * import OtherModule
 * import std::fs
 * import std::fs::File
 * import std::fs::Directory
 * 
 * // using list of symbols
 * import ::{ Galua, OtherModule }
 * import { Galua, OtherModule, std::fs }
 * import {
 *  Galua,
 *  OtherModule
 *  std::fs::{ File, Directory }
 * }
 * 
 * ```
 */
export class Import extends Declaration {
  public constructor(
    public member: ImportMember,
    start: Position,
    end: Position
  ) {
    super(DeclarationKind.Import, start, end)
  }
}

/**
 * # Represents a variable (or a constant) in the ast
 * 
 * A variable is a name which points to a value in memory
 * The pointed value can be _variable_ or constant
 * 
 * If is constant, the pointed value can not change.
 * However that does not mean that the pointed value is immutable.
 * If you search this behaviour use the `static` keyword
 * instead to declated a compile-time, immutable and unchangeable value; like this:
 * @example
 * ```rust
 * // ** compile-time, immutable and unchangeable value **
 * static name = "Raxabi"
 * name = "SuspiciousScrapper1" //! this will cause a compile-time error
 * 
 * name.concat(", is a spaniard developer") //! this will cause a compile-time error, because the pointed value is immutable
 * 
 * // ** unchangeable pointed value **
 * const name = "Raxabi"
 * name = "SuspiciousScrapper1" //! this will cause a compile-time exception
 * 
 * name.concat(", is a spaniard developer") // this is allowed, because the pointed value is mutable
 * 
 * // ** variable and mutable value **
 * var name = "Raxabi"
 * name = "SuspiciousScrapper1" // this is allowed, because the pointed value is changeable
 * 
 * name.concat(", is a unknown developer") // this is allowed, because the pointed value is mutable
 * 
 * ```
 */
export class Variable extends NamedDeclaration {
  public constructor(
    public name: string,
    public type: Maybe<TType>,
    public value: Maybe<Expression>,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Variable, start, end)
  }
}

export class Constant extends NamedDeclaration {
  public constructor(
    public name: string,
    public type: Maybe<TType>,
    public value: Expression,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Constant, start, end)
  }
}

export class Static extends NamedDeclaration {
  public constructor(
    public name: string,
    public type: Maybe<TType>,
    public value: Expression,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Static, start, end)
  }
}

export class Function extends NamedDeclaration {
  public constructor(
    public signature: FunctionSignature,
    public body: Statement[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Function, start, end)
  }

  public get name(): string { return this.signature.name! }
}

export class Extern extends NamedDeclaration {
  public constructor(
    public signature: FunctionSignature,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Extern, start, end)
  }

  public get name(): string { return this.signature.name! }
}

export class ModuleMember extends NamedDeclaration {
  public constructor(
    kind: DeclarationKind,
    public isExported: boolean,
    public member: NamedDeclaration,
    start: Position, end: Position
  ) {
    super(kind, start, end)
  }

  public override get name(): string { return this.member.name }
}

/**
 * Represents a module declaration in the AST.
 * A module groups together other declarations such as classes, functions, or variables.
 */
export class Module extends NamedDeclaration {
  public constructor(
    public name: string,
    public body: ModuleMember[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Module, start, end)
  }
}

/**
 * Represents a generic class-like declaration.
 * Used as a base for more specific class-related declarations.
 */
export class ClassMember extends NamedDeclaration {
  public constructor(
    kind: DeclarationKind,
    public isPub: boolean,
    public member: NamedDeclaration,
    start: Position, end: Position
  ) {
    super(kind, start, end)
  }

  public override get name(): string { return this.member.name }
}

/**
 * Represents a class declaration in the AST.
 * - `body`: list of member declarations (methods, properties, etc.).
 */
export class Class extends NamedDeclaration {
  public constructor(
    public name: string,
    public generics: Maybe<string[]>,
    public inherits: Maybe<TType>,
    public body:     ClassMember[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Class, start, end)
  }
}

export class InterfaceMember extends NamedDeclaration {
  public constructor(
    kind: DeclarationKind.Variable | DeclarationKind.Function,
    public member: Variable | Function,
    start: Position, end: Position
  ) {
    super(kind, start, end)
  }

  public override get name(): string { return this.member.name }
}

/**
 * Represents an interface declaration in the AST.
 * - `body`: list of member declarations defining the contract of the interface.
 */
export class Interface extends NamedDeclaration {
  public constructor(
    public name:     string,
    public generics: Maybe<string[]>,
    public inherits: Maybe<TType>,
    public body:     FunctionSignature[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Interface, start, end)
  }
}

/**
 * Represents a type alias declaration in the AST.
 * Currently only stores the alias name.
 */
export class Type extends NamedDeclaration {
  public constructor(
    public name:     string,
    public generics: Maybe<string[]>,
    public type:     TType,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Type, start, end)
  }
}
