import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts"

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

import * as exp from "./expressions.ts"
import { Scope } from "./scope.ts"
import { RuntimeError } from "./lang-errors.ts";

export function addSTD(scope?: Scope) {
    if (scope) {
        scope.addEntry(
            "log",
            new exp.ScrapNative("<Anonymous>", 1, (args: exp.ScrapValue[]) => {
                args.forEach(arg => console.log(arg.getValue))
                return new exp.ScrapUndefined()
            })
        )
        
        scope.addEntry(
            "parseInt",
            new exp.ScrapNative("<Anonymous>", 1, (args: exp.ScrapValue[]) => {
                return new exp.ScrapInteger(parseInt(args[0].getValue as string)) // the received value from `getValue` will be a string
            })
        )

        scope.addEntry(
            "readNamesOfDirs",
            new exp.ScrapNative("<Anonymous>", 1, (args: exp.ScrapValue[]) => {
                const path = args[0].getValue as string
                if (!existsSync(path))
                    throw new RuntimeError(`The path '${path}' does not exists`)

                const read = Deno.readDirSync(path)
                const arrayItems = new exp.ScrapArray([])
                const arrayExprVal = (arrayItems.getValue as unknown as Array<string>)

                for (const item of read)
                    arrayExprVal.push(item.name)

                return arrayItems
            })
        )

        scope.addEntry(
            "arrayAt",
            new exp.ScrapNative("<Anonymous>", 2, (args: exp.ScrapValue[]) => {
                const array = args[0].getValue as Array<exp.ScrapValue>
                const position = args[1].getValue as number

                return new exp.ScrapValue(array[position])
            })
        )
        
        scope.addEntry("true", new exp.ScrapValue(true))
        scope.addEntry("false", new exp.ScrapValue(false))
        scope.addEntry("null", null)
    }
}