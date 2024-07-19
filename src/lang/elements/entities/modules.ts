import { Scope } from "@lang/scope.ts"
import { ScrapEntity } from "@lang/elements/commons.ts"
import { Nameable } from "@typings"

/**
 * Represents a Module. Which is a accessible block of code that can be accessed via his accessor token. `::` in this case.
 * 
 * Not all the Module members are accessible. Only the members that was declared with `export` keywords.
 * 
 * @example
 * 
 * module MyModule {
 *  export const PI = 3.14
 * 
 *  const privateConstant = PI * 20
 * }
 * 
 * MyModule::PI // correct syntax, PI constant has been exported
 * 
 * MyModule::privateConstant // error: privateConstant was not exported from his module. Is only accessible inside the module it has been declared
 */
export class ScrapModule extends ScrapEntity {
    private scope: Scope

    public constructor(name: string, scope: Scope) {
        super(name)
        this.scope = scope
    }

    public insert(name: string, value: Nameable) {
        this.scope.addEntry(name, value)
    }

    public get getScope() { return this.scope }
}

export class DefinedModule extends ScrapModule {
    private body: Nameable[]

    public constructor(name: string, body: Nameable[], scope: Scope) {
        super(name, scope)
        this.body = body
    }

    public get getBody() { return this.body }
}