import { Position } from "@/position.ts"

export interface CallFrame {
  callee: string
  caller: string
  args: any[]
  pos: Position
}