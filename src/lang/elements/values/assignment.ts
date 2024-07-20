import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"

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
export class AssignmentExpression extends ScrapValue {
    private target: ScrapVariable

    public constructor(target: ScrapVariable, newValue: ScrapValue) {
        super(newValue)
        this.target = target
    }

    public get getTarget() { return this.target }
}