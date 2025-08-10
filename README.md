# Scraplang

## A toy programming language borned to learn how to parse contents in a file

Inspired on JavaScript / TypeScript and another programming languages. The objective of ScrapLang is not innovate the way to write code or something similar
ut rather to provide a very simple API where there aren't hundreds of functions and classes that do the same thing or very similar things, and apply these API the to a syntax already familiar for the most of programmers.

## Specs

- Functions are first-class citizens ✅
- Variables types are (in the most cases) automatically inferred ✅
- Syntax is similar to other languages and share features with some of them ✅
- Is a interpreted language (in this demo version), so source code can be fastly executed ✅
- Easy multithreading asynchronous syntax ✅
- Common utilities already included in a thorough API language ✅
- ScrapLang is multi-paradigm ✅
- Built-in package manager ✅
- Safe execution by default (requires explicit permissions, e.g: read from fs, net connections, etc) ✅

## Simple tutorial

### Data types

- Number
- Float
- String
- Boolean
- Undefined

### Functions

```scrap
fn greet() {
    std::print("¡Hola, Mundo!")
}
```

### Variables

```scrap
var num = 10
```

### Constants

```scrap
const num = 10
```

### Modules

```scrap
module Functions {
    fn greet() {
        std::print("¡Hola, Mundo!")
    }

    fn fareWell() {
        std::print("Its time to go home, bye!")
    }
}
```

The modules are a language entities which stores multiple entities, among which are: another modules, functions, variables, interfaces, type declarations, classes, etc

Them can be exported, which means that these **exported** entities can be **imported** in another modules
