import { ASTNode } from "@frontend/ast/ast.ts"
import type { Position } from "@frontend/typings.ts"

/**
 * Enumeration representing the kinds of expressions supported in the AST.
 */
export enum ExpressionKind {
  Numeric,
  Float,
  String,
  Char,
  Identifier,
  Call,
  Object,
  Array,
  ModAccess,
  ObjAccess,
  Reference,
  Reassignment,
  Function,
  Boolean,
  BinaryExpr,
  UnaryExpr,
  Ternary,
  Slice,
  Indexing,
  Casting
}

/**
 * Base class for all expressions in the AST.
 */
export class Expression extends ASTNode {
  public kind: ExpressionKind

  /**
   * Creates a new Expression node.
   * @param kind - The kind of expression.
   * @param position - Position in the source code.
   */
  public constructor(kind: ExpressionKind, position: Position) {
    super(position)
    this.kind = kind
  }
}

/**
 * Represents a numeric literal expression (e.g., integer).
 */
export class Numeric extends Expression {
  private value: number

  /**
   * @param value - Numeric literal value.
   * @param position - Position in the source code.
   */
  public constructor(value: number, position: Position) {
    super(ExpressionKind.Numeric, position)
    this.value = value
  }

  /** Gets the numeric value. */
  public get Value() { return this.value }
}

/**
 * Represents a floating-point literal expression.
 */
export class Float extends Expression {
  private value: number

  /**
   * @param value - Float literal value.
   * @param position - Position in the source code.
   */
  public constructor(value: number, position: Position) {
    super(ExpressionKind.Float, position)
    this.value = value
  }

  /** Gets the float value. */
  public get Value() { return this.value }
}

/**
 * Represents a character literal expression.
 */
export class Char extends Expression {
  private value: string

  /**
   * @param value - Character value.
   * @param position - Position in the source code.
   */
  public constructor(value: string, position: Position) {
    super(ExpressionKind.Char, position)
    this.value = value
  }

  /** Gets the character value. */
  public get Value() { return this.value }
}

/**
 * Represents a string literal expression.
 */
export class String extends Expression {
  private value: string

  /**
   * @param value - String literal.
   * @param position - Position in the source code.
   */
  public constructor(value: string, position: Position) {
    super(ExpressionKind.String, position)
    this.value = value
  }

  /** Gets the string value. */
  public get Value() { return this.value }
}

/**
 * Represents an object literal expression.
 */
export class Object extends Expression {
  private entries: Map<string, Expression>

  /**
   * @param entries - Map of keys and corresponding expression values.
   * @param position - Position in the source code.
   */
  public constructor(entries: Map<string, Expression>, position: Position) {
    super(ExpressionKind.Object, position)
    this.entries = entries
  }

  /** Gets the object entries. */
  public get Entries() { return this.entries }
}

/**
 * Represents access to a member
 */
export class Access extends Expression {
  private target: Expression
  private member: Expression

  /**
   * @param target - The object being accessed.
   * @param member - The member accessed within the object.
   * @param position - Position in the source code.
   */
  public constructor(type: ExpressionKind, target: Expression, member: Expression, position: Position) {
    super(type, position)
    this.target = target
    this.member = member
  }

  /** Gets the target object. */
  public get Target() { return this.target }

  /** Gets the accessed member. */
  public get Member() { return this.member }
}

/**
 * Represents an identifier (variable, function name, etc.).
 */
export class Identifier extends Expression {
  private symbol: string

  /**
   * @param symbol - Identifier name.
   * @param position - Position in the source code.
   */
  public constructor(symbol: string, position: Position) {
    super(ExpressionKind.Identifier, position)
    this.symbol = symbol
  }

  /** Gets the identifier symbol. */
  public get Symbol() { return this.symbol }
}

/**
 * Represents an array literal expression.
 */
export class Array<T> extends Expression {
  private array: T[]

  /**
   * @param array - Array of expressions.
   * @param position - Position in the source code.
   */
  public constructor(array: T[], position: Position) {
    super(ExpressionKind.Array, position)
    this.array = array
  }

  /** Gets the array elements. */
  public get Array() { return this.array }
}

/**
 * Represents a reference to a named entity.
 */
export class Reference extends Expression {
  private target: string

  /**
   * @param target - Name of the referenced symbol.
   * @param position - Position in the source code.
   */
  public constructor(target: string, position: Position) {
    super(ExpressionKind.Reference, position)
    this.target = target
  }

  /** Gets the referenced target name. */
  public get Target() { return this.target }
}

/**
 * Represents a function call expression.
 */
export class Call extends Expression {
  private callee: Expression
  private args: Expression[]

  /**
   * @param callee - Expression being called.
   * @param args - Argument expressions.
   * @param position - Position in the source code.
   */
  public constructor(callee: Expression, args: Expression[], position: Position) {
    super(ExpressionKind.Call, position)
    this.callee = callee
    this.args = args
  }

  /** Gets the function or expression being called. */
  public get Callee() { return this.callee }

  /** Gets the arguments of the call. */
  public get Args() { return this.args }
}

/**
 * Represents a unary operation (e.g., `!a`, `-b`).
 */
export class Unary extends Expression {
  private operator: string
  private operand: Expression

  /**
   * @param operator - Unary operator.
   * @param operand - Operand expression.
   * @param position - Position in the source code.
   */
  public constructor(operator: string, operand: Expression, position: Position) {
    super(ExpressionKind.UnaryExpr, position)
    this.operator = operator
    this.operand = operand
  }

  /** Gets the unary operator. */
  public get Operator() { return this.operator }

  /** Gets the operand expression. */
  public get Operand() { return this.operand }
}

/**
 * Represents a binary operation (e.g., `a + b`, `x && y`).
 */
export class Binary extends Expression {
  private operator: string
  private lhs: Expression
  private rhs: Expression

  /**
   * @param operator - Binary operator.
   * @param lhs - Left-hand side expression.
   * @param rhs - Right-hand side expression.
   * @param position - Position in the source code.
   */
  public constructor(operator: string, lhs: Expression, rhs: Expression, position: Position) {
    super(ExpressionKind.BinaryExpr, position)
    this.operator = operator
    this.lhs = lhs
    this.rhs = rhs
  }

  /** Gets the binary operator. */
  public get Operator() { return this.operator }

  /** Gets the left-hand side expression. */
  public get LHS() { return this.lhs }

  /** Gets the right-hand side expression. */
  public get RHS() { return this.rhs }
}

/**
 * Represents array indexing access (e.g., `arr[0]`).
 */
export class Indexing extends Expression {
  private target: Expression
  private index: Expression

  /**
   * @param target - The array or structure being indexed.
   * @param index - The index expression.
   * @param position - Position in the source code.
   */
  public constructor(target: Expression, index: Expression, position: Position) {
    super(ExpressionKind.Indexing, position)
    this.target = target
    this.index = index
  }

  /** Gets the target being indexed. */
  public get Target() { return this.target }

  /** Gets the index expression. */
  public get Index() { return this.index }
}

/**
 * Represents an inline or anonymous function expression.
 */
export class Function extends Expression {
  /**
   * @param position - Position in the source code.
   */
  public constructor(position: Position) {
    super(ExpressionKind.Function, position)
  }
}
