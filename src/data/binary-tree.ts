import type { Nullable } from "@typings"
import { Stack } from "./stack.ts"

interface IChild<T> {
  leftChild: Nullable<IChild<T>>
  rightChild: Nullable<IChild<T>>

  info: T

  hasLeftChild(): boolean
  hasRightChild(): boolean

  hasChilds(): boolean
  isPerfect(): boolean
  isLeaf(): boolean
}

class TreeNode<T> implements IChild<T> {
  leftChild: Nullable<TreeNode<T>>
  rightChild: Nullable<TreeNode<T>>

  info: T

  public constructor(info: T) {
    this.info = info
    this.leftChild = null
    this.rightChild = null
  }

  /**
   * Check if exists the left child
   * @returns true if the false child is not null, false in other way
   */
  public hasLeftChild() {
    return this.leftChild === null
  }

  /**
   * Check if exists the right child
   * @returns true if the right child is not null, false in other way
   */
  public hasRightChild() {
    return this.rightChild === null
  }

  /**
   * Check if a node has childs
   * @returns true if any of his two childs exists (not null), false in other way
   */
  public hasChilds(): boolean {
    return this.hasLeftChild() || this.hasRightChild()
  }

  /**
   * A perfect node is a node that has 2 childs, where his values are not null
   * @returns true, if is a perfect node, false in other way
   */
  public isPerfect(): boolean {
    return this.leftChild === null && this.rightChild === null
  }

  /**
   * A leaf node is one that his childs are nulls
   * @returns 
   */
  public isLeaf(): boolean {
    return !this.isPerfect()
  }
}

class BinaryTree<T> {
  root: TreeNode<T>

  public constructor(info: T) {
    this.root = new TreeNode(info)
  }

  /**
   * Insert in the Binary tree by `newChild` size
   * 
   * If `newChild` is little than the `currentRoot`
   *  Where `currentRoot` is:
   *    - if is the first node to isnert, is compared with the root, which never can be null
   *    - else, a variable named `current` is reassigned until the next corresponding child is null and then `newChild` is assigned to that child
   * 
   * If `newChild` is greater than the `currentRoot`
   *  Follows the before mentiones behaviour but with right childs
   * 
   * @param currentRoot 
   * @param newChild 
   */
  public insert(currentRoot: TreeNode<T>, newChild: TreeNode<T>) {
    if (newChild.info < currentRoot.info) {
      if (currentRoot.leftChild) {
        this.insert(currentRoot.leftChild, newChild)
      } else {
        currentRoot.leftChild = newChild
      }
    } else if (newChild.info > currentRoot.info) {
      if (currentRoot.rightChild) {
        this.insert(currentRoot.rightChild, newChild)
      } else {
        currentRoot.rightChild = newChild
      }
    }
  }

  public customInsert(currentRoot: TreeNode<T>, lambda: (currentRoot: TreeNode<T>) => void) {
    lambda(currentRoot)
  }

  public delete() {
    throw new Error("Metodo no implementado")
  }

  public traverse(node: Nullable<TreeNode<T>>, stack: Stack<T>): void {
    if (node === null) {
      return
    }

    stack.push(node.info)
    this.traverse(node.leftChild, stack)
    this.traverse(node.rightChild, stack)
  }

  /**
   * Shows the content of the binary tree
   */
  public print(node: Nullable<TreeNode<T>>): void {
    if (node === null) {
      return
    }

    console.log(node.info)
    this.print(node.leftChild)
    this.print(node.rightChild)
  }
}



export { type IChild, TreeNode, BinaryTree }


/* --- PROCEDURAL INSERT --- */
/* let current = currentRoot

while (true) {
  if (newChild.info < current.info) {
    if (current.leftChild) {
      current = current.leftChild
    } else {
      current.leftChild = newChild
      break
    }
  } else if (newChild.info > current.info) {
    if (current.rightChild) {
      current = current.rightChild
    } else {
      current.rightChild = newChild
      break
    }
  }
} */