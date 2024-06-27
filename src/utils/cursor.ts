export interface Cursorable<T> {
  source: T | T[]

  pos: number
  currentTok: T

  consume(): T
  next(): T
  previous(): T
  isEOF(): boolean
  get eofChar(): T
}