import { ScrapStatement, ScrapValue } from "@lang/elements/commons.ts"
import { Nameable } from "@typings"

/**
 * Represents a declaration. Either a constant or a variable
 * 
 * We calls variable to a value stored in memory. But this name is also received by a value that can change his value
 * 
 * In this case, we'll refer to variable as a value stored in memory and variable value to a value that can change his value
 * 
 * @example
 * const myConstant = 20
 * 
 * myConstant = 10 //! error, cant change the value of a constant variable
 * 
 * var myVariable = 20
 * 
 * myVariable = 10 // this will not cause an error because is a variable value
 */
export class ScrapVariable extends ScrapStatement implements Nameable {
    name: string
    public isConst: boolean
    private value: ScrapValue

    public constructor(name: string, isConst: boolean, value: ScrapValue) {
        super()
        this.name = name
        this.isConst = isConst
        this.value = value
    }

    public get Value() { return this.value }
    public set Value(value: ScrapValue) { this.value = value }
}