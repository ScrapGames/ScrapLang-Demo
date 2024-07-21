import { ScrapPrimitive } from "@lang/elements/commons.ts"

/**
 * Represents an `undefined` value
 */
export class ScrapUndefined extends ScrapPrimitive {
    public constructor() {
        super(undefined)
    }

    public get getValue() { return this.value as undefined }
}

export class ScrapNull extends ScrapPrimitive {
    public constructor() {
        super(null)
    }

    public get getValue() { return this.value as null }
}