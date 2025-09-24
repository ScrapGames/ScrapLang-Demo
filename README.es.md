# Scraplang

## :warning: Consideraciones :warning:

- Se terminará un README más detallado cuando, de alguna manera, se pueda ejecutar el código fuente
- Por cierto, este README solo contendrá una explicación de la estructura del proyecto y una guía de uso básica de la CLI (obviamente, todo es provisional)
- Por el momento, este proyecto está obviamente incompleto y sigue siendo un proyecto experimental no responsable

## Capas del lenguaje

La siguiente imagen muestra una arquitectura provisional del proyecto de cómo se trata el código fuente hasta que se ejecuta.

![Arquitectura de las capas del lenguaje](architecture.png)

## Uso provisional de la CLI

### Ejecutando un programa

```bash
scrap run main.scrap
```

#### Ejecutar un archivo de bytecode portable

```bash
scrap run main.byte
```

> Para más información sobre qué es un archivo '.byte', lee: [Compilando a bytecode portable](#compilar-a-bytecode-portable)

### Compilando un programa

#### Compilar a bytecode portable

```bash
scrap build --type byte main.scrap
```

#### Compilar a código ensamblador

```bash
scrap build --type asm main.scrap
```

#### Compilar a código máquina dependiente del hardware

```bash
scrap build --type bin main.scrap
```

### Cómo cambiar el nombre del archivo de salida

```bash
scrap build --type ... --output myfile main.scrap
```

### Compila un programa desde diferentes tipos de archivos

Dado que ScrapLang es capaz de compilar a lenguaje ensamblador directamente desde el AST generado y desde el bytecode generado, o a binario desde un archivo en lenguaje ensamblador, también puedes pasar archivos de estos tipos a la CLI de ScrapLang y detectará automáticamente a qué necesita compilar desde el archivo de entrada.

#### Compila desde bytecode a lenguaje ensamblador

```bash
scrap build --type asm main.byte
```

#### Compila desde bytecode a un archivo ejecutable (binario)

```bash
scrap build --type bin main.byte
```

#### Compila desde lenguaje ensamblador a un archivo ejecutable (binario)

```bash
scrap build --type bin main.asm
```

#### Compila mezclando diferentes formatos de archivo

```bash
scrap build --type bin main.scrap server.asm
```

### Reglas implícitas

#### Tipo de compilación

Por defecto, si no proporcionas un valor para el parámetro 'type' (--type ...), la CLI de ScrapLang asumirá implícitamente que el archivo deseado será un archivo binario ejecutable, sea cual sea el formato del archivo de entrada.

> Esta regla implícita también se aplica a [cualquier otro formato de archivo](#compila-un-programa-desde-diferentes-tipos-de-archivos) compatible con ScrapLang.

```bash
# Desde un archivo .scrap
scrap build main.scrap

# Desde un archivo de bytecode
scrap build main.byte
```
