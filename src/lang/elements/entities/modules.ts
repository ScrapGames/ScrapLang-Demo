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
    private exports: Set<string>

    public constructor(name: string, scope: Scope, exports?: Set<string>) {
        super(name)
        this.scope = scope
        this.exports = exports ?? new Set()
    }

    public insert(name: string, value: Nameable, isExported?: true) {
        this.scope.addEntry(name, value)
        if (isExported)
            this.exports.add(value.name)
    }

    public getEntity(name: string) {
        return this.scope.getReference(name)
    }

    public isExported(entityName: string) {
        return this.exports.has(entityName)
    }

    public get getExports() { return this.exports } 

    public get getScope() { return this.scope }
}