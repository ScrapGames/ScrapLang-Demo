export default interface Stack<T> {
  storage: T[]

  push(item: T): number;

  pop(): T;

  peek(): T;

  peekIs(maybe: T): boolean;

  size(): number;
}