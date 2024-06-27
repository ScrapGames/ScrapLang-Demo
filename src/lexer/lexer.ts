import { isAlpha, isNumeric, isAlphaNum, isSpace } from "../utils/chars.ts"

import LexingError from "./LexerError.ts"
import LexerCursor from "./lexer-cursor.ts"

export type TokenType = |
  "IdentifierName"      |
  "Punctuator"          |
  "NumericLiteral"      |
  "FloatLiteral"        |
  "BinaryLiteral"       |
  "OctalLiteral"        |
  "HexaLiteral"         |
  "CharLiteral"         |
  "StringLiteral"       |
  "TemplateString"      |
  "Keyword"             |
  "Operator"            |
  "Token"               |
  "Unknown"

export enum Tokens {
  LPAREN        = '(',
  RPAREN        = ')',
  LBRACE        = '{',
  RBRACE        = '}',
  LSQRBR        = '[',
  RSQRBR        = ']',
  COMMA         = ',',
  DQUOTE        = '"',
  QUOTE         = '\'',
  BACKSTICK     = '`',
  PLUS          = '+',
  MINUS         = '-',
  STAR          = '*',
  SLASH         = '/',
  PERCEN        = '%',
  LESS          = '<',
  GREATER       = '>',
  DOT           = '.',
  AMPER         = '&',
  EQUAL         = '=',
  ESP           = '~',
  COLON         = ':',
  SEMICOLON     = ';',
  EXCLAMATION   = '!',
  INTERROGATION = '?',
  UNDERSCORE    = '_'
}

export enum Keywords {
  FN          = "fn",
  VAR         = "var",
  CONST       = "const",
  RETURN      = "return",
  IMPORT      = "import",
  FROM        = "from",
  EXPORT      = "export",
  CLASS       = "class",
  THIS        = "this",
  SUPER       = "super",
  TYPE        = "type",
  INTERFACE   = "interface",
  ENUM        = "enum",
  EXTENDS     = "extends",
  IMPLEMENTS  = "implements",
  MODULE      = "module",
  FOR         = "for",
  WHILE       = "while",
  DO          = "do",
  BREAK       = "break",
  SKIP        = "skip",
  IF          = "if",
  ELSE        = "else",
  ELIF        = "elif",
  SWITCH      = "switch",
  CASE        = "case",
  DEFAULT     = "default",
  IN          = "in",
  OF          = "of",
  AND         = "and",
  OR          = "or",
  NOT         = "not",
  TRY         = "try",
  CATCH       = "catch",
  AS          = "as",
  CONSTRUCTOR = "constructor",
  DESTRUCTOR  = "destructor",
  NEW         = "new",
  DROP        = "drop",
  PUBLIC      = "public",
  PRIVATE     = "private",
  PROTECTED   = "protected",
  STATIC      = "static",
  OVERRIDE    = "override",
  SETTER      = "setter",
  GETTER      = "getter",
  ASYNC       = "async",
  AWAIT       = "await"
}

export interface Token {
  type: TokenType
  content: string,
}

export default class Lexer {
  line: number
  cursor: LexerCursor
  fileName: string

  public constructor(source: string, fileName: string) {
    this.line = 0
    this.fileName = fileName
    this.cursor = new LexerCursor(source)
  }

  /* public lexNew(source: string) {

  } */

  /**
   * Returns the next char, advancing the cursor 1 position
   * @returns the next char in the input
   */
  private consume() { return this.cursor.consume() }

  private nextToken() { return this.cursor.currentTok = this.cursor.consume() }

  /**
   * Aux method to check the next token
   * @param char 
   * @returns 
   */
  private checkNext(char: string): boolean {
    return this.cursor.next() === char
  }

  private resolveIdentifier(identifier: string): Token {
    switch (identifier) {
      case Keywords.FN:
      case Keywords.VAR:
      case Keywords.CONST:
      case Keywords.RETURN:
      case Keywords.IMPORT:
      case Keywords.FROM:
      case Keywords.EXPORT:
      case Keywords.CLASS:
      case Keywords.THIS:
      case Keywords.SUPER:
      case Keywords.TYPE:
      case Keywords.INTERFACE:
      case Keywords.ENUM:
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
      case Keywords.AND:
      case Keywords.OR:
      case Keywords.NOT:
      case Keywords.TRY:
      case Keywords.CATCH:
      case Keywords.AS:
      case Keywords.CONSTRUCTOR:
      case Keywords.DESTRUCTOR:
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
      case Keywords.AWAIT: {
        return { type: "Keyword", content: identifier }
      }

      case "instanceof": {
        return { type: "Operator", content: identifier }
      }

      default: {
        return { type: "IdentifierName", content: identifier }
      }
    }
  }

  public tokens(): Token[] {
    const tokens: Token[] = []
    let identifier = ""
    let numericIdentifier = ""

    while (!this.cursor.isEOF()) {
      this.nextToken()

      while (isSpace(this.cursor.currentTok))
        this.nextToken()

      if (this.cursor.currentTok === '\n')
        this.line++

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

        tokens.push(this.resolveIdentifier(identifier))
      }

      if (isNumeric(this.cursor.currentTok)) {
        numericIdentifier = ""
        let isFloat = false

        do {
          if (this.cursor.currentTok === Tokens.UNDERSCORE) {
            if (this.checkNext(Tokens.UNDERSCORE))
              throw new LexingError(this, "Multiple consecutive numeric separators are not permitted")
            this.nextToken()
          }
          if (this.cursor.currentTok === Tokens.DOT)
            isFloat = true
          numericIdentifier += this.cursor.currentTok
        } while (!this.cursor.isEOF() && (isNumeric(this.nextToken()) || this.cursor.currentTok === Tokens.DOT || this.cursor.currentTok === Tokens.UNDERSCORE))

        if (!isNumeric(numericIdentifier.charAt(numericIdentifier.length - 1)))
          throw new LexingError(this, "A number must ends with numeric character")

        if (isFloat)
          tokens.push({ type: "FloatLiteral", content: numericIdentifier })          
        else
          tokens.push({ type: "NumericLiteral", content: numericIdentifier })
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
          tokens.push({ type: "Token", content: this.cursor.currentTok })
        } break

        case Tokens.GREATER:
        case Tokens.LESS:
        case Tokens.PLUS: // Minus char is checked below instead after Tokens.PLUS
        case Tokens.STAR: {
          tokens.push({ type: "Operator", content: this.cursor.currentTok })
        } break

        
        case Tokens.SLASH: {
          if (this.checkNext('/')) {
            do {
              this.cursor.currentTok = this.consume() // manual assingment instead use `nextToken` to avoid overlaped comparations
            } while (this.cursor.currentTok !== '\n' && !this.cursor.isEOF())
          } else if (this.checkNext('*')) {
            for (;;) {
              if (this.cursor.currentTok === '*') {
                this.cursor.currentTok = this.consume() // manual assignment instead use `nextToken` to avoid overlaped comparations
                if (this.cursor.currentTok === '/')
                  break
              } else this.nextToken()
            }
  
            if (this.cursor.isEOF())
              continue // avoid infinite looping
            else this.nextToken()
          } else {
            tokens.push({ type: "Operator", content: this.cursor.currentTok })
          }
        } break

        /**
         * Minus character (-) is checked below all other operators because it can be followed by a greater character ('>')
         * This means that is a lambda function
         */
        case Tokens.MINUS: {
          if (this.checkNext(">")) {
            this.nextToken()
            tokens.push({ type: "Token", content: "->" })
          } else
            tokens.push({ type: "Operator", content: this.cursor.currentTok })
        } break

        case Tokens.QUOTE: {
          identifier = this.nextToken()
          
          while (this.nextToken() !== Tokens.QUOTE)
            identifier += this.cursor.currentTok

          tokens.push({ type: "CharLiteral", content: identifier })
        } break

        case Tokens.BACKSTICK: {
          identifier = this.nextToken()

          while (this.nextToken() !== Tokens.BACKSTICK)
            identifier += this.cursor.currentTok
          
          tokens.push({ type: "StringLiteral", content: identifier })
        } break

        case Tokens.DQUOTE: {
          identifier = this.nextToken()

          while (this.nextToken() !== Tokens.DQUOTE)
            identifier += this.cursor.currentTok

          
          tokens.push({ type: "StringLiteral", content: identifier })

        } break

        case Tokens.COLON: {
          if (this.checkNext(":")) {
            this.nextToken()
            tokens.push({ type: "Operator", content: "::" })
          } else
            tokens.push({ type: "Token", content: this.cursor.currentTok })
        } break

        case Tokens.DOT: {
          if (this.checkNext('.')) {
            this.nextToken()
            if (this.checkNext('.')) {
              this.nextToken()
              tokens.push({ type: "Token", content: "..." })
            } else
              tokens.push({ type: "Token", content: ".."}) // support for slices
          } else
            tokens.push({ type: "Token", content: this.cursor.currentTok })
        } break
      }
    }

    return tokens
  }
}