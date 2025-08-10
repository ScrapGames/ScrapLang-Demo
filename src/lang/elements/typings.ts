/**
 * Type definition for ScrapLang elements
 */

import { ScrapValue } from "@lang/elements/commons.ts"
import { ScrapVisibility } from "@typings"

/**
 * Represents metadata
 */
export interface ScrapPropertyMetadata {
  visibility: ScrapVisibility,
  isStatic: boolean,
  writeable: boolean
}

/**
* Represents valid valuse to ScrapObject keys (identifiers, strings literals and integers)
*/
export interface ScrapObjectProperty {
  metaproperties: ScrapPropertyMetadata,
  value: ScrapValue
}