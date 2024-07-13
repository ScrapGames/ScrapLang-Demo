// renaming import is used because it may be not ussed and simply adding a underscore the linter doesnt bother
import { LinkedList as _LinkedList } from "../data/linked-list.ts"
import { ScrapValue } from "./expressions.ts"
import { Nullable } from "../typings.ts"

interface Options {
  sealed: boolean,
  freezed: boolean,
  writable: boolean
  value: ScrapValue
}

interface SProperty {
  [key: PropertyKey]: Nullable<ScrapValue>
}

/**
 * A object is the base class for all the objects in scraplang.
 * In the inheritance system based on prototypes, object is the last class (or the first saw from a traditional POO programming language)
 */
export default class SObject {
  public myPrototype: Nullable<SObject> = null
  private properties: SProperty[] = []

  /**
   * By default, an object is writable and modifable
   * this means that is possible to add more properties to an object
   */
  private isSealed = false
  private isFreezed = false
  private writable = true

  public constructor(value?: ScrapValue) {
    
  }

  public static seal(obj: SObject): SObject {
    return new SObject(obj)
  }

  public static custom(options: Options) {
    return new SObject(options.value)
  }

  /* public static keys(obj: SObject): string[] {

  }

  public static values(obj: SObject): Expression[] {

  } */

  /* public static defineProperty(obj: SObject, key: string, attributes: Options) {
    if (!obj.isFreezed || !obj.isSealed) {
      //obj.
    }
  }

  public static getPrototypeOf(obj: SObject): Nullable<SObject> {
    return obj.myPrototype
  }

  public static setPrototypeOf(obj: SObject, prototype: SObject): void {
    obj.myPrototype = prototype
  } */

  /**
   * Try to get the property passed as `property` in `obj` and his prototype's if it has
   * @param obj object where `property` could be
   * @param property property to search in `obj` and his prototype's if it has
   */
  /* public static getPropertyOf(_obj: SObject, _property: string) {
    
  }

  public isPrototypeOf(obj: SObject) {
    return this.myPrototype === obj.myPrototype
  } */
}