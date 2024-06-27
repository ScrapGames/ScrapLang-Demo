# Scraplang

## A toy programming language borned to learn how to parse contents in a file

## Specs

- Functions are first-class citizens ✅
- Variables types are (in the most cases) automatically inferred ✅
- Syntax is similar to other languages and share features with some of them ✅
- Is a compiled language, so source code can be compiled directly into machine code, generating fast binaries executables ✅
- Easy multithreading asynchronous syntax ✅
- Common utilities already included in a thorough API language ✅
- ScrapLang is multi-paradigm ✅
- Built-in package manager ✅
- Safe execution by default (requires explicit permissions, e.g: read from fs, net connections, etc) ✅

## Module system

Thought the module system we can import code from other packages (files and directories)

Examples:

- Import a module as a object
```scrap
import os

fn main() {
    os.shutdown()
}
```

Each directory is a package and each file is a module

- Import some entities from a module
```scrap
import { shutdown } from os

fn main() {
    shutdown()
}
```

- Import the module as a object renaming the module
```scrap
import * as system from os

fn main() {
    system.shutdown()
}
```