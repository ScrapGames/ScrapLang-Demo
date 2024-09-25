import Lexer from "@lexer/lexer.ts"
import Parser from "@parser/parser.ts"
import { Interpreter } from "@interpreter"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { makeStdModule } from "@lang/api/native/std.ts"
import { createEmptyScope } from "@lang/scope.ts"

/**
 * Prints the info about the ScrapLang REPL in the console
 */
function printReplInfo() {
    console.log("Welcome to ScrapLang v0.0.1. Thanks you for use this new programming language!")
    console.log("Type \".help\" for more info")
}

/**
 * Available ScrapLang commands for: info, exit or license. More will be added in the future
 */
const REPL_COMMANDS = {
    ".exit": Deno.exit,
    ".help": "Help about ScrapLang at https://lang.scrapgames.com",
    ".license": "ScrapLang is licensed under the MIT License"
}

/**
 * Starts the REPL of ScrapLang
 */
export function repl() {
    printReplInfo()
    let input

    while (true) {
        input = prompt(">>> ")!
        if (input === ".exit")
            REPL_COMMANDS[input](Deno.exitCode)
        else if (input === ".help" || input === ".license")
            console.info(REPL_COMMANDS[input])
        else {
            const fileName = "REPL"
            const lex = new Lexer(input, fileName)

            const globalMod = new ScrapModule("MainModule", false, createEmptyScope(null, "MainModule"))
            globalMod.insert("std", makeStdModule())

            Interpreter.run(new Parser(lex), globalMod)
        }
    }
}