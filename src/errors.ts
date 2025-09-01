import { Position } from "@frontend/position.ts"

export class SyntaxError extends Error {
  public constructor(message: string, file: string, position: Position) {
    super(`${message}\nAt ${file}:${position.line}:${position.lineIdx}`)
    this.name = "SyntaxError"
  }
}

export class CLIError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = "CLIError"
  }
}
