import { exists } from "jsr:@std/fs"

import Lexer from "@frontend/lexer/lexer.ts"
import Parser from "../src/frontend/parser/base.ts"
import type { MixedParser } from "@frontend/typings.ts"

import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { makeStdModule } from "@lang/api/native/std.ts"

import { repl } from "@repl"
import { inArray } from "@utils"

async function main() {
    if (inArray("--repl", Deno.args)) {
        repl()
    } else {
        const file = Deno.args[0]
        if (!file)
            throw new Error("Missing script location. Specify a entrypoint file as first argument")
        if (!(await exists(file, { isFile: true })))
            throw new Error(`'${file}' doesn't exists`)

        const source = await Deno.readTextFile(file)
        const lex = new Lexer(file)

        if (lex.HasEnd) {
            console.warn(`Empty file, nothing to parse in '${file}'`)
        } else {
            const fileName = checkExtension(file)
            const std = makeStdModule()
            const mainMod = new ScrapModule(fileName)

            mainMod.insert(std)

            const parser = new Parser(lex) as MixedParser
            const ast = parser.build()
            console.log(ast.Program[0])
            //Interpreter.run(new Parser(lex), mainMod, std)
        }
    }
}

main()
