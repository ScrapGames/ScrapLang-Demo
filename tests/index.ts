import Lexer from "@lexer/lexer.ts"
import Parser from "@parser/parser.ts"
import { Interpreter } from "@interpreter"

import { repl } from "@repl"
import { inArray } from "@utils"

import { createEmptyScope } from "@lang/scope.ts"
import { makeStdModule } from "@lang/api/native/std.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"

async function main() {
    if (inArray("--repl", Deno.args)) {
        repl()
    } else {
        const fileName = Deno.args[0]
        if (!(await exists(fileName, { isFile: true })))
            throw new Error(`'${fileName}' doesn't exists`)

        const file = await Deno.readTextFile(fileName)
    
        const lex = new Lexer(file, fileName)

        if (lex.cursor.isEOF()) {
            console.warn(`Empty file, nothing to parse in '${fileName}'`)
        } else {
            const std = makeStdModule()
            const mainMod = new ScrapModule(fileName, false, createEmptyScope(null, fileName))

            mainMod.insert("std", std)
            std.insert("fs", makeFSModule())

            Interpreter.run(new Parser(lex), mainMod, std)
        }
    }
}

main()