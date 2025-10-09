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
