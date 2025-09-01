export interface Collectable<T> {
  collect(): T[]
}

export interface Reader<T, C = T> {
  current: T

  next(): T

  moveN(n: number): T

  ahead(): T

  check(maybe: C): boolean

  hasEnd(): boolean
}
