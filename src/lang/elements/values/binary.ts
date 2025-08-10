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
    private operator: string
    private lhs: ScrapValue
    private rhs: ScrapValue

    public constructor(operator: string, lhs: ScrapValue, rhs: ScrapValue) {
        super(undefined)
        this.operator = operator
        this.lhs = lhs
        this.rhs = rhs
    }

    public get getLHS()      { return this.lhs }
    public get getRHS()      { return this.rhs }
    public get getOperator() { return this.operator }
}