/// Detects alphabetic characters (ignoring Cases)
export function isAlpha(token: string) {
    const alphaRegex = /[a-zA-Z_]/
  
    return alphaRegex.test(token)
}

export function isHexadecimal(token: string) {
    const numericValue = /[0-9a-fA-F]/

    return numericValue.test(token)
}

/// Detects alphanumeric characters
export function isAlphaNum(token: string) {
    const alphaNum = /[0-9a-zA-Z_]/

    return alphaNum.test(token)
}

/// Detects numeric characters, including decimals
export function isNumeric(token: string) {
    const numericRegex = /[0-9_]/

    return numericRegex.test(token)
}

/// Detects whitespaces characters
export function isSpace(token: string) {
    return token === ' '
}

/**
 * Checks that `item` exists inside `array`
 * @param item Item that may exists inside `array`
 * @param array Array where `item` will be searched
 * @returns true, if `item` exists, false in other case
 */
export function inArray<T>(item: T, array: T[]): boolean {
    return array.some(e => e === item)
}

/**
 * `Cursor` is the base class that a Data Structure can inherit to iterate in a defined way the elements of the class that inherit.
 * 
 * The iterated data type will be specified via a generic data type
 */
export abstract class Cursor<T> {
    abstract source: T | T[]
    abstract pos: number
    abstract currentTok: T

    abstract consume(): T
    abstract next(): T
    abstract previous(): T
    abstract isEOF(): boolean
    abstract get eofChar(): T
}