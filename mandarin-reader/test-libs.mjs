// test-libs.mjs — throwaway smoke test, safe to delete after checking output

import { pinyin } from "pinyin-pro";
import * as OpenCC from "opencc-js";

console.log("\n=== Testing pinyin-pro ===");
const text = "你好吗";
const chars = Array.from(text);
const symbols = pinyin(text, { type: "array", toneType: "symbol", segmentation: true });
const nums = pinyin(text, { type: "array", toneType: "num", segmentation: true });

console.log("Characters:", chars, "(length", chars.length, ")");
console.log("Pinyin symbols:", symbols, "(length", symbols.length, ")");
console.log("Pinyin with tone numbers:", nums);
console.log(
  chars.length === symbols.length
    ? "✅ PASS — lengths match, alignment is 1:1"
    : "❌ FAIL — lengths don't match, see pinyin.ts comment for what to check"
);

console.log("\n=== Testing opencc-js ===");
const converter = OpenCC.Converter({ from: "tw", to: "cn" });
const traditional = "測試看看這個轉換";
const result = converter(traditional);

console.log("Traditional input:", traditional);
console.log("Result:", result);
console.log("Result type:", typeof result);
console.log(
  typeof result === "string" && result !== traditional
    ? "✅ PASS — got a converted string synchronously"
    : "❌ FAIL — see simplify.ts comment for the fallback plan"
);