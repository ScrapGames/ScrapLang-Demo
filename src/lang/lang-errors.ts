export class CompilationError extends Error {
    public constructor(message: string) {
        super(message)
        super.name = "CompilationError"
    }
}

export class RuntimeError extends Error {
    public constructor(message: string) {
        super(message)
        super.name = "RuntimeError"
    }
}