import { Position } from "@frontend/position.ts"

export interface CallFrame {
  callee: string
  caller: string
  args: any[]
  pos: Position
}