//import { parseArgs } from "@std/cli/parse-args"

import Lexer from "./src/lexer/lexer.ts"
import Parser from "./src/parser/parser.ts"
import CompilationError from "./src/lang/CompileError.ts"

import { inArray } from "./src/utils.ts"
import { repl } from "./src/repl.ts"

const fileName = "./tiny.scrap"

const file = await Deno.readTextFile(fileName)
const lex = new Lexer(file, fileName)

const parser = new Parser(lex)
const globalScope = parser.globalScope

//const args = parseArgs(Deno.args)

const args = Deno.args

if (!inArray("--repl", args)) {
    repl()
} else {
    do {
        parser.parsePrimary()
    } while (!parser.cursor.isEOF())
    
    console.log("\n")
    
    const mainFunction = parser.functions.find(func => func.getName === "main")
    
    if (!mainFunction)
        throw new CompilationError("Missing program entrypoint (main function)")
    
    console.log(globalScope)
    parser.warnings.forEach(warning => console.warn("Warning: %s", warning))
    //console.log("Main function scope\n", parser.functions[parser.functions.length - 1].getScope)
}