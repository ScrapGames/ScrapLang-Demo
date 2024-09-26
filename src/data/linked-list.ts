import { Nullable } from "@typings"

export interface INode<T> {
  index: number,
  info: T,
  nextNode: Nullable<INode<T>>

  isLast(): boolean
}

/**
 * Pointer to data that can be indentified by an index which starts with 0
 */
export class Node<T> implements INode<T> {
  index: number
  info: T
  nextNode: Nullable<Node<T>>

  public constructor(opts: {index: number, info: T, nextNode: Nullable<Node<T>>}) {
    this.index = opts.index
    this.info = opts.info
    this.nextNode = opts.nextNode
  }

  public isLast() {
    return this.nextNode === null
  }
}

export class LinkedList<T> {

  // Can be null in some moment of the programm
  linkedList: Nullable<Node<T>>;

  public constructor(info: T | null) {
    this.linkedList = info ? new Node({ index: 0, info, nextNode: null }) : null
  }

  public set setFirst(info: T) {
    const newNode = new Node({ index: 0, info, nextNode: this.linkedList })
    this.linkedList = newNode
    this.incrementIndexes()
  }

  public set setLast(info: T) {
    if (this.isEmpty()) {
      this.setFirst = info
    } else {
      const newNode = new Node({ index: 0, info, nextNode: null })
      let ll = this.linkedList

      if (ll !== null) {
        while (ll.nextNode !== null) {
          ll = ll.nextNode
        }

        newNode.index += ll.index + 1
        ll.nextNode = newNode
      }
    }
  }

  /**
   * Remove the first node by overlap the first node by the next
   */
  public removeFirst() {
    if (this.linkedList && this.linkedList.nextNode) {
      this.linkedList = this.linkedList.nextNode

      this.forEachNode(node => {
        node.index--
      })
    }
  }

  /**
   * Remove the last node in the linked list by set his value to null
   */
  public removeLast() {
    let ll = this.linkedList

    if (ll !== null) {
      while (ll.nextNode !== null) {
        if (ll.nextNode !== null && ll.nextNode.nextNode === null)
          break

        ll = ll.nextNode
      }

      ll.nextNode = null
    }
  }

  /**
   * Gets the 
   * @param idx 
   * @returns 
   */
  public getByIdx(idx: number) {
    let ll = this.linkedList

    if (ll !== null) {
      while (ll.nextNode !== null) {
        ll = ll.nextNode
        if (ll.index === idx) {
          break
        }
      }
      return ll
    }
    return ll
  }

  /**
   * Exec a lambda expression (that returns void, which means is a procedure) for each node in the LinkedList
   * @param lambda lambda to exec for every node
   */
  public forEachNode(lambda: ((node: Node<T>) => void)) {
    let node = this.linkedList

    if (node !== null) {
      do {
        lambda(node)
      } while((node = node.nextNode) !== null)
    }
  }

  /**
   * Same as `forEachNode` but starts from the node based on his index
   * @param from index of the node from the loop starts
   * @param lambda lambda to exec for every node
   */
  public fromEachNode(from: number, lambda: (node: Node<T>) => void) {
    let node = this.getByIdx(from)

    if (node !== null) {
      do {
        lambda(node)
      } while ((node = node.nextNode) !== null)
    }
  }

  /**
   * Increment the index of each node (except the first, because it starts from 0)
   */
  private incrementIndexes() {
    let node = this.linkedList

    if (node !== null) {
      while (node.nextNode !== null) {
        node = node.nextNode
        node.index++
      }
    }
  }

  /**
   * Check if the Linked List is empty by check if the first node is null
   * @returns true, if `this.linkedList` is null, false in other way
   */
  public isEmpty() {
    return this.linkedList === null
  }

  public count(): number {
    let nodes = 0
    let node = this.linkedList

    if (node !== null) {
      for (; node.nextNode !== null; nodes++)
        node = node.nextNode

      return nodes + 1
    }

    return nodes;
  }

  public traverse(): Nullable<Node<T>>[] {

    let node = this.linkedList
    const nodes: Node<T>[] = []

    while (node !== null) {
      nodes.push(node)
      node = node.nextNode
    }

    return nodes
  }

  private getLast() {
    let ll = this.linkedList

    if (ll !== null) {
      while (ll.nextNode !== null) {
        ll = ll.nextNode
      }
  
      return ll
    }

    return ll
  }

  public get first() {
    return this.linkedList
  }

  public get last() {
    return this.getLast()
  }
}