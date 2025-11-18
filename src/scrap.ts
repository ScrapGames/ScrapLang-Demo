import { parseArgs } from "@std/cli"
import { CLIError }  from "@/errors.ts"
import Lexer         from "@frontend/lexer.ts"
import Parser        from "@frontend/parser.ts"
import AST           from "@frontend/ast/index.ts"

export const VERSION = "1.0.0"
export const SLASH = Deno.build.os === "windows" ? "\\" : "/"

async function main(args: string[]): Promise<void> {
  const flags = parseArgs(args, {
    boolean: ["debug"],
  })

  if (flags._.length !== 1)
    throw new CLIError("None entrypoint file was provided")

  const filePath = flags._[0] as string
  const fileInfo = await Deno.stat(filePath)

  if (!fileInfo.isFile)
    throw new CLIError("The specified entrypoint isn't a valid file")

  using lexer  = Lexer.init(filePath)
  const parser = Parser.init(lexer)
  console.log(Deno.inspect(new AST(parser), {
    colors: false,
    depth: Infinity, // probably change this
    iterableLimit: 10000, // probably change this
    strAbbreviateSize: 10000000, // probably change this
  }))
}

main(Deno.args);