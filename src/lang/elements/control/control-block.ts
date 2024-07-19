import { ScrapTrue } from "@lang/elements/values/booleans.ts"
import { ScrapEntity, ScrapValue } from "@lang/elements/commons.ts"

export class ScrapControlBlock {
    private expression: ScrapTrue
    private body: (ScrapValue | ScrapEntity)[]

    public constructor(expression: ScrapTrue, body: (ScrapValue | ScrapEntity)[]) {
        this.expression = expression
        this.body = body
    }

    public get getExpression() { return this.expression }
    public get getBody() { return this.body }
}