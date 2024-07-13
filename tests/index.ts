import Lexer from "../src/lexer/lexer.ts"
import Parser from "../src/parser/parser.ts"
import AST from "../src/ast/ast.ts"

import { CompilationError } from "../src/lang/lang-errors.ts"
import { inArray } from "../src/utils.ts"
import { repl } from "../src/repl.ts"
import { addSTD } from "../src/lang/std.ts"

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
            //! provisional change, this will be replaced in the future by the previous way to embbed STD
            addSTD(parser.mainModule.getScope)

            const ast = AST.from(parser)
            const mainFunction = parser.functions.find(func => func.getName === "main")
            
            if (!mainFunction)
                throw new CompilationError("Missing program entrypoint (main function)")
            
            //console.log(ast)
            parser.warnings.forEach(warning => console.warn("Warning: %s", warning))
        }
    }
}

main()