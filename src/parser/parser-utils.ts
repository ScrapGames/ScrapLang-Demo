import Parser from "./parser.ts"
import * as exp from "../lang/Expressions.ts"

export function parseString(this: Parser) {
    const stringExpr = new exp.ScrapString(this.cursor.currentTok.content)

    this.nextToken()
    return stringExpr
}

export function parseChar(this: Parser) {
    if (this.cursor.currentTok.content.length > 1)
      this.scrapParseError("Character content overflows the size of this type, only a character allowed")

    const charExpr = new exp.ScrapChar(this.cursor.currentTok.content)

    this.nextToken()
    return charExpr
}

export function parseNumber(this: Parser) {
    const numExpr = new exp.ScrapInteger(parseInt(this.cursor.currentTok.content))

    this.nextToken()
    return numExpr
}

export function parseFloatNumber(this: Parser) {
    const floatExpr = new exp.ScrapFloat(parseFloat(this.cursor.currentTok.content))

    this.nextToken()
    return floatExpr
}

  // TODO: still needs to be good
export function parseBinary(this: Parser) {
    const binaryLiteralExp = new exp.ScrapInteger(parseInt(this.cursor.currentTok.content, 2))

    this.nextToken()
    return binaryLiteralExp
}

export function parseOctal(this: Parser) {
    const octalLiteralExp = new exp.ScrapInteger(parseInt(this.cursor.currentTok.content, 8))

    this.nextToken()
    return octalLiteralExp
}

export function parseHexa(this: Parser) {
    const hexaLiteralExp = new exp.ScrapInteger(parseInt(this.cursor.currentTok.content, 16))

    this.nextToken()
    return hexaLiteralExp
}