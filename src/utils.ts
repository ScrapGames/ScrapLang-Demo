export type Nullable<T> = T | null

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