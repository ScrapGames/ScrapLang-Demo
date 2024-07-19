import { ScrapValue } from "@lang/elements/commons.ts"

/**
 * Represent a true value
 */
export class ScrapTrue extends ScrapValue {
    public constructor() {
        super(true)
    }

    public get getValue() { return this.value as true }
}

/**
 * Reprents a false value
 */
export class ScrapFalse extends ScrapValue {
    public constructor() {
        super(false)
    }

    public get getValue() { return this.value as false }
}

export class TernaryExpression extends ScrapValue {}