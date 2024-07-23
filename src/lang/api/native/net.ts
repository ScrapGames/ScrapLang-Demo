import stdModule from "@lang/api/native/std.ts"
import { createEmptyScope } from "@lang/scope.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapNative, ScrapValue } from "@lang/elements/commons.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts";
import { ScrapString } from "@lang/elements/values/textuals.ts";

const netModule = new ScrapModule("net", createEmptyScope(stdModule.getScope, "net"))

const SCRAP_CREATESERVER_FUNCTION = new ScrapNative("createServer", 2, (...args: ScrapValue[]) => {
    const httpServer = Deno.serve({ port: args[0].getValue as number }, (_req: Request) => new Response(args[1].getValue as string))

    return new ScrapValue(httpServer)
})
netModule.insert("createServer", SCRAP_CREATESERVER_FUNCTION, true)

const SCRAP_CONNECT_FUNCTION = new ScrapNative("connect", 2, (...args: ScrapValue[]) => {
    const { 0: port, 1: hostname } = args

    Deno.connect({ port: (port as ScrapInteger).getValue, hostname: (hostname as ScrapString).getValue })

    return new ScrapValue("Here goes an connection object")
})
netModule.insert("connect", SCRAP_CONNECT_FUNCTION, true)

export default netModule