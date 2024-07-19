import { ScrapEntity, ScrapValue } from "@lang/elements/commons.ts"

export class ASTNode {
    private nodeValue: ScrapValue | ScrapEntity
    

    public constructor(nodeValue: ScrapValue | ScrapEntity) {
        this.nodeValue = nodeValue
    }

    public get getNodeValue() { return this.nodeValue }
}

export class AST {
    private program: ASTNode[]

    public constructor() {
        this.program = []
    }

    public pushNode(node: ScrapValue | ScrapEntity) {
        this.program.push(new ASTNode(node))
    }

    public get getProgram() { return this.program }
}