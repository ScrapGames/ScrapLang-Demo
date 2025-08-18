import Lexer from "@frontend/lexer/lexer.ts"

Deno.test("First scanned token", () => {
  using lexer = Lexer.init("tests/tiny.scrap")

  console.log(lexer.scan())
})

Deno.test("Reading file", () => {
  const file = Deno.openSync("tests/tiny.scrap")
  const buffer = new Uint8Array(1)
  const decoder = new TextDecoder("utf8")

  console.log(file.seekSync(0, Deno.SeekMode.Current))
  file.readSync(buffer)
  console.log(`Buffer: '${decoder.decode(buffer)}'`)

  console.log(file.seekSync(-1, Deno.SeekMode.Current))
  file.readSync(buffer)
  console.log(`Buffer: '${decoder.decode(buffer)}'`)

  file.close()
})

Deno.test("Go back", () => {
  using lexer = Lexer.init("tests/tiny.scrap")

  while (!lexer.hasEnd()) {
    console.log(lexer.scan())
  }
})
