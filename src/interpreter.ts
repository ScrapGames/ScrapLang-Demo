import * as exp from "./lang/expressions.ts"
import Parser from "./parser/parser.ts"

export class Interpreter {

    private parser: Parser

    public constructor(parser: Parser) {
        this.parser = parser
    }

    private execScrapNative(value: exp.ScrapNative, calle: exp.ScrapCall) {
        const computedArgs = calle.getArgs.map(arg => this.compute(arg))
        return this.compute(value.getAction(...computedArgs))
    }

    public execScrapFunction(value: exp.ScrapFunction, callee: exp.ScrapCall) {
        const _computedArgs = callee.getArgs.map(arg => this.compute(arg))

        for (const val of value.getBody)
            this.compute(val)

        return value.getReturnType
    }

    private resolveExecutor(value: exp.ScrapCall) {
        const calledFunction = value.getCalled

        if (calledFunction instanceof exp.ScrapNative)
            return this.execScrapNative(calledFunction, value)
        else
            return this.execScrapFunction(calledFunction, value)

    }

    private computeVariable(value: exp.ScrapVariable): exp.ScrapValue {
        return this.compute(value.getAssignedValue)
    }

    private computeAssignment(value: exp.AssignmentExpression) {
        const newValue = value.getValue as exp.ScrapValue
        value.getVarCandidate.setAssignedValue = newValue

        return newValue
    }

    public compute(value: exp.ScrapValue | exp.Entity): exp.ScrapValue {
        switch (true) {
            case value instanceof exp.ScrapCall: return this.resolveExecutor(value)
            case value instanceof exp.ScrapVariable: return this.computeVariable(value)
            case value instanceof exp.AssignmentExpression: return this.computeAssignment(value)
            case value instanceof exp.ScrapArray: {
                return new exp.ScrapArray(value.getValue.map((item: exp.ScrapValue) => this.compute(item).getValue))
            }

            case value instanceof exp.ScrapValue: return new exp.ScrapValue(value.getValue)

            default: throw new Error("ScrapValue or Entity can not be computed yet")
        }
    }

    public run() {
        const program = this.parser.ast.getProgram

        for (const node of program)
            this.compute(node.getNodeValue)
    }

    public get getParser() { return this.parser }
}
