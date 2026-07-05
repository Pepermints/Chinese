/**
 * Traditional -> Simplified conversion.
 *
 * opencc-js is the best-in-class dictionary here, but its default entry
 * point is written for browsers and dynamically fetches its dictionary
 * chunks. React Native's Metro bundler does not resolve dynamic
 * fetch()-based chunk loading the way webpack does — so before you build
 * on this, smoke-test the import path below in isolation:
 *
 *   import * as OpenCC from "opencc-js";
 *   const converter = OpenCC.Converter({ from: "tw", to: "cn" });
 *   converter("測試"); // should return "测试" synchronously, no network
 *
 * If that hangs, throws, or returns a Promise/undefined under Metro, fall
 * back to a package with statically bundled dictionary data instead, e.g.
 * `cnchar` + `cnchar-trad` (both plain JS objects, no fetch), or vendor a
 * static CC-CEDICT-derived JSON of traditional->simplified pairs and do a
 * simple character-map replace (same approach as the web prototype, just
 * with a much bigger table). Either swap is a one-file change since all
 * calls in this app go through `toSimplified()` below.
 */
import * as OpenCC from "opencc-js";

let converter: ((text: string) => string) | null = null;

function getConverter() {
  if (!converter) {
    // "tw" (Taiwan traditional) covers most pasted traditional text;
    // swap to "hk" if you specifically need Hong Kong variants.
    converter = OpenCC.Converter({ from: "tw", to: "cn" });
  }
  return converter;
}

export function toSimplified(text: string): string {
  try {
    return getConverter()(text);
  } catch (err) {
    console.warn("opencc-js conversion failed, returning original text", err);
    return text;
  }
}
