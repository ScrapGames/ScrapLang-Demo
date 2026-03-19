/**
 * AST Nodes for Declarations
 *
 * This file defines the abstract syntax tree (AST) representation for declarations
 * in the language. Declarations include variables, functions, modules, classes,
 * interfaces, types, and enums. Each declaration type has its own class extending
 * `DeclarationNode`, which provides the common structure for all declarations.
 */

import type { Maybe }         from "@/typings.ts"
import { Tokens as _ }        from "@frontend/tokens/tokens.ts"
import { Position }           from "@frontend/position.ts"
import { Statement }          from "@frontend/ast/statements.ts"
import { Expression }         from "@frontend/ast/expressions.ts"
import { TType, GenericList } from "@frontend/ast/types.ts"
import { ASTNode, FunctionParamList } from "@frontend/ast/commons.ts"

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
    public value: Maybe<Expression>,
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
    public name: string,
    public generics: Maybe<GenericList>,
    public param: FunctionParamList,
    public ret: Maybe<TType>,
    public body: Statement[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Function, start, end)
  }

}

export class Extern extends NamedDeclaration {
  public constructor(
    public name:  string,
    public param: FunctionParamList,
    public ret:   TType,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Extern, start, end)
  }
}

/**
 * * IMPORTANT ADVICE FOR CODE READERS :>
 * 
 * From now on, the file is "splited" and the next AST nodes
 * represents declarations and other nodes, which are
 * parts of these declarations, each 'section' of those nodes and its parts
 * are splited by a comment like this: /--- ======= FOO NODES ======= ---/
 */

/*** ======= IMPORT NODES ======= ***/

export class ImportMember extends ASTNode {
  public constructor(
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class ImportSymbol extends ImportMember {
  public constructor(
    public mod: Maybe<ImportMember>,
    public symbol: string,
    public alias: Maybe<string>,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class ImportList extends ImportMember {
  public constructor(
    public mod: Maybe<ImportMember>,
    public list: ImportMember[],
    start: Position, end: Position
  ) {
    super(start, end)
  }
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
    start: Position, end: Position
  ) {
    super(DeclarationKind.Import, start, end)
  }
}

/*** ======= MODULE NODES ======= ***/

export class ModuleMember extends ASTNode {
  public constructor(
    public exported: boolean,
    public member: NamedDeclaration,
    start: Position, end: Position
  ) {
    super(start, end)
  }
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

/*** ======= CLASS NODES ======= ***/

/**
 * Represents a declaration inside a {@link Class|class} body
 * 
 * Despite a class member can only be a {@link Function|function}, a {@link Variable|variable} or a {@link Constant|constant}.
 * It inherints from {@link ASTNode} to preserve a inherarchy and a structure along the entire AST
 */
export class ClassMember extends ASTNode {
  public constructor(
    public exposed: Maybe<boolean>, // stands for "pub" indicating the member is public or not
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class ClassMethod extends ClassMember {
  public constructor(
    exposed: Maybe<boolean>,
    public name: string,
    public generics: Maybe<GenericList>,
    public params: FunctionParamList,
    public ret: Maybe<TType>,
    public body: Statement[],
    start: Position, end: Position
  ) {
    super(exposed, start, end)
  }
}

export class ClassProperty extends ClassMember {
  public constructor(
    exposed: Maybe<boolean>,
    public name: string,
    public type: Maybe<TType>,
    public value: Maybe<Expression>, // The value of a property may be declared after in the constructor
    start: Position, end: Position
  ) {
    super(exposed, start, end)
  }
}

/**
 * Represents a class declaration in the AST.
 * - `body`: list of member declarations (methods, properties, etc.).
 */
export class Class extends NamedDeclaration {
  public constructor(
    public name: string,
    public generics: Maybe<GenericList>,
    public inherits: Maybe<TType>,
    public body:     ClassMember[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Class, start, end)
  }
}

export class EnumMember extends ASTNode {
  public constructor(
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class EnumSymbol extends EnumMember {
  public constructor(
    public symbol: string,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

/**
 * A `enum` is a declaration with a body delimited by {@link _.LBRACE|open curly brace} and {@link _.RBRACE|close curly brace}
 * which can contains none or many {@link EnumMember|members} each of them separated by {@link _.COMMA|commas}
 */
export class Enum extends NamedDeclaration {
  public constructor(
    public name: string,
    public body: EnumMember[],
    start: Position, end: Position
  ) {
    super(DeclarationKind.Enum, start, end)
  }
}

/*** ======= INTERFACE NODES ======= ***/

export class InterfaceMember extends ASTNode {
  public constructor(
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class InterfaceMethod extends InterfaceMember {
  public constructor(
    public name: string,
    public generics: Maybe<GenericList>,
    public params: FunctionParamList,
    public ret: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

export class InterfaceProperty extends InterfaceMember {
  public constructor(
    public name: string,
    public ret: TType,
    start: Position, end: Position
  ) {
    super(start, end)
  }
}

/**
 * Represents an interface declaration in the AST.
 * - `body`: list of member declarations defining the contract of the interface.
 */
export class Interface extends NamedDeclaration {
  public constructor(
    public name:     string,
    public generics: Maybe<GenericList>,
    public inherits: Maybe<TType>,
    public body:     InterfaceMember[],
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
    public generics: Maybe<GenericList>,
    public type:     TType,
    start: Position, end: Position
  ) {
    super(DeclarationKind.Type, start, end)
  }
}
