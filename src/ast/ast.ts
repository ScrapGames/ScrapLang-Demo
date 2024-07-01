import { EntityAST, ExpressionAST } from "./Expressions.ts"

export default class AST {
    private body: (ExpressionAST | EntityAST)[]

    public constructor() {
        this.body = []
    }

    public pushNode(node: ExpressionAST | EntityAST) {
        this.body.push(node)
    }
}