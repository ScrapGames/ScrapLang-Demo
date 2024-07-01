import { Token } from "../lexer/lexer.ts"

export default class ParsingError extends Error {
    public constructor(reason: string, wrongToken: Token) {
        super(
            `
            Error parsing at line ${wrongToken.line}, character position ${wrongToken.pos}:
            ${reason}
            `
        )

        this.name = "ParserError"
    }
}