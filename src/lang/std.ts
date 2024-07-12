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

import { ModuleAST } from "../ast/Expressions.ts";
import { createEmptyScope } from "./scope.ts";

const STD = new ModuleAST("std", createEmptyScope(null, "std"))

STD.insert("console", console)
STD.insert("parseInt", parseInt)
STD.insert("parseFloat", parseFloat)

export default STD