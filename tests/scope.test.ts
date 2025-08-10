import { expect } from "jsr:@std/expect"

import { Scope } from "../src/engine/scope.ts"
import { ScrapVariable } from "@lang/elements/entities/variables.ts"
import { ScrapString } from "@lang/elements/values/textuals.ts"

Deno.test("Variable with different declarations in different scopes", () => {
  const scope1 = new Scope(null, "MainModule")
  const scope2 = new Scope(scope1, "Test")

  scope1.set("name", new ScrapVariable(true, "name", new ScrapString("Rawabi Superior"), true))
  scope2.set("name", new ScrapVariable(true, "name", new ScrapString("Rawabi interno"), true))

  expect(scope2.get("name")?.name).toBe("name")
})