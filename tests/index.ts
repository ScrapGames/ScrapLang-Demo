import Lexer from "../src/lexer/lexer.ts"
import Parser from "../src/parser/parser.ts"
import CompilationError from "../src/lang/compile-error.ts"

import { inArray } from "../src/utils.ts"
import { repl } from "../src/repl.ts"
import AST from "../src/ast/ast.ts"
import STD from "../src/lang/std.ts"

const args = Deno.args

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
            parser.addToScope(parser.mainModule.getScope, "std", STD)
            const ast = AST.from(parser)
        
            const mainFunction = parser.functions.find(func => func.getName === "main")
            
            if (!mainFunction)
                throw new CompilationError("Missing program entrypoint (main function)")
            
            console.log(ast)
            parser.warnings.forEach(warning => console.warn("Warning: %s", warning))
        }
    }
}

main()