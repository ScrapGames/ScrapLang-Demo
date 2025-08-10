import { expect } from "jsr:@std/expect"
import Lexer from "@frontend/lexer/lexer.ts"
import { Tokens } from "../tokens/tokens.ts"

Deno.test("First scanned token", () => {
  const lexer = new Lexer("tests/tiny.scrap")

  console.log(lexer.scan())
})

Deno.test("Reading file", () => {
  const file = Deno.openSync("tests/tiny.scrap")
  const buffer = new Uint8Array(1)
  const decoder = new TextDecoder("utf8")

  console.log(file.readSync(buffer))
  console.log(file.readSync(buffer))
  console.log(decoder.decode(buffer))

  console.log(file.seekSync(-1, Deno.SeekMode.Current))
  console.log(file.readSync(buffer))
  console.log(decoder.decode(buffer))

  file.close()
})

Deno.test("Go back", () => {
  using lexer = new Lexer("tests/tiny.scrap")

  expect(lexer.scan().type).toBe(Tokens.FN)
})
