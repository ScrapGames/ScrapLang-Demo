/* import { DefinedFunction, ScrapNativeFn, ScrapObject, ScrapValue } from "@lang/elements/commons.ts"
import { scrapRuntimeError } from "@interpreter";
import guards from "@lang/elements/guards.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts";



const SCRAP_NET_SERVER_OBJECT = new ScrapObject()

const SCRAP_NET_CREATE_SERVER_FUNCTION = new ScrapNativeFn("createServer", true, 2, (...args: ScrapValue[]) => {
    if (guards.isDefinedFn(args[0]))
        scrapRuntimeError("First arg must be a function")

    if (guards.isNumber(args[1]))
        scrapRuntimeError("Second arg must be a string")

    return Deno.serve({ port: (args[1] as ScrapInteger).getValue }, (_) => {
        (args[0] as DefinedFunction).
    })
})

 */