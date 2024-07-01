import SObject from "./object.ts";

export class Module {

  /**
   * The module name
   */
  moduleName: string

  /**
   * Exports of a module
   */
  exports: SObject

  hasDefaultExport: boolean

  public constructor(moduleName: string, mExports: SObject, hasDefaultExport: boolean) {
    this.moduleName = moduleName
    this.exports = mExports
    this.hasDefaultExport = hasDefaultExport
  }
}