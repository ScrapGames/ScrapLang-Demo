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
        const fileName = "./tests/tiny.scrap"
        const file = await Deno.readTextFile(fileName)
    
        const lex = new Lexer(file, fileName)

        if (lex.cursor.isEOF()) {
            console.warn(`Empty file, nothing to parse in '${lex.fileName}'`)
        } else {
            const globalMod = new ScrapModule("MainModule", createEmptyScope(null, "MainModule"))
            globalMod.insert("std", makeStdModule())

            new Interpreter(new Parser(lex), globalMod).run()
        }
    }
}

main()