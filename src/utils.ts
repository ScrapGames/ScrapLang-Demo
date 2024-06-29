/// Detects alphabetic characters (ignoring Cases)
export function isAlpha(token: string) {
    const alphaRegex = /[a-zA-Z_]/
  
    return alphaRegex.test(token)
}

/// Detects alphanumeric characters
export function isAlphaNum(token: string) {
    const alphaNum = /[0-9a-zA-Z_]/

    return alphaNum.test(token)
}

/// Detects numeric characters, including decimals
export function isNumeric(token: string) {
    const numericRegex = /[0-9]/

    return numericRegex.test(token)
}

export function isOctalLiteral(token: string) {
    const numericRegex = /0o[0-9]/

    return numericRegex.test(token)
}

export function isBinaryLiteral(token: string) {
    const numericRegex = /0b[0-9]/

    return numericRegex.test(token)
}

export function isHexaLiteral(token: string) {
    const numericRegex = /0x[0-9]/

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
export function inArray(item: unknown, array: unknown[]): boolean {
    return array.find(e => e === item) !== undefined
}

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