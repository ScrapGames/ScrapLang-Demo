import { Position } from "@frontend/position.ts"

export interface Collectable<T> {
  collect(): T[]
}

export interface Reader<T, C = T> {
  currentTok: T

  next(): T

  nextN(n: number): T

  ahead(): T

  setTo(newPos: Position): void

  check(maybe: C): boolean

  hasEnd(): boolean
}
