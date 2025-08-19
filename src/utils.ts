export type Nullable<T> = T | null

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
    const alphaNum = /[0-9a-zA-Z_$]/

    return alphaNum.test(token)
}

/// Detects numeric characters, including decimals
export function isNumeric(token: string) {
    const numericRegex = /[0-9_]/
    return numericRegex.test(token)
}

/// Detects whitespaces characters
export function isSpace(char: string): char is ' ' {
    return char === ' '
}

export function isEOL(char: string): char is '\r' | '\n' {
    return char === '\r' || char === '\n'
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

export function isAndInArray<T>(item: T, maybeArray: T) {
    return Array.isArray(maybeArray) && inArray(item, maybeArray)
}

// Crea un fondo para una tarjeta de presentación de una empresa dedicada a los videojuegos. Debe de ser minimalista
// y con colores no agresivos