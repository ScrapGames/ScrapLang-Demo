import Lexer from "@lexer/lexer.ts"
import Parser from "@parser/parser.ts"
import { Interpreter } from "@interpreter"

import { repl } from "@repl"
import { inArray } from "@utils"

import { createEmptyScope } from "@lang/scope.ts"
import { makeStdModule } from "@lang/api/native/std.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"

async function main() {
    if (inArray("--repl", args)) {
        repl()
    } else {

        const fileName = "./tests/tiny.scrap"
        const file = await Deno.readTextFile(fileName)
    
        const lex = new Lexer(file, fileName)
        if (lex.cursor.isEOF()) {
            console.warn(`Empty file, nothing to parse in ${lex.cursor.source}`)
        } else {
            const parser = new Parser(lex)
            addSTD(parser.mainModule.getScope)

            const interpreter = new Interpreter(parser.build())
            interpreter.run() // runs the program

            const mainFunction = parser.functions.find(func => func.getName === "main")
            
            if (!mainFunction)
                throw new RuntimeError("Missing program entrypoint (main function)")

            interpreter.execScrapFunction(mainFunction, new ScrapCall(parser.mainModule.getName, mainFunction, Deno.args.map(arg => new ScrapString(arg))))
            
            parser.warnings.forEach(warning => console.warn("Warning: %s", warning))
        }
    }
}

main()