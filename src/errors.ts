import { Position } from "@frontend/typings.ts"

export class SyntaxError extends Error {
  public constructor(message: string, file: string, position: Position) {
    super(message)
    this.message += `\nAt ${file}:${position.line}:${position.linePos}`
  }
}

export class CLIError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = "CLIError"
  }
}
