import { ScrapControlBlock } from "@lang/elements/control/control-block.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"
import { ScrapEntity, ScrapValue } from "@lang/elements/commons.ts"
import { ScrapTrue } from "@lang/elements/values/booleans.ts"

export class ScrapFor extends ScrapControlBlock {
    private varDeclaration: ScrapVariable
    private valueModifier: ScrapValue

    public constructor(varDeclaration: ScrapVariable, expression: ScrapTrue, valueModifier: ScrapValue, body: (ScrapValue | ScrapEntity)[]) {
        super(expression, body)
        this.varDeclaration = varDeclaration
        this.valueModifier = valueModifier
    }

    public get getVarDeclaration() { return this.varDeclaration }
    public get getValueModifier() { return this.valueModifier }
}