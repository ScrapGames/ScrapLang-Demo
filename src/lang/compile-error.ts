export default class CompilationError extends Error {
    public constructor(message: string) {
        super(message)
        super.name = "Compilation Error"
    }
}