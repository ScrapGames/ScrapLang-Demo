/**
 * AST Nodes: Statements
 *
 * This file defines the various *statements* in the Abstract Syntax Tree (AST).
 *
 * Statements represent executable units in the program: they control the flow,
 * declare constructs, or wrap expressions. Unlike expressions, statements do
 * not evaluate directly to a value (though some, like `return`, can produce one).
 *
 * This module includes standard control-flow structures (conditionals, loops),
 * declaration wrappers, and a custom language extension called `dissipate`,
 * inspired by Go's `defer`. `dissipate` ensures that a function or expression
 * is executed when the current function exits, regardless of whether it exits
 * normally or due to an error.
 */

import { Position }       from "@frontend/position.ts"
import { ASTNode }        from "@frontend/ast/ast.ts"
import { ExpressionNode } from "@frontend/ast/nodes/expressions.ts"
import { DeclarationNode, Function as FunctionDecl, Variable } from "@frontend/ast/nodes/declarations.ts"

/**
 * Enumeration of all statement kinds supported by the language.
 */
export enum StatementKind {
  Return,
  Export,
  Import,
  If,
  For,
  ForIn,
  ForOf,
  While,
  DoWhile,
  Dissipate,
  Declaration,
  Expression,
  Case,
  Default
}

/**
 * Base interface for all AST statements.
 */
export interface Statement {
  kind: StatementKind
}

/**
 * Abstract base class for all statement nodes.
 * Stores the kind of statement and its position in the source code.
 */
export class StatementNode extends ASTNode implements Statement {
  public constructor(public kind: StatementKind, start: Position, end: Position) {
    super(start, end)
    this.kind = kind
  }
}

/**
 * Represents an `if` conditional statement.
 */
export class If extends StatementNode {
  public constructor(public expr: ExpressionNode, public body: Statement[], start: Position, end: Position) {
    super(StatementKind.If, start, end)
  }
}

/**
 * Represents a `while` loop.
 */
export class While extends StatementNode {
  public constructor(public expr: ExpressionNode, public body: Statement[], start: Position, end: Position) {
    super(StatementKind.While, start, end)
  }
}

/**
 * Represents a `do...while` loop.
 */
export class DoWhile extends StatementNode {
  public constructor(public expr: ExpressionNode, public body: Statement[], start: Position, end: Position) {
    super(StatementKind.DoWhile, start, end)
  }
}

/**
 * Represents a `for(init; condition; increment)` loop.
 */
export class For extends StatementNode {
  public constructor(
    public decl: Variable[],         // Initialization variables
    public expr: ExpressionNode,     // Loop condition
    public inc: ExpressionNode,      // Increment expression
    public body: Statement[],        // Loop body
    start: Position, end: Position
  ) {
    super(StatementKind.For, start, end)
  }
}

/**
 * Represents a `for...in` loop.
 * Iterates over the keys of an object.
 */
export class ForIn extends StatementNode {
  public constructor(
    public decl: Variable,
    public subject: ExpressionNode,
    public body: Statement[],
    start: Position, end: Position
  ) {
    super(StatementKind.ForIn, start, end)
  }
}

/**
 * Represents a `for...of` loop.
 * Iterates over the values of an iterable.
 */
export class ForOf extends StatementNode {
  public constructor(
    public decl: Variable,
    public subject: ExpressionNode,
    public body: Statement[],
    start: Position, end: Position
  ) {
    super(StatementKind.ForOf, start, end)
  }
}

/**
 * Represents a `default` block inside a `switch` statement.
 */
export class Default extends StatementNode {
  public constructor(public body: Statement[], start: Position, end: Position) {
    super(StatementKind.Default, start, end)
  }
}

/**
 * Represents a `case` block inside a `switch` statement.
 */
export class Case extends StatementNode {
  public constructor(public expr: ExpressionNode, public body: Statement[], start: Position, end: Position) {
    super(StatementKind.Case, start, end)
  }
}

/**
 * Represents a declaration used as a statement
 * (e.g., variable, function, or class declaration).
 */
export class DeclarationStmt extends StatementNode {
  public constructor(public declaration: DeclarationNode, start: Position, end: Position) {
    super(StatementKind.Declaration, start, end)
  }
}

/**
 * Represents an expression used as a statement
 * (e.g., a function call).
 */
export class ExpressionStmt extends StatementNode {
  public constructor(public expr: ExpressionNode, start: Position, end: Position) {
    super(StatementKind.Expression, start, end)
  }
}

/**
 * Represents the `dissipate` statement.
 *
 * `dissipate` schedules the execution of a function or expression when the
 * current function returns or crashes, ensuring cleanup or deferred behavior.
 */
export class Dissipate extends StatementNode {
  public constructor(public fn: FunctionDecl | ExpressionNode, start: Position, end: Position) {
    super(StatementKind.Dissipate, start, end)
  }
}

/**
 * Represents the `return` statement.
 * Returns a value from the current function.
 */
export class Return extends StatementNode {
  public constructor(public value: ExpressionNode, start: Position, end: Position) {
    super(StatementKind.Return, start, end)
    this.value = value
  }
}
