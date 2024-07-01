import Lexer from "./lexer.ts"

export default class LexingError extends Error {
    public constructor(lexer: Lexer, message: string) {
        super(
            `
            Error lexing the file ${lexer.fileName} at line: ${lexer.line}, cursor position: ${lexer.cursor.pos}
            ${message}
            `
        )
    }
}