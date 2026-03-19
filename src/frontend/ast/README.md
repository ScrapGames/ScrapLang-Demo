# Abstract Syntax Tree (AST) Overview

The Abstract Syntax Tree (AST) is one of the core components of the ScrapLang compiler.  
It represents the structural and semantic form of the source code after parsing.  
This document provides an overview of the conventions, organization, and classification of AST nodes within this directory.

## File Structure Conventions

- The AST is organized into three primary groups of *nodes*.
- A *node* represents a meaningful syntactic construct in the language (e.g., a declaration, statement, or expression).
- Each node is defined in its own group dedicated file.
- When multiple nodes share common structural fields (e.g., position information, shared parameters, or common metadata), these shared components are extracted into separate files and reused through inheritance or composition.

This layout ensures clarity, modularity, and ease of navigation throughout the AST source tree.

## Node Categories

### 1. Declarations

Declarations introduce new named entities into the surrounding module or namespace.  
They define the structural building blocks of a ScrapLang program.

Common declaration nodes include:

- Module declarations
- Class declarations
- Function declarations
- Constant bindings
- Interface declarations
- Type definitions
- Import statements

For detailed semantics of each declaration kind, refer to the official ScrapLang language documentation.

### 2. Statements

Statements represent constructs that *perform an action* or produce side effects during execution.  
While some statements may contain nested declarations or expressions, their defining characteristic is that they do **not** evaluate to a value.

Examples include:

- `if` blocks
- `for` loops and their variants
- `while` loops and their variants
- Control-flow statements such as `return` and `dissipate`
- Certain declaration forms used in statement position
- Expression statements (expressions evaluated for side effects)

Statements guide program control flow and execution structure.

### 3. Expressions

Expressions represent constructs that *produce a value*.  
They are formed from operands (literals, identifiers, function calls, etc.) combined with zero or more operators.

Unlike declarations or statements, expressions are effectively unbounded in variety, as programmers can combine them in countless ways.

Illustrative examples include:

```scrap
1 + 1

"Hello, everyone"

std::io::open("./main.scrap")

new Server()

fn() { std::print("Hello, World!") }

myArray[1]

[1, 2, 3, 4, 5]
```
