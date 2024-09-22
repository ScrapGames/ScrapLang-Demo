import { ScrapTrue } from "@lang/elements/values/booleans.ts"
import { Instructions } from "@typings"

export class ScrapControlBlock {
    private expression: ScrapTrue
    private body: Instructions[]

    public constructor(expression: ScrapTrue, body: Instructions[]) {
        this.expression = expression
        this.body = body
    }

    public get getExpression() { return this.expression }
    public get getBody() { return this.body }
}