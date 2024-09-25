import { Scope } from "@lang/scope.ts"
import { ScrapEntity } from "@lang/elements/commons.ts"

import type { Nameable, Exportable } from "@typings"

/**
 * Represents a Module. Which is block which contains multiple entities that can be accessed via his accessor token `::`.
 * 
 * Only the entity members that was declared with `export` keywords can be accessed outside a module.
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
 * MyModule::privateConstant // error: privateConstant is not exported from his module. Is only accessible inside the module it has been declared
 */
export class ScrapModule extends ScrapEntity {
    private scope: Scope

    public constructor(name: string, isExported: boolean, scope: Scope) {
        super(name, isExported)
        this.scope = scope
    }

    /**
     * Stores an entity in the scope of `this` module and optionally, exports it
     * @param name Name of the inserted entity
     * @param value Stored entity
     * @param isExported flags which indicate if `value` entity is exported by `this` module
     */
    public insert(name: string, value: Nameable & Exportable) {
        this.scope.addEntry(name, value)
    }

    /**
     * Checks if an entity exists in `this` module
     * @param name of searched entity
     * @returns a reference to the searched entity if exists, `undefined` in other way
     */
    public getEntity(name: string): Nameable & Exportable | undefined {
        return this.scope.getReference(name)
    }

    public get getScope() { return this.scope }
}
