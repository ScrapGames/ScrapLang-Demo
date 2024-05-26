/// Detects alphabetic characters (ignoring Cases)
export function isAlpha(token: string) {
  const alphaRegex = /[a-zA-Z_]/

  return alphaRegex.test(token)
}

/// Detects alphanumeric characters
export function isAlphaNum(token: string) {
  const alphaNum = /[0-9a-zA-Z_]/

  return alphaNum.test(token)
}

/// Detects numeric characters, including decimals
export function isNumeric(token: string) {
  const numericRegex = /[0-9]/

  return numericRegex.test(token)
}

/// Detects whitespaces characters
export function isSpace(token: string) {
  return token === ' '
}