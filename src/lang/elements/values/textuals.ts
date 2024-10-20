import { ScrapPrimitive } from "@lang/elements/commons.ts"

/**
 * Represent a char value. Which is a value that stores a single character and require 1 byte
 */
export class ScrapChar extends ScrapPrimitive {
    private readonly length: number = 1
    private readonly size: number = 4

    public constructor(literal: string) {
        super(literal)
    }

    public override get getValue() { return this.value as string }
}

/**
 * Represents a String. Which is an array of characters
 * 
 * @example
 * const myString = "Hello, World!"
 */
export class ScrapString extends ScrapPrimitive {
    private readonly length: number
    private readonly size: number

    public constructor(literal: string) {
        super(literal)
        this.length = literal.length
        this.size = new Blob([literal]).size
    }

    public get getLength() { return this.length }
    public get getSize()   { return this.size }
    public override get getValue()  { return this.value as string }
}