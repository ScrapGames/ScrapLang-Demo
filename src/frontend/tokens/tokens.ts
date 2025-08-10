import { Position } from "@frontend/position.ts"

/**
 * From golang source code:
 * I took the idea of separate type of tokens in an enum, for example
 * to group **keywords** them are _wrapped_ between 'keywords_open' and 'keywords_close'
 * src/go/token/tokens.go
 * https://github.com/golang/go/blob/master/src/go/token/token.go
 */
export enum Tokens {
  // KEYWORDS
  keywords_open, // determines where keywords starts
    FN,
    VAR,
    CONST,
    RETURN,
    IMPORT,
    FROM,
    EXPORT,
    CLASS,
    TYPE,
    INTERFACE,
    ENUM,
    MODULE,
    FOR,
    WHILE,
    DO,
    BREAK,
    SKIP,
    IF,
    ELSE,
    ELIF,
    MATCH,
    SWITCH,
    EXTENDS,
    IMPLEMENTS,
    CASE,
    DEFAULT,
    OF,
    TRY,
    CATCH,
    PUBLIC,
    PRIVATE,
    PROTECTED,
    STATIC,
    OVERRIDE,
    SETTER,
    GETTER,
    ASYNC,
    AWAIT,
  keywords_close, // determines where keywords ends

  // OPERATORS OPEN
  operators_open,

  /**
   * Not all tokens included here (within the operator delimiter) are always treated as operators.
   * However, in an expression context, these tokens are treated as operators.
   */

  // ARITHMETICS OPERATORS
    // UNARY
      PLUS,      // +
      MINUS,     // -
      INCREMENT, // ++
      DECREMENT, // --

    // BINARY
      STAR,         // *
      SLASH,        // /
      PERCEN,       // %
      ADD_ASSIGN,   // +=
      MINUS_ASSIGN, // -=
      MULT_ASSIGN,  // *=
      DIV_ASSIGN,   // /=
      MOD_ASSIGN,   // %=
    

  // BOOLEAN OPERATORS
    // UNARY
      BANG, // !
      NOT,
      AS,
      NEW,
      DROP,

    // BINARY
      IN,
      AND,
      OR,
      INSTANCEOF,
      LESS,        // <
      GREATER,     // >
      LESS_EQUAL,  // <=
      GREAT_EQUAL, // >=
      EQUALS,      // ==
      NOT_EQUALS,  // !=

  // ACCESS OPERATORS
    // UNARY
      LSQRBR,  // [
      LPAREN,  // (
      RSQRBR,  // ]
      RPAREN,  // )
      AMPER,   // &
    
    // BINARY
      MOD_ACCESSOR, // ::
      DOT,     // .
  
  // WITHOUT CLASSIFICATION
  EQUAL, // =
  SLICE, // ..
  COMMA, // ,
  operators_close,
  // OPERATORS END

  // LITERAL TOKENS
  literals_open,
    STRING,     // "hola"
    CHAR,       // 'b'
    NUMBER,     // 777
    FLOAT,      // 3.14
  literals_close,
    
  IDENTIFIER, // bruh
  COLON,      // :
  SEMICOLON,  // ;
  UNDERSCORE, // _
  QUESTION,   // ?
  LBRACE,     // {
  RBRACE,     // }
  
  SPREAD,     // ...

  EOF,
  UNKNOWN
}

export const TOKEN_MAP = new Map([
  [Tokens.FN,         "fn"],
  [Tokens.VAR,        "var"],
  [Tokens.CONST,      "const"],
  [Tokens.RETURN,     "return"],
  [Tokens.IMPORT,     "import"],
  [Tokens.FROM,       "from"],
  [Tokens.EXPORT,     "export"],
  [Tokens.CLASS,      "class"],
  [Tokens.TYPE,       "type"],
  [Tokens.INTERFACE,  "interface"],
  [Tokens.ENUM,       "enum"],
  [Tokens.MODULE,     "module"],
  [Tokens.FOR,        "for"],
  [Tokens.WHILE,      "while"],
  [Tokens.DO,         "do"],
  [Tokens.BREAK,      "break"],
  [Tokens.SKIP,       "skip"],
  [Tokens.IF,         "if"],
  [Tokens.ELSE,       "else"],
  [Tokens.ELIF,       "elif"],
  [Tokens.MATCH,      "match"],
  [Tokens.SWITCH,     "switch"],
  [Tokens.EXTENDS,    "extends"],
  [Tokens.IMPLEMENTS, "implements"],
  [Tokens.CASE,       "case"],
  [Tokens.DEFAULT,    "default"],
  [Tokens.OF,         "of"],
  [Tokens.TRY,        "try"],
  [Tokens.CATCH,      "catch"],
  [Tokens.PUBLIC,     "public"],
  [Tokens.PRIVATE,    "private"],
  [Tokens.PROTECTED,  "protected"],
  [Tokens.STATIC,     "static"],
  [Tokens.OVERRIDE,   "override"],
  [Tokens.SETTER,     "setter"],
  [Tokens.GETTER,     "getter"],
  [Tokens.ASYNC,      "async"],
  [Tokens.AWAIT,      "await"],

  // OPERATORS OPEN
  // 1º OPERATORS WHICH ARE WORDS
  [Tokens.IN,         "in"],
  [Tokens.AND,        "and"],
  [Tokens.OR,         "or"],
  [Tokens.NOT,        "not"],
  [Tokens.INSTANCEOF, "instanceof"],
  [Tokens.AS,         "as"],
  [Tokens.NEW,        "new"],
  [Tokens.DROP,       "drop"],

  // 2º OPERATORS WHICH ARE TOKENS
  [Tokens.PLUS,    "+"],
  [Tokens.MINUS,   "-"],
  [Tokens.STAR,    "*"],
  [Tokens.SLASH,   "/"],
  [Tokens.PERCEN,  "%"],
  [Tokens.LESS,    "<"],
  [Tokens.GREATER, ">"],
  [Tokens.DOT,     "."],
  [Tokens.LSQRBR,  "["],
  [Tokens.RSQRBR,  "]"],
  [Tokens.BANG,    "!"],
  [Tokens.LPAREN,  "("],
  [Tokens.RPAREN,  ")"],
  [Tokens.AMPER,   "&"],
  [Tokens.EQUAL,   "="],

  // 3º OPERATORS WHICH ARE COMPOUNDED TOKENS
  [Tokens.MOD_ACCESSOR, "::"],
  [Tokens.INCREMENT,    "++"],
  [Tokens.DECREMENT,    "--"],

  [Tokens.LESS_EQUAL,  "<="],
  [Tokens.GREAT_EQUAL, ">="],

  [Tokens.SLICE,      ".."],
  [Tokens.SPREAD,     "..."],
  [Tokens.EQUALS,     "=="],
  [Tokens.NOT_EQUALS, "!="],

  [Tokens.ADD_ASSIGN,   "+="],
  [Tokens.MINUS_ASSIGN, "-="],
  [Tokens.MULT_ASSIGN,  "*="],
  [Tokens.DIV_ASSIGN,   "/="],
  [Tokens.MOD_ASSIGN,   "%="],
  // OPERATORS END

  // LITERAL OPENS
  [Tokens.STRING,     "STRING"],     // "hola"
  [Tokens.CHAR,       "CHAR"],       // 'b'
  [Tokens.NUMBER,     "NUMBER"],     // 777
  [Tokens.FLOAT,      "FLOAT"],      // 3.14
  [Tokens.IDENTIFIER, "IDENTIFIER"], // bruh
  // LITERAL ENDS

  // SIMPLE TOKENS
  [Tokens.COLON,     ":"],
  [Tokens.SEMICOLON, ";"],
 
  [Tokens.UNDERSCORE, "_"],
  [Tokens.QUESTION,   "?"],
  [Tokens.LBRACE,     "{"],
  [Tokens.RBRACE,     "}"],
  [Tokens.COMMA,      ","],

  [Tokens.EOF, "EOF"]
])

export const KEYWORD_MAP = new Map([
  ["fn",         Tokens.FN],
  ["var",        Tokens.VAR],
  ["const",      Tokens.CONST],
  ["return",     Tokens.RETURN],
  ["import",     Tokens.IMPORT],
  ["from",       Tokens.FROM],
  ["export",     Tokens.EXPORT],
  ["class",      Tokens.CLASS],
  ["type",       Tokens.TYPE],
  ["interface",  Tokens.INTERFACE],
  ["enum",       Tokens.ENUM],
  ["module",     Tokens.MODULE],
  ["for",        Tokens.FOR],
  ["while",      Tokens.WHILE],
  ["do",         Tokens.DO],
  ["break",      Tokens.BREAK],
  ["skip",       Tokens.SKIP],
  ["if",         Tokens.IF],
  ["else",       Tokens.ELSE],
  ["elif",       Tokens.ELIF],
  ["match",      Tokens.MATCH],
  ["switch",     Tokens.SWITCH],
  ["extends",    Tokens.EXTENDS],
  ["implements", Tokens.IMPLEMENTS],
  ["case",       Tokens.CASE],
  ["default",    Tokens.DEFAULT],
  ["of",         Tokens.OF],
  ["try",        Tokens.TRY],
  ["catch",      Tokens.CATCH],
  ["public",     Tokens.PUBLIC],
  ["private",    Tokens.PRIVATE],
  ["protected",  Tokens.PROTECTED],
  ["static",     Tokens.STATIC],
  ["override",   Tokens.OVERRIDE],
  ["setter",     Tokens.SETTER],
  ["getter",     Tokens.GETTER],
  ["async",      Tokens.ASYNC],
  ["await",      Tokens.AWAIT],

  // operator which are words
  ["in",         Tokens.IN],
  ["and",        Tokens.AND],
  ["or",         Tokens.OR],
  ["not",        Tokens.NOT],
  ["instanceof", Tokens.INSTANCEOF],
  ["as",         Tokens.AS],
  ["new",        Tokens.NEW],
  ["drop",       Tokens.DROP],
])

export function stringify(tok: Tokens) {
  return TOKEN_MAP.get(tok)
}

export function isIdentifier(id: string): boolean {
  return !(id === "" || KEYWORD_MAP.has(id))
}

export class Token {
  type: Tokens
  content: string
  position: Position

  public constructor(type: Tokens, content: string, position: Position) {
    this.type = type
    this.content = content
    this.position = position
  }
  
  public static createToken(type: Tokens, pos: Position, content?: string) {
    return new Token(type, content ?? TOKEN_MAP.get(type)!, pos.copy())
  }

  public is(maybe: Tokens): boolean {
    return this.type === maybe
  }

  public cmp(maybe: string): boolean {
    return this.content === maybe
  }

  public isKeyword(): boolean {
    return this.type > Tokens.keywords_open && this.type < Tokens.keywords_close
  }

  public isLiteral(): boolean {
    return this.type > Tokens.literals_open && this.type < Tokens.literals_close
  }

  public isOperator(): boolean {
    return this.type > Tokens.operators_open && this.type < Tokens.operators_close
  }

  public isEOF(): this is Tokens.EOF {
    return this.is(Tokens.EOF)
  }

  public get TypeContent() { return TOKEN_MAP.get(this.type)! }

  public get Precedence(): number {
    switch (this.type) {
      // 0 - Postfijo: highest precedence
      case Tokens.MOD_ACCESSOR:
      case Tokens.DOT:
      case Tokens.LSQRBR:
      case Tokens.LPAREN:
      case Tokens.INCREMENT:
      case Tokens.DECREMENT:
        return 0

      // 1 - Unarios
      case Tokens.NOT:     // not
      case Tokens.BANG:    // !
      case Tokens.NEW:
      case Tokens.DROP:
        return 1

      // 2 - Multiplicativos
      case Tokens.STAR:    // *
      case Tokens.SLASH:   // /
      case Tokens.PERCEN:  // %
        return 2

      // 3 - Aditivos
      case Tokens.PLUS:    // +
      case Tokens.MINUS:   // -
        return 3

      // 4 - Relacionales
      case Tokens.LESS:         // <
      case Tokens.GREATER:      // >
      case Tokens.LESS_EQUAL:   // <=
      case Tokens.GREAT_EQUAL:  // >=
        return 4

      // 5 - Igualdad
      case Tokens.EQUALS:       // ==
      case Tokens.NOT_EQUALS:   // !=
        return 5

      // 6 - AND lógico / bitwise
      case Tokens.AND:          // and
      case Tokens.AMPER:        // &
        return 6

      // 7 - OR lógico
      case Tokens.OR:           // or
        return 7

      // 8 - Asignación
      case Tokens.EQUAL:        // =
      case Tokens.ADD_ASSIGN:   // +=
      case Tokens.MINUS_ASSIGN: // -=
      case Tokens.MULT_ASSIGN:  // *=
      case Tokens.DIV_ASSIGN:   // /=
      case Tokens.MOD_ASSIGN:   // %=
        return 8

      // 9 - No estándar / sintácticos: menor precedencia
      case Tokens.SLICE:        // ..
      case Tokens.AS:           // as
      case Tokens.INSTANCEOF:   // instanceof
      case Tokens.IN:           // in
        return 9

      // 10 - Coma como operador
      case Tokens.COMMA:
        return 10

      default: break
    }

    return -1 // No es un operador reconocido
  }
}
