import Parser from "../parser/parser.ts";
import { EntityAST, Function } from "./Expressions.ts"

export default class AST {
    private body: (Function | EntityAST)[]

    public constructor(parser: Parser) {
        this.body = []
        while (parser.cursor.isEOF()) {
            this.body.push(parser.parsePrimary(parser.mainModule.getScope))
        }
    }

    public pushNode(node: Function | EntityAST) {
        this.body.push(node)
    }

    public static from(parser: Parser): AST {
        const ast = new this(parser)

        while (!parser.cursor.isEOF()) {
            ast.pushNode(parser.parsePrimary(parser.mainModule.getScope))
        }

        return ast
    }
}