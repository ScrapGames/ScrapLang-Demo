import { ScrapValue } from "@lang/elements/commons.ts"

/**
 * Represents an `undefined` value
 */
export class ScrapUndefined extends ScrapValue {
    public constructor() {
        super(undefined)
    }

    public get getValue() { return this.value as undefined }
}