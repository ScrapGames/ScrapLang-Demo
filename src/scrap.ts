import { parseArgs } from "@std/cli"

import { CLIError } from "@/errors.ts"
import Lexer from "@frontend/lexer/lexer.ts"
import Parser from "@frontend/parser/index.ts"

export const VERSION = "1.0.0"
export let DEBUG_MODE = false
export const SLASH = Deno.build.os === "windows" ? "\\" : "/"

async function main(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["debug"],
  })

  DEBUG_MODE = flags.debug

  if (flags._.length !== 1)
    throw new CLIError("None entrypoint file was provided")

  const filePath = flags._[0] as string
  const fileInfo = await Deno.stat(filePath)

  if (!fileInfo.isFile)
    throw new CLIError("The specified entrypoint isn't a valid file")

  using lexer = Lexer.init(filePath)
  const parser = Parser.init(lexer)

  console.log(parser.parse())
}

main(Deno.args)
