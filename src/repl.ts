import Lexer from "./lexer/lexer.ts"
import Parser from "./parser/parser.ts"

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
    const lexer = new Lexer("", "repl")
    const parser = new Parser(lexer)
    let input

    while (true) {
        input = prompt(">>> ")!
        if (input === ".exit")
            REPL_COMMANDS[input](Deno.exitCode)
        else if (input === ".help" || input === ".license")
            console.log(REPL_COMMANDS[input])
        else {
            lexer.alsoScan("repl", input)
            parser.restart()
            try {
                console.log(parser.parsePrimary())
            } catch (error) {
                console.error("error:\n %s", error)
            }
        }
    }
}