import { expect } from "jsr:@std/expect"
import Cursor from "@frontend/lexer/cursor.ts"

const SOURCE_BASE = "This is a test"

Deno.test("First consume is 'T'", () => {
  const cursor = new Cursor(SOURCE_BASE)
  expect(cursor.currentTok).toBe("T")
})

/**
 * Testing that calling more than one time to `consume` and the calling `previous`
 * returns a different value than returned by `consume`
 */
Deno.test("Previous is a different value calling 'consume' more than 1 time", () => {
  const cursor = new Cursor(SOURCE_BASE)
  cursor.advanceN(2)

  expect(cursor.previous()).toBe("h")
})

Deno.test("consumeN works nicely", () => {
  const cursor = new Cursor(SOURCE_BASE)
  expect(cursor.nextN(3)).toBe("s")
})

/**
 * Calling 'advance' we economize at runtime because we doesn't need to make an indexation
 * like occurs in 'consume'
 */
Deno.test("Use 'consume' instead of 'advance' to move around the source", () => {
  const cursor = new Cursor(SOURCE_BASE)
  cursor.advance()

  expect(cursor.currentTok).toBe('h')
})