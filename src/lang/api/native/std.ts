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
import { ScrapNativeFn, ScrapValue } from "@lang/elements/commons.ts"

import { ScrapInteger } from "@lang/elements/values/numerics.ts"
import { ScrapUndefined } from "@lang/elements/values/absence.ts"
import { ScrapFalse, ScrapTrue } from "@lang/elements/values/booleans.ts"

import { ScrapModule } from "@lang/elements/entities/modules.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"

export const SCRAP_PRINT_FUNCTION = new ScrapNativeFn("print", true, undefined, (...args: ScrapValue[]) => {
    // PROVISIONAL: weird support for white spaces (under the hood, in JavaScript, them are writed to output as new lines)
    if (args.length < 1) {
        console.log()
        return new ScrapUndefined()
    }
    
    for (const arg of args)
        console.log(arg.format())

    return new ScrapUndefined()
})

const SCRAP_PARSEINT_FUNCTION = new ScrapNativeFn("parseInt", true, 1, (...args: ScrapValue[]) => {
    return new ScrapInteger(parseInt(args[0].getValue as string))
})

export function makeStdModule() {
    const stdModule = new ScrapModule("std", true, createEmptyScope(null, "std"))

    // firstly, inserts functions
    stdModule.insert("print", SCRAP_PRINT_FUNCTION, true)
    stdModule.insert("parseInt", SCRAP_PARSEINT_FUNCTION, true)

    // then, inserts variables / values
    stdModule.insert("true", new ScrapVariable(true, "true", new ScrapTrue()), true)
    stdModule.insert("false", new ScrapVariable(true, "false", new ScrapFalse()), true)
    stdModule.insert("null", new ScrapVariable(true, "null", new ScrapValue(null)), true)

    return stdModule
}