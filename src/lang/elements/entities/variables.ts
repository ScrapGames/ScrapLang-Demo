import { ScrapEntity, ScrapValue } from "@lang/elements/commons.ts"

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
export class ScrapVariable extends ScrapEntity {
    public isConst: boolean
    private val: ScrapValue

    public constructor(
        isConst: boolean, name: string,
        assignedValue: ScrapValue, isExported: boolean
    ) {
        super(name, isExported)
        this.isConst = isConst
        this.val = assignedValue
    }

    public get getVal() { return this.val }

    public set setVal(newVal: ScrapValue) { this.val = newVal }
}