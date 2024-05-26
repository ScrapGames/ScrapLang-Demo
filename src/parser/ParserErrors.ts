import Lexer from "../lexer/lexer.ts"

export default class ParsingError extends Error {
    public constructor(lexer: Lexer, reason: string) {
        super(
            `
            Error parsing at line ${lexer.line}, character position ${lexer.cursor.pos}:
            ${reason}
            `
        )

        this.name = "ParserError"
    }
}