/**
 * * --- Español --- *
 * std es un modulo global que se incrusta en el scope global del programa justo al empezar el parseo del programa
 * Este incluye variables, funciones, clases, tipos de datos, interfaces y demas utilidades de ScrapLang,
 * necesarios para cualquier programa basico, por ejemplo:
 *  - tipos de datos basicos como u8, i32
 *  - objetos como console, para redireccion a la salida estandar
 *  - funciones de utilidad, tales como: len, range, open
 *  - interfaces de utilidad, tales como: Iterator, Iterable
 *  - variables (o constantes) informativas, tales como: version del lenguaje, etc...
 * 
 * * --- English --- *
 */

import { createEmptyScope } from "@lang/scope.ts"
import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapInteger } from "@lang/elements/values/numerics.ts"
import { ScrapUndefined } from "@lang/elements/values/absence.ts"
import { ScrapVariable } from "@lang/elements/entities/variable.ts"
import { ScrapNative, ScrapValue } from "@lang/elements/commons.ts"
import { ScrapFalse, ScrapTrue } from "@lang/elements/values/booleans.ts"

const stdModule = new ScrapModule("std", createEmptyScope(null, "std"))

const SCRAP_LOG_FUNCTION = new ScrapNative("log", true, (...args: ScrapValue[]) => {
    const argsValue = args.map(arg => arg.getValue)
    console.log(...argsValue)
    return new ScrapUndefined()
})
stdModule.insert("log", SCRAP_LOG_FUNCTION, true)

const SCRAP_PARSEINT_FUNCTION = new ScrapNative("parseint", 1, (...args: ScrapValue[]) => {
    return new ScrapInteger(parseInt(args[0].getValue as string))
})

stdModule.insert("parseInt", SCRAP_PARSEINT_FUNCTION, true)
stdModule.insert("true", new ScrapVariable("constant", "true", new ScrapTrue()), true)
stdModule.insert("false", new ScrapVariable("constant", "false", new ScrapFalse()), true)
stdModule.insert("null", new ScrapVariable("constant", "null", new ScrapValue(null)), true)

export default stdModule