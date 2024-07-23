import stdModule from "@lang/api/native/std.ts"

import { createEmptyScope } from "@lang/scope.ts"
import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"

const streamModule = new ScrapModule("stream", createEmptyScope(stdModule.getScope, "stream"))

const NATIVE_INSTREAM = new ScrapVariable("constant", "stdin", new ScrapValue(Deno.stdin))
streamModule.insert(NATIVE_INSTREAM.name, NATIVE_INSTREAM)

export default streamModule