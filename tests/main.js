const text = "I say hello 20 times"

const regexp = /[0-9]/g

Deno.test("Regexp testing", () => {
  let match = regexp.exec(text)
  while (match) {
    console.log(match)
    match = regexp.exec(text)
  }
})

Deno.test("prototype functions", () => {
  function Const() {
    this.nombre = "nombre"
  }
})