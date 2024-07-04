import Lexer from "../src/lexer/lexer.ts"
import Parser from "../src/parser/parser.ts"
import CompilationError from "../src/lang/compile-error.ts"

import { inArray } from "../src/utils.ts"
import { repl } from "../src/repl.ts"
import AST from "../src/ast/ast.ts"

const args = Deno.args

if (inArray("--repl", args)) {
    repl()
} else {

    const fileName = "./tests/tiny.scrap"
    const file = await Deno.readTextFile(fileName)

    const lex = new Lexer(file, fileName)
    const parser = new Parser(lex)
    const ast = AST.from(parser)

    const mainFunction = parser.functions.find(func => func.getName === "main")
    
    if (!mainFunction)
        throw new CompilationError("Missing program entrypoint (main function)")
    
    console.log(ast)
    parser.warnings.forEach(warning => console.warn("Warning: %s", warning))
}