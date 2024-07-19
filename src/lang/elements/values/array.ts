import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts"

/**
 * Represent an array. Which is an allocated space where can store values
 * 
 * @example
 * const myArray = [1, 2, 3, 4, 5]
 */
export class ScrapArray<T> extends ScrapValue {
    public constructor(elements: T[]) {
        super(elements)
    }

    public get getValue() { return this.value as T[] }
}

export class ScrapArrayAccess extends ScrapValue {

    private accessedPosition: ScrapInteger
    private accessedArray: ScrapArray<ScrapValue>


    public constructor(accessedArray: ScrapArray<ScrapValue>, accessedPosition: ScrapInteger) {
        super(undefined)
        this.accessedArray = accessedArray
        this.accessedPosition = accessedPosition
    }

    public get getAccessedPosition() { return this.accessedPosition }

    public get getAccessedArray() { return this.accessedArray }
}