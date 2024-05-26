import { LinkedList, Node } from "./linked-list.ts"
import { Nullable } from "../typings.ts"

interface IStack<T> {
  push(info: T): void
  pop(info: T): void

  get peek(): Nullable<Node<T>>
  get size(): number
}

class Stack<T> extends LinkedList<T> implements IStack<T> {
  public push(info: T) {
    super.setFirst = info
  }

  public pop() {
    super.removeFirst()
  }

  public get peek(): Nullable<Node<T>> {
    return super.first
  }

  public get size(): number {
    return super.count()
  }

  public beautyPrint() {
    let stackContent = ""
    const nodes = super.traverse()

    for (const node of nodes) {
      stackContent += `|\t${node?.info}\t|\n`
    }

    stackContent += "-----------------"

    return stackContent
  }
}

export { Stack, type IStack }