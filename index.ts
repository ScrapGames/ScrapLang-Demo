import Lexer from "./src/lexer/lexer.ts"
import Parser from "./src/parser/parser.ts"
import CompilationError from "./src/utils/CompileError.ts"

const fileName = "./tiny.scrap"
const reader = new TextDecoder()

const file = reader.decode(await Deno.readFile(fileName))
const lex = new Lexer(file, fileName)

const parser = new Parser(lex)

do {
    console.log(parser.parsePrimary())
    //parser.parsePrimary()
} while (!parser.cursor.isEOF())

console.log("\n")

if (!parser.functions.find(func => func.getName === "main")) {
    throw new CompilationError("Missing program entrypoint (main function)")
}

parser.warnings.forEach(warning => console.warn("Warning: %s", warning))