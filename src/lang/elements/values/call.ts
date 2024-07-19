import { ScrapFunction, ScrapValue } from "@lang/elements/commons.ts"

/**
 * Represents the call to a function
 */
export class ScrapCall extends ScrapValue {
    private caller: string
    private called: ScrapFunction
    private args: ScrapValue[]

    public constructor(caller: string, called: ScrapFunction, args: ScrapValue[]) {
        super(undefined)
        this.caller = caller
        this.called = called
        this.args = args
    }

    public get getCaller() { return this.caller }
    public get getCalled() { return this.called }
    public get getArgs() { return this.args }
}