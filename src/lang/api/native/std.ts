import { ScrapInteger } from "@lang/elements/values/numerics.ts"
import { ScrapValue, ScrapNativeFn } from "@lang/elements/commons.ts"

import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"
import { ScrapString } from "@lang/elements/values/textuals.ts"
import { RuntimeError } from "@lang/lang-errors.ts"

export const STD_SCRAP_PRINT = new ScrapNativeFn(
  "print", undefined, (...args: ScrapValue[]) => {
    console.log(...args)
    return new ScrapValue(undefined)
  }
)

const STD_SCRAP_PARSEINT = new ScrapNativeFn(
  "parseInt", 1, (...args: ScrapValue[]) => {
    if (!(args[0] instanceof ScrapString)) {
      const message = `'parseInt' expects a string, but received an ${args[0].constructor.name}`
      throw new RuntimeError(message)
    }

    return new ScrapInteger(parseInt(args[0].Value as string))
  }
)

const STD_SCRAP_TRUE = new ScrapVariable("true", true, new ScrapValue(true))
const STD_SCRAP_FALSE = new ScrapVariable("true", false, new ScrapValue(true))

export function makeStdModule() {
  const stdModule = new ScrapModule("std")

  // firstly, inserts functions
  stdModule.insert(STD_SCRAP_PRINT)
  stdModule.insert(STD_SCRAP_PARSEINT)

  // then, inserts variables / values
  stdModule.insert(STD_SCRAP_TRUE)
  stdModule.insert(STD_SCRAP_FALSE)

  return stdModule
}
