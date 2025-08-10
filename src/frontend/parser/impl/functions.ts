import { Tokens } from "@frontend/tokens/tokens.ts"
import Parser from "../base.ts"
import { Function } from "@frontend/ast/nodes/declarations.ts"

export default class FunctionParser extends Parser {

  public parseFunction(): Function {
    const name = this.parseDeclarationName(Tokens.FN)
    if (this.currentTok.is(Tokens.GREATER))
      this.consumeGeneric()

    this.eat(Tokens.LPAREN)
    while (!this.currentTok.is(Tokens.RBRACE)) {
      this.next()
    }

    return new Function(name, new Map(), this.Pos)
  }

}