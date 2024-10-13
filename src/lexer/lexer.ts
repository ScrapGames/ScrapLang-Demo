/**
 * Lexer/Scanner prototype for ScrapLang
 * 
 * Lexer scan a file and reads his contents to get tokens that correspond to the tokens defined in the language syntax
 * For example, const, fn, enum... are keywords and Lexer identifies as such
 * 
 * If Lexer founds a keyword or another token that is invalid, will throw an error
 */

import { isAlpha, isNumeric, isAlphaNum, isSpace, isHexadecimal, inArray } from "@utils"

import LexingError from "@lexer/lexer-error.ts"
import LexerCursor from "@lexer/lexer-cursor.ts"

import { isAlpha, isNumeric, isAlphaNum, isSpace, isHexadecimal, inArray } from "@utils"

const VALID_HEXADECIMAL_END = [
  'A', 'B', 'C',
  'D', 'E', 'F'
]

function createTokFromKeyword(identifier: string, line: number, pos: number): Token {
  switch (identifier) {
    case Keywords.FN:
    case Keywords.VAR:
    case Keywords.CONST:
    case Keywords.RETURN:
    case Keywords.IMPORT:
    case Keywords.FROM:
    case Keywords.EXPORT:
    case Keywords.CLASS:
    case Keywords.TYPE:
    case Keywords.INTERFACE:
    case Keywords.ENUM:
    case Keywords.EXTENDS:
    case Keywords.IMPLEMENTS:
    case Keywords.MODULE:
    case Keywords.FOR:
    case Keywords.WHILE:
    case Keywords.DO:
    case Keywords.BREAK:
    case Keywords.SKIP: // same as continue in other languages
    case Keywords.IF:
    case Keywords.ELSE:
    case Keywords.ELIF:
    case Keywords.SWITCH:
    case Keywords.CASE:
    case Keywords.DEFAULT:
    case Keywords.IN:
    case Keywords.OF:
    case Keywords.TRY:
    case Keywords.CATCH:
    case Keywords.AS:
    case Keywords.NEW:
    case Keywords.DROP:
    case Keywords.PUBLIC:
    case Keywords.PRIVATE:
    case Keywords.PROTECTED:
    case Keywords.STATIC:
    case Keywords.OVERRIDE:
    case Keywords.SETTER:
    case Keywords.GETTER:
    case Keywords.ASYNC:
    case Keywords.AWAIT: return createToken(identifier, "Keyword", line, pos)

    case Keywords.AND:
    case Keywords.OR:
    case Keywords.NOT:
    case Keywords.INSTANCEOF: return createToken(identifier, "Operator", line, pos)

    default: return createToken(identifier, "IdentifierName", line, pos)
  }
}

export default class Lexer {
  cursor: LexerCursor
  fileName: string
  line: number

  public constructor(source: string, fileName: string) {
    this.cursor = new LexerCursor(source)
    this.fileName = fileName
    this.line = 1
  }

  /**
   * Sets the a lexer object ready to read a new file and tokenize his content
   * @param otherFileName Name of the new file to be scanned
   * @param otherSource 
   */
  public alsoScan(otherFileName: string, otherSource: string) {
    // Configure the lexer
    this.line = 1
    this.fileName = otherFileName

    // configure the cursor
    this.cursor.source = otherSource
    this.cursor.currentTok = otherSource.at(0)!
    this.cursor.pos = 1
  }

  private createToken(content: string, type: TokenType) {
    return createToken(content, type, this.line, this.cursor.pos)
  }

  /**
   * Returns the next char, advancing the cursor 1 position
   * @returns the next char in the input
   */
  private consume() { return this.cursor.consume() }

  private nextToken() { return this.cursor.currentTok = this.cursor.consume() }

  /**
   * Aux method to check the next token
   * @param char Possible next char
   * @returns 
   */
  private checkNext(char: string): boolean {
    return this.cursor.next() === char
  }

  /**
   * Checks if a numeric separator exists in the current position of the cursor (_)
   */
  private checkNumericSeparators() {
    if (this.cursor.currentTok === Tokens.UNDERSCORE) {
      if (this.checkNext(Tokens.UNDERSCORE))
        throw new LexingError(this, "Multiple consecutive numeric separators are not permitted")
      
      /**
       * Using `isHexadecimal` because include all the possibles characters after a numeric separator
       * 
       * TODO: refactor functions name at `src/utils.ts`
       */
      if (!isHexadecimal(this.cursor.previous()) || !isHexadecimal(this.cursor.next()))
        throw new LexingError(this, "Numeric separators are now allowed here")

      this.nextToken()
    }
  }

  private scanOperationalAssign() {
    if (this.checkNext(Tokens.EQUAL))
      return this.createToken(this.cursor.currentTok + this.nextToken(), "Operator",)

    return this.createToken(this.cursor.currentTok, "Operator")
  }

  /**
   * Analize if the operator is an increment or decrement operator
   * @returns 
   */
  private scanAdjustOperator() {
    switch (this.cursor.currentTok) {
      case Tokens.PLUS:
      case Tokens.MINUS: {
        if (this.checkNext(this.cursor.currentTok))
          return this.createToken(this.cursor.currentTok + this.nextToken(), "Operator")
      }
    }

    return this.scanOperationalAssign()
  }

  /** 
   * This method inits a call chain of other two methods. These methods analize the type of binary arithmetic operator which correspond to the source
   * 
   * 1. The chain starts calling this method, which analize if the current token is `-` and the next token is a '>' token.
   *    If this condition returns true, then token is a lambda arrow `->`
   * 
   * 2. Additionally, also checks for 
   * 
   * 2. The second check that performs (if the first fails) is call `scapOperator` method, which will check if the next token has the same content that current tok
   *    If this condition returns true, then the token is an operator that increment `++` or decrement `--` a value
   * 
   * 3. Finally if previous checks fails, simply return the current tok as an operator, e.g: plus `+` or minus `-`
   * @returns 
   */
  private initOperatorScan() {
    if (this.cursor.currentTok === Tokens.MINUS && this.checkNext(Tokens.GREATER))
      return this.createToken(this.cursor.currentTok + this.nextToken(), "Token")

    return this.scanAdjustOperator()
  }

  private scanBinary() {
    let binaryNum = ""
    do {
      this.checkNumericSeparators()

      if (/[0-1]/.test(this.cursor.currentTok))
        binaryNum += this.cursor.currentTok
      else
        throw new LexingError(this, "Invalid binary literal. Binary literals may only contains 0 and 1 digits")

      this.nextToken()
    } while (!this.cursor.isEOF() && (isNumeric(this.cursor.currentTok) || isAlpha(this.cursor.currentTok)))

    return binaryNum
  }

  private scanOctal() {
    let octalNum = ""

    do {
      this.checkNumericSeparators()

      if (/[0-7]/.test(this.cursor.currentTok))
        octalNum += this.cursor.currentTok
      else
        throw new LexingError(this, "Invalid octal literal. Octal literals may only contains digits from 0 to 7")

      this.nextToken()
    } while (!this.cursor.isEOF() && (isNumeric(this.cursor.currentTok) || isAlpha(this.cursor.currentTok)))
    
    return octalNum
  }

  private scanHexadecimal() {
    let hexaNum = ""
    do {
      this.checkNumericSeparators()

      if (isHexadecimal(this.cursor.currentTok)) {
        hexaNum += this.cursor.currentTok
      }
      else {
        throw new LexingError(this, "Invalid hexadecimal literal. Hexadecimal literals may only contains: numeric range from 0 to 9 and characters ranges from 'A' to 'F'")
      }

      this.nextToken()
    } while (!this.cursor.isEOF() && isNumeric(this.cursor.currentTok) || isAlpha(this.cursor.currentTok))

    return hexaNum
  }

  public tokens(): Token[] {
    const tokens: Token[] = []
    let identifier = ""
    let numericIdentifier = ""
  
    while (!this.cursor.isEOF()) {
      this.nextToken()
  
      while (isSpace(this.cursor.currentTok))
        this.nextToken()
  
      if (this.cursor.currentTok === '\n') {
        this.line++
      }
  
      // Validation only with alphabetic characters
      // occurs because a variable or another recognizer, token, identifier, etc
      // can not start with a number, because a comparation between if a token is a number or an identifier will overlap
      // for example, var 1test = "test" is incorrect
      // the correct way to declare this variable would be: var test1 = "test"
      if (isAlpha(this.cursor.currentTok)) {
        identifier = ""
  
        // since other recognizers, tokens, identifiers, etc as of the first character
        // can contains numbers, we accept numbers after the first character too
        // example: var t12345 = 10
  
        do {
          identifier += this.cursor.currentTok
        } while (!this.cursor.isEOF() && isAlphaNum(this.nextToken()))
  
        tokens.push(createTokFromKeyword(identifier, this.line, this.cursor.pos))
      }
  
      if (isNumeric(this.cursor.currentTok)) {
        numericIdentifier = ""
        let isFloat = false, isHexadecimalVal = false, isOctal = false, isBinary = false
  
        do {
          this.checkNumericSeparators()

          // If reachs a dot, means it is a float, but a dot can not appears in wherever
          if (this.cursor.currentTok === Tokens.DOT) {
            if (isFloat) // if the current lexed number, was already marked as a float
              throw new LexingError(this, `Invalid float literal. Only a dot is permitted to separate the tens from the decimals`)

            if (isBinary || isOctal || isHexadecimalVal)
              throw new LexingError(this, `Numeric literal can not be a float value since the number was leading with an ${numericIdentifier.substring(0, 2)}.
            It is considered an integer, not a float`)

            isFloat = true
          }

          // At the start, if the number starts with 0, means that a literal will be preceed the 0
          // Example: if you want write a octal literal integer, then you must writes: 0o44. Then ScrapLang will convert the value to an integer with decimal base (10)
          if (this.cursor.currentTok === '0' && numericIdentifier.length === 0) {
            numericIdentifier += this.cursor.currentTok
            const nextTok = this.cursor.next()

            if (isAlpha(nextTok) || isNumeric(nextTok)) {
              switch (nextTok) {
                case 'b': case 'B': isBinary = true; break
                case 'o': case 'O': isOctal = true; break
                case 'x': case 'X': isHexadecimalVal = true; break
  
                default: {
                  throw new LexingError(
                    this,
                  `Invalid literal, place 'b', 'o' or 'x' after 0.
            Learn more at: https://lang.scrapgames.com/tutorial/numeric_literals`
                  );
                }
              }

              this.nextToken()
            }
          }

          
          switch (numericIdentifier.substring(0, 2)) {
            // If the number is a literal integer with base not 10 (binary, octal or hexadecimal)
            case "0b": case "0B": numericIdentifier = this.scanBinary(); break
            case "0o": case "0O": numericIdentifier = this.scanOctal(); break
            case "0x": case "0X": {
              numericIdentifier = this.scanHexadecimal()
            } break

            // else, then the parsed number its a number with base 10 or a float (floast is base 10 too)
            default: numericIdentifier += this.cursor.currentTok
          }
        } while (!this.cursor.isEOF() && isNumeric(this.nextToken()) || this.cursor.currentTok === Tokens.DOT || isAlpha(this.cursor.currentTok))

        // after the while, lets make another tests
        const lastNumericIdChar = numericIdentifier.charAt(numericIdentifier.length - 1)
        if (isHexadecimalVal) {
          if (!isNumeric(lastNumericIdChar) && !inArray(lastNumericIdChar.toUpperCase(), VALID_HEXADECIMAL_END)) {
            throw new LexingError(this, `Wrong hexadecimal character, only allowed: 0-9, ${VALID_HEXADECIMAL_END.join(", ")}. (is also valid as lowercase characters)`)
          }
        }

        if (!isNumeric(lastNumericIdChar)) {
          if (!isHexadecimalVal)
            throw new LexingError(this, "A number must ends with numeric character")
        }

        if (isBinary)
          tokens.push({ type: "BinaryLiteral", content: numericIdentifier, line: this.line, pos: this.cursor.pos })
        else if (isOctal)
          tokens.push({ type: "OctalLiteral", content: numericIdentifier, line: this.line, pos: this.cursor.pos })
        else if (isHexadecimalVal)
          tokens.push({ type: "HexaLiteral", content: numericIdentifier, line: this.line, pos: this.cursor.pos })
        else if (isFloat)
          tokens.push({ type: "FloatLiteral", content: numericIdentifier, line: this.line, pos: this.cursor.pos })
        else
          tokens.push({ type: "NumericLiteral", content: numericIdentifier, line: this.line, pos: this.cursor.pos })
      }
  
      /**
       * Finally, if `currentTok` doesnt match with any 'if' statement
       * We match what means every single token, like '+', '-', '*'
       */
      switch (this.cursor.currentTok) {
        case Tokens.LBRACE:
        case Tokens.RBRACE:
        case Tokens.LPAREN:
        case Tokens.RPAREN:
        case Tokens.LSQRBR:
        case Tokens.RSQRBR:
        case Tokens.COMMA:
        case Tokens.AMPER:
        case Tokens.EQUAL:
        case Tokens.ESP:
        case Tokens.SEMICOLON:
        case Tokens.EXCLAMATION:
        case Tokens.INTERROGATION: {
          tokens.push({ type: "Token", content: this.cursor.currentTok, line: this.line, pos: this.cursor.pos })
        } break
  
        case Tokens.GREATER:
        case Tokens.LESS: break
        case Tokens.PLUS:
        case Tokens.MINUS:
        case Tokens.STAR:
        case Tokens.SLASH: {
          if (this.checkNext(Tokens.SLASH)) {
            do {
              this.cursor.currentTok = this.consume() // manual assingment instead use `nextToken` to avoid overlaped comparations
            } while (this.cursor.currentTok !== '\n' && !this.cursor.isEOF())
          } else if (this.checkNext(Tokens.STAR)) {
            let stillIgnoring = true
            while (stillIgnoring) {
              this.nextToken()

              if (this.cursor.currentTok === Tokens.STAR) {
                if (this.checkNext(Tokens.SLASH)) {
                  this.cursor.currentTok = this.cursor.doubleConsume()
                  stillIgnoring = false
                }
              }
            }
          }

          if (this.cursor.currentTok === "\n")
            continue
          tokens.push(this.initOperatorScan())
        } break
  
        case Tokens.QUOTE: {
          identifier = this.nextToken()

          if (!this.checkNext(Tokens.QUOTE)) {
            while (this.nextToken() !== Tokens.QUOTE)
              identifier += this.cursor.currentTok
          }
  
          tokens.push({ type: "CharLiteral", content: identifier, line: this.line, pos: this.cursor.pos })
        } break
  
        case Tokens.BACKSTICK: {
          identifier = this.nextToken()
  
          if (!this.checkNext(Tokens.BACKSTICK)) {
            while (this.nextToken() !== Tokens.BACKSTICK)
              identifier += this.cursor.currentTok
          }

          tokens.push({ type: "StringLiteral", content: identifier, line: this.line, pos: this.cursor.pos })
        } break
  
        case Tokens.DQUOTE: {
          if (!this.checkNext(Tokens.DQUOTE)) {
            identifier = this.nextToken()
  
            while (this.nextToken() !== Tokens.DQUOTE)
              identifier += this.cursor.currentTok
          }
          
          tokens.push({ type: "StringLiteral", content: identifier, line: this.line, pos: this.cursor.pos })

        } break
  
        case Tokens.COLON: {
          if (this.checkNext(":")) {
            this.nextToken()
            tokens.push({ type: "Operator", content: "::", line: this.line, pos: this.cursor.pos })
          } else
            tokens.push({ type: "Token", content: this.cursor.currentTok, line: this.line, pos: this.cursor.pos })
        } break

        case Tokens.DOT: {
          if (this.checkNext('.')) {
            this.nextToken()
            if (this.checkNext('.')) {
              this.nextToken()
              tokens.push({ type: "Token", content: "...", line: this.line, pos: this.cursor.pos })
            } else
              tokens.push({ type: "Token", content: "..", line: this.line, pos: this.cursor.pos }) // support for slices
          } else
            tokens.push({ type: "Token", content: this.cursor.currentTok, line: this.line, pos: this.cursor.pos })
        } break
      }
    }
  
    return tokens
  }
}