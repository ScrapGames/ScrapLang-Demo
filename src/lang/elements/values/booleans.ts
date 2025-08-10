import { ScrapPrimitive, ScrapValue } from "@lang/elements/commons.ts"
import { ExpressionKind } from "@ast/ast.ts";

/**
 * Represent a true value
 */
export class ScrapTrue extends ScrapPrimitive {
    public constructor() {
        super(true)
    }

    public override get Value() { return this.value as true }
}

/**
 * Reprents a false value
 */
export class ScrapFalse extends ScrapPrimitive {
    public constructor() {
        super(false)
    }

    public override get Value() { return this.value as false }
}

export class TernaryExpression extends ScrapValue {
    public cmp: ScrapValue
    public lhs: ScrapValue
    public rhs: ScrapValue

    public constructor(cmp: ScrapValue, lhs: ScrapValue, rhs: ScrapValue) {
        super(ExpressionKind.Ternary)
        this.cmp = cmp
        this.lhs = lhs
        this.rhs = rhs
    }
}