import { Entity, ScrapValue } from "../lang/expressions.ts"

export class ASTNode {
    private nodeValue: ScrapValue | Entity

    public constructor(nodeValue: ScrapValue | Entity) {
        this.nodeValue = nodeValue
    }

    public get getNodeValue() { return this.nodeValue }
}

export class AST {
    private program: ASTNode[]

    public constructor() {
        this.program = []
    }

    public pushNode(node: ScrapValue | Entity) {
        this.program.push(new ASTNode(node))
    }

    public get getProgram() { return this.program }
}