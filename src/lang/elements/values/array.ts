import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts"

/**
 * Represent an array. Which is an allocated space where can store values
 * 
 * @example
 * const myArray = [1, 2, 3, 4, 5]
 */
export class ScrapArray<T extends ScrapObjectProperty = ScrapObjectProperty> extends ScrapObject implements Sliceable<ScrapArray<T>> {
    public length: number = 0

    public constructor(elements: T[]) {
        super(null, new Map())
        this.length = elements.length

        for (const [idx, item] of elements.entries())
            this.getValue.set(idx.toString(), item)

    }

    /**
     * Returns the wrapped value in the specified index
     * @param idx Index where the value can be found
     * @returns The wrapped `ScrapValue` if exists, `ScrapUndefined` in other case
     */
    public at(idx: number): ScrapValue {
        return this.get(idx.toString())
    }

    /**
     * Push one ScrapValue to the array
     * @param element ScrapValue to be pushed
     */
    public push(element: T) {
        this.set(
            (this.length === 0 ? this.length : this.length - 1).toString(),
            element
        )

        this.length++
    }

    /** Deletes the last element in the array */
    public pop() {
        this.getValue.delete((this.length - 1).toString())
        this.length--
    }

    /**
     * Returns a new `ScrapArray` of the specified section
     * @param from Start of the new array
     * @param until Ends of the new array, if not specified, the array will be spliced until his last element
     * @returns The new spliced `ScrapArray`
     */
    public slice(from: number, until?: number): ScrapArray<T> {
      return new ScrapArray(Array.from(this.getValue, (item) => item[1]).slice(from, until))
    }

    public override get getValue() { return this.value as Map<string, ScrapObjectProperty> }

    private formatArray() {
        let str = "["
        Array.from(this.getValue)
            .forEach((item, idx, arr) => {
                (idx + 1) === arr.length ?
                    str += item[1].value.format() :
                    str += `${item[1].value.format()}, `
            })

        return str += "]"
    }

    public override format() { return this.formatArray() }
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