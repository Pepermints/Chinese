import { pinyin } from "pinyin-pro";

export type PinyinChar = {
  char: string;
  py: string | null; // tone-marked pinyin, e.g. "wǒ" — null for non-Hanzi (punctuation, digits, latin)
  tone: number; // 1-4, 0 = neutral/no tone
};

const HANZI_RE = /[\u4e00-\u9fff]/;

/**
 * Runs the whole string through pinyin-pro ONCE (not character-by-character)
 * so word segmentation can pick the right reading for polyphonic characters
 * (e.g. 还 hái vs huán, 觉 jué vs jiào) based on context.
 *
 * NOTE: pinyin-pro's exact option names for how it treats non-Hanzi
 * characters (spacing/grouping behavior) have shifted across versions.
 * Before wiring this into the rest of the app, sanity-check with a quick
 * script that `getPinyinForText(text).length === Array.from(text).length`
 * for a few test strings — if pinyin-pro's output isn't 1:1 aligned with
 * input characters in the version you install, check its README for the
 * current per-character array option and adjust here.
 */
export function getPinyinForText(text: string): PinyinChar[] {
  const chars = Array.from(text);

  const symbols = pinyin(text, {
    type: "array",
    toneType: "symbol",
    segmentation: true,
  }) as string[];

  const nums = pinyin(text, {
    type: "array",
    toneType: "num",
    segmentation: true,
  }) as string[];

  return chars.map((char, i) => {
    if (!HANZI_RE.test(char)) {
      return { char, py: null, tone: 0 };
    }
    const sym = symbols[i] ?? null;
    const numStr = nums[i] ?? "";
    const toneMatch = numStr.match(/[1-4]$/);
    return {
      char,
      py: sym,
      tone: toneMatch ? parseInt(toneMatch[0], 10) : 0,
    };
  });
}
