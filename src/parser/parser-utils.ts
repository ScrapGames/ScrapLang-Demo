import Parser from "@parser/parser.ts"
import { ScrapChar, ScrapString } from "@lang/elements/values/textuals.ts"
import { ScrapFloat, ScrapInteger } from "@lang/elements/values/numerics.ts"


export function parseString(this: Parser) {
    const stringExpr = new ScrapString(this.cursor.currentTok.content)

    this.nextToken()
    return stringExpr
}

export function parseChar(this: Parser) {
    if (this.cursor.currentTok.content.length > 1)
      this.scrapParseError("Character content overflows the size of this type, only a character allowed")

    const charExpr = new ScrapChar(this.cursor.currentTok.content)

    this.nextToken()
    return charExpr
}

export function parseNumber(this: Parser) {
    const numExpr = new ScrapInteger(parseInt(this.cursor.currentTok.content))

    this.nextToken()
    return numExpr
}

export function parseFloatNumber(this: Parser) {
    const floatExpr = new ScrapFloat(parseFloat(this.cursor.currentTok.content))

    this.nextToken()
    return floatExpr
}

  // TODO: still needs to be good
export function parseBinary(this: Parser) {
    const binaryLiteralExp = new ScrapInteger(parseInt(this.cursor.currentTok.content, 2))

    this.nextToken()
    return binaryLiteralExp
}

export function parseOctal(this: Parser) {
    const octalLiteralExp = new ScrapInteger(parseInt(this.cursor.currentTok.content, 8))

    this.nextToken()
    return octalLiteralExp
}

export function parseHexa(this: Parser) {
    const hexaLiteralExp = new ScrapInteger(parseInt(this.cursor.currentTok.content, 16))

    this.nextToken()
    return hexaLiteralExp
}