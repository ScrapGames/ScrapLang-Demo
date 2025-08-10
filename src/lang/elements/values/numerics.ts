import { ScrapPrimitive } from "@lang/elements/commons.ts"

import type { Ajustable } from "@typings"

/**
 * Represent an integer value
 * 
 * @example
 * 1000, 0o777112
 */
export class ScrapInteger extends ScrapPrimitive implements Ajustable {
    public constructor(val: number) {
        super(val)
    }

    public increment() {
        (this.Value as number)++
        return this
    }

    public decrement() {
        (this.Value as number)--
        return this
    }

    public override get Value() { return this.value as number }
}

/**
 * Represent an float value
 * 
 * @example
 * 1.1, 2.20, 0xb000.f
 */
export class ScrapFloat extends ScrapPrimitive implements Ajustable {
    public constructor(val: number) {
        super(val)
    }

    public increment() {
        (this.Value as number)++
        return this
    }

    public decrement() {
        (this.Value as number)--
        return this
    }

    public override get Value() { return this.value as number }
}