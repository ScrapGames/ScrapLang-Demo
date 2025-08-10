import { expect } from "jsr:@std/expect"
import { Scope } from "../engine/scope.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts";
import { ScrapInteger } from "@lang/elements/values/numerics.ts";

Deno.test("Scope is empty", () => {
  const scope = new Scope(null, "test")

  expect(scope.size === 0).toBeTruthy()
})

Deno.test("Insering a new item", () => {
  const variable = new ScrapVariable("myVar", false, new ScrapInteger(10))
  const scope = new Scope(null, "test")

  scope.set(variable.name, variable)
  expect(scope.get(variable.name) === variable).toBeTruthy()
})

Deno.test("An item exists", () => {
  const variable = new ScrapVariable("myVar", false, new ScrapInteger(10))
  const scope = new Scope(null, "test")

  scope.set(variable.name, variable)
  expect(scope.has(variable.name)).toBeTruthy()
})

Deno.test("An item exists in parents Scopes", () => {
  const variable = new ScrapVariable("myVar", false, new ScrapInteger(10))

  const parentScope = new Scope(null, "parent of test")
  const scope = new Scope(parentScope, "test")

  parentScope.set(variable.name, variable)
  expect(scope.has(variable.name)).toBeTruthy()
})