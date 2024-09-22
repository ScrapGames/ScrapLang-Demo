import { ScrapTrue } from "@lang/elements/values/booleans.ts"

import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"
import { ScrapControlBlock } from "@lang/elements/control/control-block.ts"

import { Instructions } from "@typings"

export class ScrapFor extends ScrapControlBlock {
    private varDeclaration: ScrapVariable
    private valueModifier: ScrapValue

    public constructor(varDeclaration: ScrapVariable, expression: ScrapTrue, valueModifier: ScrapValue, body: Instructions[]) {
        super(expression, body)
        this.varDeclaration = varDeclaration
        this.valueModifier = valueModifier
    }

    public get getVarDeclaration() { return this.varDeclaration }
    public get getValueModifier() { return this.valueModifier }
}