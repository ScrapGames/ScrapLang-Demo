import { Ajustable, Operable as _ } from "@typings"
import { ScrapPrimitive } from "@lang/elements/commons.ts"

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
        (this.getValue as number)++
        return this
    }

    public decrement() {
        (this.getValue as number)--
        return this
    }

    public override get getValue() { return this.value as number }
}

/**
 * Represent an float value
 * 
 * @example
 * 1.1, 2.20, 0xb000.f
 */
export class ScrapFloat extends ScrapPrimitive {
    public constructor(val: number) {
        super(val)
    }

    public override get getValue() { return this.value as number }
}