import { ScrapArray } from "@lang/elements/values/array.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts"

const arr = new ScrapArray([])

for (let i = 0; i < 100; i++) {
    arr.push(new ScrapInteger(i))
}

console.log(arr.slice(4).length)

console.log(arr.length)