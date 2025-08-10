# ScrapLang parser

The parser is a vital piece of each programming language, its job, is analize each token returned (or founded) by the lexer
and check that these tokens has sense, in the order them has been lexed. Finally, converting these tokens in ASTNodes.

Contents of `parser` directory:

- components (directory): includes some files which defines functions that parses language entities

- parser-cursor: Contains the class which spscify methods to advance in the lexer source

- parser-utils: Contains functions which helps converting tokens to ASTNodes

- parser: contains the Parser class which in turn, contains methods that parses expressions or language entities. Also contains functions which calls `parser-cursor` methods
