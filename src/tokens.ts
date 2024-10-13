export type TokenType = |
  "IdentifierName"      |
  "Statement"           |
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
  "Token"

export interface Token {
  type: TokenType,
  content: string,
  pos: number,
  line: number
}

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
  UNDERSCORE    = '_',

  // Spacials Tokens (e.g: module accessor)
  MODULE_ACCESSOR = "::",
  INCREMENT       = "++",
  DECREMENT       = "--",

  ADD_ASSIGN      = "+=",
  MINUS_ASSIGN    = "-=",
  MULT_ASSIGN     = "*=",
  DIV_ASSIGN      = "/=",
  SPREAD          = "..."

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
  MATCH       = "match",
  SWITCH      = "switch",
  CASE        = "case",
  DEFAULT     = "default",
  IN          = "in",
  OF          = "of",
  AND         = "and",
  OR          = "or",
  NOT         = "not",
  INSTANCEOF  = "instanceof",
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

export function createToken(content: string, type: TokenType, line: number, pos: number): Token {
    return { content, type, line, pos }
}