import { Nullable } from "@utils"

/**
 * Pointer to data that can be indentified by an index which starts with 0
 */
export class Node<T> {
  index: number
  info: T
  nextNode: Nullable<Node<T>>

  public constructor(index: number, info: T, nextNode: Nullable<Node<T>>) {
    this.index    = index
    this.info     = info
    this.nextNode = nextNode
  }

  public isLast(): boolean {
    return this.nextNode === null
  }
}

export class LinkedList<T> {
  // Can be null in some moment of the programm
  head: Node<T>;

  public constructor(info: T) {
    this.head = new Node(0, info, null)
  }

  public insert(info: T) {
    this.head.nextNode = new Node(this.head.index + 1, info, this.head)
  }

  public remove(index: number) {
    
  }

  public count(): number {
    let nodes = 0
    let node = this.head

    if (node !== null) {
      for (; node.nextNode !== null; nodes++)
        node = node.nextNode

      return nodes + 1
    }

    return nodes;
  }

  private getLast() {
    let ll = this.head

    if (ll !== null) {
      while (ll.nextNode !== null) {
        ll = ll.nextNode
      }
  
      return ll
    }

    return ll
  }

  public get Head() {
    return this.head
  }

  public get Peek() {
    return this.getLast()
  }
}