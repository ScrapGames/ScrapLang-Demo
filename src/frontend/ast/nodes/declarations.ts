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
import { ASTNode }           from "@frontend/ast/index.ts"
import { TType }             from "@frontend/ast/nodes/types.ts"
import { Statement }         from "@frontend/ast/nodes/statements.ts"
import { Expression }        from "@frontend/ast/nodes/expressions.ts"
import { FunctionSignature } from "@frontend/ast/nodes/functions.ts"

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
  From,
  Import,
  Export,
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
 * Represents an import declaration in the AST.
 * - `symbols`: list of symbols being imported or `*` for all.
 * - `name`: module name from which symbols are imported.
 */
export class Import extends Declaration {
  public constructor(
    public symbols: string[] | "*",
    public module: string,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Import, start, end)
  }
}

export class From extends Declaration {
  public constructor(
    public module: ImportMember,
    public imports: Import,
    start: Position, end: Position
  ) {
    super(DeclarationKind.From, start, end)
  }
}

export class Variable extends NamedDeclaration {
  public constructor(
    public isConst: boolean,
    public name: string,
    public type: Maybe<TType>,
    public value: Maybe<Expression>,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Variable, start, end)
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
