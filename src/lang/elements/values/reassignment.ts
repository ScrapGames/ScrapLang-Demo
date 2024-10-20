import { ScrapValue } from "@lang/elements/commons.ts"

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
export class ReassignmentExpression extends ScrapValue {
    private target: string

    public constructor(target: string, newValue: ScrapValue) {
        super(newValue)
        this.target = target
    }

    public get getTarget() { return this.target }
    public override get getValue() { return this.value as ScrapValue }
}