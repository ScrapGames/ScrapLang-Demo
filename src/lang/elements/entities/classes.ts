import { Scope } from "../../../engine/scope.ts"
import { ScrapStatement } from "@lang/elements/commons.ts"
import { ClassEntityNode } from "@ast/nodes.ts"
import type { ClassMetadata } from "@typings"

/**
 * Represent a class
 * 
 * A class is the another way to create objects using a pattern to create objects with the same methods and properties, but with different values.
 * 
 * * A variable inside a class is called _property_ or _instance variable_
 * * A function inside a class is called _method_
 * 
 * Properties and methods can be declared to be used once the object has been instanced preceding the declaration of them with `public`.
 * If their declarations are not preceeded using `public`, then the property or method will only accessible inside the class meaning that is `private`.
 * 
 * A class also can inherit from other, meaning that the class that inherit from other can access to their properties or methods that are not `private`
 * 
 * @example
 * class MyClass {
 *  id: String
 *  public name: String
 *  public age: u8
 * 
 *  public constructor(id: String, name: String, age: u8) {
 *      this.id = id
 *      this.name = name
 *      this.age = age
 *  }
 * }
 * 
 * const juan = new MyClass(33344111L, "Juan", 20) // creating a object using `MyClass` as pattern
 * 
 * juan.name // correct, `name` has been declared using `public`
 * juan.id // error, `id` does not have a accessor modifier, this means is `private` and can only be accessible inside the class
 */
export class ScrapClass extends ScrapStatement {
    private scope: Scope
    private entities: ClassEntityNode[]
    private metadata: ClassMetadata
    private hasConstructor: boolean

    public constructor(
        className: string, isExported: boolean, scope: Scope,
        entities: ClassEntityNode[], metadata: ClassMetadata,
        hasConstructor: boolean
    ) {
        super(className, isExported)
        this.scope = scope
        this.entities = entities
        this.metadata = metadata
        this.hasConstructor = hasConstructor
    }

    public get getScoe()           { return this.scope }
    public get getEntities()       { return this.entities }
    public get getMetadata()        { return this.metadata }
    public get getHasConstructor() { return this.hasConstructor }
}