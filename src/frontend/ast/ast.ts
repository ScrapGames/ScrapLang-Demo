import type { Position } from "@frontend/typings.ts"

export class ASTNode {
    public position: Position

    public constructor(position: Position) {
        this.position = position
    }
}
