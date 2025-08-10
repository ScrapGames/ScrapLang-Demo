import { expect } from "jsr:@std/expect/expect"

const operar = (n1: number, n2: number, fn: (n1: number, n2: number) => number) => {
  return fn(n1, n2)
}

Deno.test("Lambda testing", () => {
  expect(operar(4, 5, (n1, n2) => n1 + n2)).toBe(9)
  expect(operar(4, 5, (n1, n2) => n1 - n2)).toBe(-1)
  expect(operar(4, 5, (n1, n2) => n1 * n2)).toBe(20)

  console.log(operar(4, 5, (n1, n2) => n1 / n2))
})
