import { ScrapArray } from "@lang/elements/values/array.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapNativeFn } from "@lang/elements/commons.ts"
import { ScrapString } from "@lang/elements/values/textuals.ts";

const HISPAN_SENTENCES = new ScrapArray([
    new ScrapString("Un buen español siempre debería de mear mirando a Inglaterra"),
    new ScrapString("Si al grito de '¡Viva España!' otro '¡Viva!' no responde; si es hombre no es español, y si es español no es hombre")
])
const HISPAN_RANDOM_SENTENCE = new ScrapNativeFn("random", 0, () => {
    return HISPAN_SENTENCES.at(Math.random() * HISPAN_SENTENCES.length)
})

export function makeHispanModule(): ScrapModule {
    const hispanModule = new ScrapModule("hispan")

    // firstly, inserts functions
    hispanModule.insert(HISPAN_RANDOM_SENTENCE)

    return hispanModule
}