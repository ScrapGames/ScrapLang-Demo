import { scrapRuntimeError } from "@interpreter"
import { createEmptyScope } from "@lang/scope.ts"

import { ScrapArray } from "@lang/elements/values/array.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapNativeFn, ScrapValue } from "@lang/elements/commons.ts"

import TypeGuards from "@lang/elements/guards.ts"

import { exists } from "@std/fs/exists"
import { ScrapTrue } from "@lang/elements/values/booleans.ts"

export const SCRAP_FS_READDIR_FUNCTION = new ScrapNativeFn("readDir", true, 1, (...args: ScrapValue[]) => {
    const read = Deno.readDirSync(args[0].getValue as string)
    const items: string[] = []

    for (const item of read)
        items.push(item.name)

    return new ScrapArray(items)
})

export const SCRAP_FS_CREATEFILE_FUNCTION = new ScrapNativeFn("createFile", true, 1, (...args: ScrapValue[]) => {
    if (!TypeGuards.isString(args[0]))
        scrapRuntimeError("Path must be an string")

    exists(args[0].getValue as string)
        .then(rlly => 
            !rlly ?
                Deno.create(args[0].getValue as string) :
                scrapRuntimeError(`File '${args[0].getValue}' already exists`))
    
    return new ScrapTrue()
})

export function makeFSModule() {
    const fsModule = new ScrapModule("fs", true, createEmptyScope(null, "fs"))

    // firstly, inserts functions
    fsModule.insert("readDir", SCRAP_FS_READDIR_FUNCTION)
    fsModule.insert("createFile", SCRAP_FS_CREATEFILE_FUNCTION)

    return fsModule
}