/**
 * This files includes the implementation of the "interperter" component, which executes the instructions directly from the AST.
 * This is an experimental development component only to test how to the final code would be executed
 */

import Lexer       from "@frontend/lexer.ts"
import Parser      from "@frontend/parser.ts"
import { ASTNode } from "@frontend/ast/ast.ts"
import type { CallFrame } from "@engine/typings.ts"

export class Interpreter {
  private frame: CallFrame[]

  private constructor(ast: ASTNode) {
    this.frame = []
    console.log(ast)
  }

  public static init(file: string): Interpreter {
    using l = Lexer.init(file)
    const p = Parser.init(l)
    return new this(p.parseFile())
  }

  public eval() {

  }
}
