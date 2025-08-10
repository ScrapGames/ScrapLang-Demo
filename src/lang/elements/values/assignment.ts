import { ScrapValue } from "@lang/elements/commons.ts"
import { BinaryExpression } from "@lang/elements/values/binary.ts"

/**
 * Represents the assignment of a value to a variable. This assignment returns a value
 * 
 * @example
 * var myNumber = 10
 * 
 * myNumber = 20
 * 
 * // The assignment returns the value that has been assigned. In this last case 20.
 */
export class AssignmentExpression extends BinaryExpression {
    public constructor(target: ScrapValue, value: ScrapValue) {
        super('=', target, value)
    }
}