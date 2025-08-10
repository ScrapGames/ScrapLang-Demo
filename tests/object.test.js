import { ScrapObject } from "@lang/elements/commons.ts"

const emptyObj = new Object()
emptyObj.nombre = "Juan"
emptyObj.edad = 30
emptyObj.matriculado = true
emptyObj.cod = "12345678M"
emptyObj.curso = "2º de DAW"

Object.defineProperties(emptyObj, {
  nombre: { value: "Juan", writable: false },
  edad: { value: 30 },
  matriculado: { value: true },
  cod: { value: "12345678M" },
  curso: { value: "2º de DAW" }
})

const obj = new ScrapObject(null, new Map())