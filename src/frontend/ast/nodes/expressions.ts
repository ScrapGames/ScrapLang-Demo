/**
 * AST Nodes for Expressions
 *
 * This file defines the abstract syntax tree (AST) representation for expressions
 * within the language. Each expression type (atomic value, identifier, string,
 * unary operation, binary operation, function definition, match expression,
 * function call, etc.) has its own class, all inheriting from `ExpressionNode`.
 *
 * These nodes are created during parsing and later used in semantic analysis,
 * interpretation or code generation.
 */

import { Maybe }    from "@/typings.ts"
import { Position } from "@frontend/position.ts"
import { Token }    from "@frontend/tokens/tokens.ts"
import { ASTNode }  from "@frontend/ast/ast.ts"
import { TType }    from "@frontend/ast/nodes/types.ts"
import { Case, Default, Statement } from "@frontend/ast/nodes/statements.ts"
import { FunctionSignature }        from "@frontend/ast/nodes/functions.ts"

/**
 * Enum that classifies the kind of expression represented by an `ExpressionNode`.
 */
export enum ExpressionKind {
  Number,
  Char,
  Identifier,
  String,
  Function,
  Unary,
  Binary,
  Match,
  Call
}

/**
 * Base class for all expressions in the AST.
 * Stores the `kind` of expression and the source code positions.
 */
export class Expression extends ASTNode {
  public constructor(public kind: ExpressionKind, start: Position, end: Position) {
    super(start, end)
  }
}

/**
 * Represents an atomic value (literal).
 * Examples: numbers, booleans, null.
 */
export class Char extends Expression {
  public constructor(public value: string, start: Position, end: Position) {
    super(ExpressionKind.Char, start, end)
  }
}

export class Number extends Expression {
  public constructor(public value: string, start: Position, end: Position) {
    super(ExpressionKind.Number, start, end)
  }
}

/**
 * Represents an identifier (a variable or symbol name).
 */
export class Identifier extends Expression {
  public constructor(public symbol: string, start: Position, end: Position) {
    super(ExpressionKind.Identifier, start, end)
  }
}

/**
 * Represents a string literal.
 */
export class String extends Expression {
  public constructor(public content: string, start: Position, end: Position) {
    super(ExpressionKind.String, start, end)
  }
}

/**
 * Represents a unary operation.
 * Example: `!expr`, `-expr`
 */
export class Unary extends Expression {
  public constructor(
    public operator: Token,
    public operand: Expression,
    start: Position, end: Position
  ) {
    super(ExpressionKind.Unary, start, end)
  }
}

/**
 * Represents a binary operation.
 * Example: `lhs + rhs`, `lhs * rhs`
 */
export class Binary extends Expression {
  public constructor(
    public operator: Token,
    public lhs: Expression, public rhs: Expression,
    start: Position, end: Position
  ) {
    super(ExpressionKind.Binary, start, end)
  }
}

/**
 * Represents a function declaration or anonymous function expression.
 * - `name`: function name (may be empty for anonymous).
 * - `params`: function parameters.
 * - `body`: statements or a single expression (in case of concise bodies).
 * - `flag`: optional function flag (e.g., async, inline).
 */
export class Lambda extends Expression {
  public constructor(
    public signature: FunctionSignature,
    public body: Statement[],
    start: Position, end: Position,
  ) {
    super(ExpressionKind.Function, start, end)
  }
}

/**
 * Represents a `match` expression (similar to `switch` in other languages).
 * - `subject`: the expression to match against.
 * - `body`: list of case clauses/statements.
 * - `fallThrough`: optional default case if no other matches.
 */
export class Match extends Expression {
  public constructor(
    public subjet: Expression,
    public body: Case[],
    public fallThrough: Maybe<Default>,
    start: Position, end: Position
  ) {
    super(ExpressionKind.Match, start, end)
  }
}

/**
 * Represents a function call expression.
 * - `callee`: the function being called.
 * - `args`: list of argument expressions.
 */
export class Call extends Expression {
  public constructor(
    public generics: Maybe<TType[]>,
    public callee: Expression,
    public args: Expression[],
    start: Position, end: Position
  ) {
    super(ExpressionKind.Call, start, end)
  }
}
