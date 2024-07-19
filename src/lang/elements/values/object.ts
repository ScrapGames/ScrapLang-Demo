import { ScrapValue } from "@lang/elements/commons.ts"

/**
 * Represent a literal object expression. Which is a way to write objects in a literal way assigning value to keys
 * 
 * @example
 * const myObject = {
 *  a: 10,
 *  b: 20,
 *  c: "Hello, World!"
 * }
 */
export class ScrapObject extends ScrapValue {
    public constructor(keyValuePairs: Map<string, ScrapValue>) {
        super(keyValuePairs)
    }

    public get getValue() { return this.value as Map<string, ScrapValue> }
}