import { ScrapInteger } from "@lang/elements/values/numerics.ts"
import { ScrapObject, ScrapValue } from "@lang/elements/commons.ts"

import type { Sliceable } from "@typings"
import { getDefaultMetaproperties } from "@utils"

/**
 * Represents an array data structure in ScrapLang
 */
export class ScrapArray extends ScrapObject implements Sliceable<ScrapArray> {
    public length: number = 0

    public constructor(elements: ScrapObjectProperty[]) {
        super(null, new Map())
        this.length = elements.length

        for (const [idx, item] of elements.entries())
            this.Value.set(idx.toString(), item)

    }

    /**
     * Returns the wrapped value in the specified index
     * @param idx Index where the value can be found
     * @returns The wrapped `ScrapValue` if exists, `ScrapUndefined` in other case
     */
    public at(idx: number): ScrapValue {
        return this.index(idx.toString())
    }

    /**
     * Push one ScrapValue to the array
     * @param element ScrapValue to be pushed
     */
    public push(element: ScrapValue) {
        this.set((this.length === 0 ? this.length : this.length - 1).toString(), {
              metaproperties: getDefaultMetaproperties(),
              value: element
            }
        )

        this.length++
    }

    /** Deletes the last element in the array */
    public pop() {
        this.Value.delete((this.length - 1).toString())
        this.length--
    }

    /**
     * Returns a new `ScrapArray` of the specified section
     * @param from Start of the new array
     * @param until Ends of the new array, if not specified, the array will be spliced until his last element
     * @returns The new spliced `ScrapArray`
     */
    public slice(from: number, until?: number): ScrapArray {
      return new ScrapArray(Array.from(this.Value, (item) => item[1]).slice(from, until))
    }

    public override get Value() { return this.value as Map<string, ScrapObjectProperty> }

    private formatArray() {
        let str = "["
        Array.from(this.Value)
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
    public constructor(arr: ScrapArray, target: ScrapInteger) {
        super(arr.at(target.Value))
    }
}
