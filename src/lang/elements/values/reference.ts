import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"

/**
 * Represent a reference to a variable
 * 
 * @example
 * var myNumber = 10
 * 
 * var myReference = &myNumber
 * 
 * myReference = 50
 * 
 * // now `myNumber` value is 50
 */
export class ScrapReference extends ScrapValue {
    public constructor(referenceTo: ScrapVariable) {
        super(referenceTo)
    }

    public get getReferencedVar(): ScrapVariable { return this.value as ScrapVariable }
}
