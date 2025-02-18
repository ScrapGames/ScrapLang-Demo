import { Token } from "@lexer/lexer.ts"
import type { Nameable, Nullable } from "@typings"

const { ReferenceError } = globalThis

export class Scope {
    private parentScope: Nullable<Scope>
    private belongsTo: string
    private scopedEntities: Map<string, Nameable>

    public constructor(parentScope: Nullable<Scope>, belongsTo: string) {
        this.parentScope = parentScope
        this.belongsTo = belongsTo
        this.scopedEntities = new Map()
    }

    /**
     * Checks that a variable exists in `this` object scope and superior scopes if exists
     * @param name Name of the variable, which is unique
     * @returns true, if was already registered, false in other case
     */
    public searchReference(name: string): boolean {
        if (this.scopedEntities.has(name))
            return true
        else if (this.parentScope !== null)
            return this.parentScope.searchReference(name)
        else
            return false
    }

    /**
     * Adds an entry to the current scope object
     * @param name Name of the entry
     * @param value Value of the entry
     * @returns boolean, if the entry already exists, true in other case
     */
    public addEntry(name: string, value: Nameable): boolean {
        if (this.searchReference(name))
            return false
        this.scopedEntities.set(name, value)
        return true

    }

    /**
     * Gets the value stored in `this` scope or parents scopes of `this`
     * @param name Name of the variable (or entity)
     * @returns The variable, if has been stored using `addEntry`, undefined otherwise
     */
    public getReference(name: string): Nameable | undefined {
        if (this.scopedEntities.get(name) !== undefined)
            return this.scopedEntities.get(name)
        else if (this.parentScope !== null)
            return this.parentScope.getReference(name)
        else
            return undefined
    }

    public get getParentScope() { return this.parentScope }

    public set setParentScope(newParentScope: Scope) { this.parentScope = newParentScope }

    public get getOwner() { return this.belongsTo }

    public get getScopedEntities() { return this.scopedEntities }
}

/**
 * Creates a new empty `Scope` for the entitiy `belongsTo` parameter
 * @param belongsTo The entity which belongs the new Scope
 * @returns A new `Scope` where his `scopedEntities` Map is empty
 */
export function createEmptyScope(parentScope: Nullable<Scope>, belongsTo: string): Scope {
    return new Scope(parentScope, belongsTo)
}

/**
 * Throwed when a variabled is referenced but it is not undefined
 */
export class UndefinedReferenceError extends ReferenceError {
    public constructor(undefinedReference: Token) {
        super(
            `
            ReferenceError at: ${undefinedReference.line}:${undefinedReference.pos}
            '${undefinedReference.content}' is not defined
            `
        )
        this.name = "UndefinedReferenceError"
    }
}