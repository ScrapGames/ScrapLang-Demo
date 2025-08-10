import { expect } from "jsr:@std/expect"
import { isIdentifier, Token, Tokens, TOKEN_MAP } from "./tokens.ts"

Deno.test("Token is keyword", () => {
  const fnKWToken = new Token(Tokens.FN, TOKEN_MAP.get(Tokens.FN)!, 0, 0, 0)

  expect(fnKWToken.isKeyword()).toBeTruthy()
})

Deno.test("Token content is 'fn'", () => {
  const fnKWToken = new Token(Tokens.FN, TOKEN_MAP.get(Tokens.FN)!, 0, 0, 0)

  expect(fnKWToken.content === "fn").toBeTruthy()
})

Deno.test("Token is Identifier", () => {
  const identifier = "sum"

  expect(isIdentifier(identifier)).toBeTruthy()
})

Deno.test("Token isn't identifier", () => {
  const identifier = "fn"

  expect(isIdentifier(identifier)).toBeFalsy()
})

Deno.test("Token is literal", () => {
  const literal = new Token(Tokens.STRING, TOKEN_MAP.get(Tokens.STRING)!, 0, 0, 0)
  expect(literal.isLiteral()).toBeTruthy()
})

Deno.test("Token is operator", () => {
  const plusOperator = new Token(Tokens.PLUS, TOKEN_MAP.get(Tokens.PLUS)!, 0, 0, 0)

  expect(plusOperator.isOperator()).toBeTruthy()
})

Deno.test("instanceof is an operator", () => {
  const plusOperator = new Token(Tokens.INSTANCEOF, TOKEN_MAP.get(Tokens.INSTANCEOF)!, 0, 0, 0)

  expect(plusOperator.isOperator()).toBeTruthy()
})