import { Reader } from "../typings.ts"

/**
 * String cursor for source file scanning
 */
export default class Cursor implements Reader<string, string, string> {
  source: string
  currentTok: string
  pos: number

  public constructor(filePath: string) {
    this.pos = 0
    this.source = Deno.readTextFileSync(filePath)
    this.currentTok = this.source[this.pos] // SAFETY INDEXING: source content is checked before cursor creation
  }

  next(): string {
    return this.nextN(1)
  }

  nextN(n: number): string {
    if (this.hasEnd())
      return this.currentTok

    return this.currentTok = this.source[this.pos += n]
  }

  ahead(): string {
    if (this.hasEnd())
      return this.currentTok

    return this.source[this.pos + 1]
  }

  check(maybe: string): boolean {
    return this.source[this.pos + 1] === maybe
  }

  hasEnd(): boolean {
    return this.pos === this.source.length
  }

  setTo(n: number): void {
    this.currentTok = this.source[this.pos = n]
  }
}
