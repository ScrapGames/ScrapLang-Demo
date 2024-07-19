import { ScrapValue } from "@lang/elements/commons.ts"

/**
 * Represent a binary expressions.
 * Is the combination of three elements: two Expressions and a operator which defined the operation between these two operands
 * 
 * @example
 * const mySum = 10 + 20
 * 
 * const myStringConcatenation = "Hello, " + "World!"
 */
export class BinaryExpression extends ScrapValue {
    private lhs: ScrapValue
    private rhs: ScrapValue
    private operator: string

    public constructor(lhs: ScrapValue, rhs: ScrapValue, operator: string) {
        super(undefined)
        this.lhs = lhs
        this.rhs = rhs
        this.operator = operator
    }
}