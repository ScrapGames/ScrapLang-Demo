import { Maybe }    from "@/typings.ts"
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
  keywords_open,
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
    PUB,
    PRIVATE,
    PROTECTED,
    STATIC,
    OVERRIDE,
    SETTER,
    GETTER,
    ASYNC,
    AWAIT,
    DISSIPATE,
    INLINE,
    IMPL,
    EXTERN,
  keywords_close,

  // OPERATORS
  operators_open,
    bin_open,
      PLUS,         // +
      MINUS,        // -
      STAR,         // *
      SLASH,        // /
      PERCEN,       // %
      IN,           // in
      AND,          // and
      EXPLICIT_AND, // and!
      OR,           // or
      EXPLICIT_OR,  // or!
      INSTANCEOF,   // instanceof
      LESS,         // <
      GREATER,      // >
      DOT,          // .
      PIPE,         // |
      compounds_open,
        INCREMENT,    // ++
        DECREMENT,    // --
        ADD_ASSIGN,   // +=
        MINUS_ASSIGN, // -=
        MULT_ASSIGN,  // *=
        DIV_ASSIGN,   // /=
        MOD_ASSIGN,   // %=
        LESS_EQUAL,   // <=
        GREAT_EQUAL,  // >=
        EQUALS,       // ==
        NOT_EQUALS,   // !=
        MOD_ACCESSOR, // ::
        SLICE,        // ..
        SPREAD,       // ...
      compounds_close,
    bin_close,

    // BOOLEAN
      BANG, // !
      NOT,
      AS,
      NEW,
      DROP,

    // ACCESS
      // UNARY
        LSQRBR,
        LPAREN,
        RSQRBR,
        RPAREN,
        AMPER,

    // WITHOUT CLASSIFICATION
      EQUAL,
      COMMA,
  operators_close,

  // LITERAL TOKENS
  literals_open,
    STRING,
    CHAR,
    NUMBER,
    FLOAT,
  literals_close,

  IDENTIFIER,
  ARROW,
  SEMICOLON,
  COLON,
  UNDERSCORE,
  QUESTION,
  LBRACE,
  RBRACE,

  COMMENT,

  EOF,
  UNKNOWN
}

export const TOKEN_MAP = new Map([
  // ========================
  // KEYWORDS
  // ========================
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
  [Tokens.PUB,        "public"],
  [Tokens.PRIVATE,    "private"],
  [Tokens.PROTECTED,  "protected"],
  [Tokens.STATIC,     "static"],
  [Tokens.OVERRIDE,   "override"],
  [Tokens.SETTER,     "setter"],
  [Tokens.GETTER,     "getter"],
  [Tokens.ASYNC,      "async"],
  [Tokens.AWAIT,      "await"],
  [Tokens.DISSIPATE,  "dissipate"],
  [Tokens.INLINE,     "inline"],
  [Tokens.IMPL,       "impl"],
  [Tokens.EXTERN,     "extern"],

  // ========================
  // OPERATORS
  // ========================

  // ARITHMETIC
  [Tokens.PLUS,   "+"],
  [Tokens.MINUS,  "-"],
  [Tokens.STAR,   "*"],
  [Tokens.SLASH,  "/"],
  [Tokens.PERCEN, "%"],

  // BOOLEAN
  [Tokens.BANG,         "!"],
  [Tokens.NOT,          "not"],
  [Tokens.AS,           "as"],
  [Tokens.NEW,          "new"],
  [Tokens.DROP,         "drop"],
  [Tokens.IN,           "in"],
  [Tokens.AND,          "and"],
  [Tokens.EXPLICIT_AND, "and!"],
  [Tokens.OR,           "or"],
  [Tokens.EXPLICIT_OR,  "or!"],
  [Tokens.INSTANCEOF,   "instanceof"],
  [Tokens.LESS,         "<"],
  [Tokens.GREATER,      ">"],

  // ACCESS
  // UNARY
  [Tokens.LSQRBR, "["],
  [Tokens.LPAREN, "("],
  [Tokens.RSQRBR, "]"],
  [Tokens.RPAREN, ")"],
  [Tokens.AMPER,  "&"],
  // BINARY
  [Tokens.DOT,    "."],
  [Tokens.PIPE,   "|"],

  // COMPOUND TOKENS
  [Tokens.INCREMENT,    "++"],
  [Tokens.DECREMENT,    "--"],
  [Tokens.ADD_ASSIGN,   "+="],
  [Tokens.MINUS_ASSIGN, "-="],
  [Tokens.MULT_ASSIGN,  "*="],
  [Tokens.DIV_ASSIGN,   "/="],
  [Tokens.MOD_ASSIGN,   "%="],
  [Tokens.LESS_EQUAL,   "<="],
  [Tokens.GREAT_EQUAL,  ">="],
  [Tokens.EQUALS,       "=="],
  [Tokens.NOT_EQUALS,   "!="],
  [Tokens.MOD_ACCESSOR, "::"],
  [Tokens.SLICE,        ".."],
  [Tokens.SPREAD,       "..."],

  // WITHOUT CLASSIFICATION
  [Tokens.EQUAL, "="],
  [Tokens.COMMA, ","],

  // ========================
  // LITERALS
  // ========================
  [Tokens.STRING,     "STRING"],
  [Tokens.CHAR,       "CHAR"],
  [Tokens.NUMBER,     "NUMBER"],
  [Tokens.FLOAT,      "FLOAT"],

  // ========================
  // IDENTIFIERS & SYMBOLS
  // ========================
  [Tokens.ARROW,      "->"],
  [Tokens.IDENTIFIER, "IDENTIFIER"],
  [Tokens.COLON,      ":"],
  [Tokens.SEMICOLON,  ";"],
  [Tokens.UNDERSCORE, "_"],
  [Tokens.QUESTION,   "?"],
  [Tokens.LBRACE,     "{"],
  [Tokens.RBRACE,     "}"],

  // ========================
  // SPECIALS
  // ========================
  [Tokens.COMMENT, "COMMENT"],
  [Tokens.EOF,     "EOF"],
  [Tokens.UNKNOWN, "UNKNOWN"],
]);

export const RTOKEN_MAP = new Map(Array.from(TOKEN_MAP, ([k, v]) => [v, k]))

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
  ["pub",        Tokens.PUB],
  ["private",    Tokens.PRIVATE],
  ["protected",  Tokens.PROTECTED],
  ["static",     Tokens.STATIC],
  ["override",   Tokens.OVERRIDE],
  ["setter",     Tokens.SETTER],
  ["getter",     Tokens.GETTER],
  ["async",      Tokens.ASYNC],
  ["await",      Tokens.AWAIT],
  ["dissipate",  Tokens.DISSIPATE],
  ["inline",     Tokens.INLINE],
  ["impl",       Tokens.IMPL],
  ["extern",     Tokens.EXTERN],

  // operator which are words
  ["in",         Tokens.IN],
  ["and",        Tokens.AND],
  ["and!",       Tokens.EXPLICIT_AND],
  ["or",         Tokens.OR],
  ["or!",        Tokens.EXPLICIT_OR],
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
  
  public static createToken(type: Tokens, pos: Position, content: string): Token {
    return new this(type, content, pos.copy())
  }

  public is(maybe: Tokens): Maybe<true> {
    return this.type === maybe || undefined
  }

  public cmp(maybe: string): boolean {
    return this.content === maybe
  }

  public isCompoundedOp(): boolean {
    return this.type > Tokens.compounds_open && this.type < Tokens.compounds_close
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

  public isClosingExpr(): boolean {
    switch (this.type) {
      case Tokens.RPAREN:
      case Tokens.RSQRBR:
      case Tokens.SEMICOLON: return true
    }

    return false
  }

  public isEOF(): this is Tokens.EOF {
    return !!this.is(Tokens.EOF)
  }

  public get opRules(): { prec: number, assoc: "left" | "right" } | undefined {
    const prec  = this.Precedence
    if (prec === undefined)
      return undefined
    
    const assoc = this.Associativity
    return { prec, assoc }
  }

  public get OpTypeRules(): Maybe<{ prec: number, assoc: "left" | "right" }> {
    const prec = this.is(Tokens.PIPE) ? 0 : this.is(Tokens.AMPER) ? 1 : undefined
    if (prec === undefined)
      return prec

    const assoc = "left"
    return { prec, assoc }
  }

  private get Precedence(): number | undefined {
    // unary and grouping operators are not included here since them are
    // instantly parsed before any binary operator
    switch (this.type) {
      case Tokens.MOD_ACCESSOR: // ::
      case Tokens.DOT:          // .
        return 0

      case Tokens.STAR:    // *
      case Tokens.SLASH:   // /
      case Tokens.PERCEN:  // %
        return 1

      case Tokens.PLUS:    // +
      case Tokens.MINUS:   // -
        return 2

      case Tokens.LESS:         // <
      case Tokens.GREATER:      // >
      case Tokens.LESS_EQUAL:   // <=
      case Tokens.GREAT_EQUAL:  // >=
        return 3

      case Tokens.EQUALS:       // ==
      case Tokens.NOT_EQUALS:   // !=
        return 4

      case Tokens.AND:          // and
        return 5

      case Tokens.OR:           // or
        return 6

      case Tokens.SLICE:        // ..
        return 7

      case Tokens.EQUAL:        // =
      case Tokens.ADD_ASSIGN:   // +=
      case Tokens.MINUS_ASSIGN: // -=
      case Tokens.MULT_ASSIGN:  // *=
      case Tokens.DIV_ASSIGN:   // /=
      case Tokens.MOD_ASSIGN:   // %=
        return 8

      case Tokens.AS:           // as
      case Tokens.INSTANCEOF:   // instanceof
      case Tokens.IN:           // in
        return 9
    }

    return undefined
  }

  private get Associativity(): ("left" | "right") {
    switch (this.type) {
      case Tokens.EQUAL:        // =
      case Tokens.ADD_ASSIGN:   // +=
      case Tokens.MINUS_ASSIGN: // -=
      case Tokens.MULT_ASSIGN:  // *=
      case Tokens.DIV_ASSIGN:   // /=
      case Tokens.MOD_ASSIGN:   // %=
        return "right"
    }

    return "left"
  }

  public get TypeContent() { return stringify(this.type)! }
}
