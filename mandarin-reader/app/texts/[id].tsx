import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "../../src/lib/theme";
import { getText, getNoPinyinChars, setNoPinyinChars as saveNoPinyinChars, SavedText, NameTag } from "../../src/db/database";import { getPinyinForText, PinyinChar } from "../../src/lib/pinyin";
import { CharacterCell } from "../../src/components/CharacterCell";
import { PinyinPopup } from "../../src/components/PinyinPopup";
import { ScreenFrame } from "../../src/components/ScreenFrame";

type HighlightColor = { bg: string; fg: string } | null;

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState<SavedText | null>(null);
  const [noPinyinChars, setNoPinyinChars] = useState<string[]>([]);
  const [popup, setPopup] = useState<{ index: number; pc: PinyinChar } | null>(
    null
  );

  useEffect(() => {
    getText(id).then(setText);
    getNoPinyinChars().then(setNoPinyinChars);
  }, [id]);

  // Pinyin is computed ONCE for the whole text (not per paragraph) so
  // word-segmentation context is preserved for polyphonic characters.
  const pinyinChars = useMemo(
    () => (text ? getPinyinForText(text.content) : []),
    [text]
  );

  // Figure out which character indices belong to which highlighted name,
  // longest name first so e.g. "天安门广场" wins over a shorter overlapping match.
  const highlight = useMemo(() => {
    if (!text) return [] as HighlightColor[];
    const result: HighlightColor[] = new Array(pinyinChars.length).fill(null);
    const sorted = [...text.names].sort((a, b) => b.name.length - a.name.length);
    sorted.forEach((n: NameTag) => {
      let searchFrom = 0;
      while (true) {
        const idx = text.content.indexOf(n.name, searchFrom);
        if (idx === -1) break;
        const nChars = Array.from(n.name).length;
        const startIdx = Array.from(text.content.slice(0, idx)).length;
        let free = true;
        for (let i = 0; i < nChars; i++) if (result[startIdx + i]) free = false;
        if (free) {
          for (let i = 0; i < nChars; i++) result[startIdx + i] = n.color;
        }
        searchFrom = idx + n.name.length;
      }
    });
    return result;
  }, [text, pinyinChars.length]);

  const paragraphs = useMemo(() => {
    if (!text) return [] as { chars: PinyinChar[]; hl: HighlightColor[]; startIndex: number }[];
    const rawParagraphs = text.content.split(/\n+/);
    let cursor = 0;
    return rawParagraphs.map((p) => {
      const len = Array.from(p).length;
      const chars = pinyinChars.slice(cursor, cursor + len);
      const hl = highlight.slice(cursor, cursor + len);
      const startIndex = cursor;
      cursor += len;
      return { chars, hl, startIndex };
    });
  }, [text, pinyinChars, highlight]);

  function isVisible(pc: PinyinChar) {
  return !noPinyinChars.includes(pc.char);
  }

  if (!text) return null;

  return (
    <ScreenFrame title={text.title} showBackButton onBack={() => router.back()}>
      <FlashList
        data={paragraphs}
        estimatedItemSize={80}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
          >
            {item.chars.map((pc, i) => {
              const globalIndex = item.startIndex + i;
              const hl = item.hl[i];
              const prevHl = i > 0 ? item.hl[i - 1] : null;
              const nextHl = i < item.hl.length - 1 ? item.hl[i + 1] : null;
              return (
                <CharacterCell
                  key={globalIndex}
                  char={pc.char}
                  py={pc.py}
                  tone={pc.tone}
                  visible={!!pc.py && isVisible(pc)}
                  highlightBg={hl?.bg}
                  highlightFg={hl?.fg}
                  roundLeft={!!hl && hl !== prevHl}
                  roundRight={!!hl && hl !== nextHl}
                  onLongPress={() => setPopup({ index: globalIndex, pc })}
                />
              );
            })}
          </View>
        )}
      />

      <PinyinPopup
        visible={!!popup}
        char={popup?.pc.char ?? null}
        py={popup?.pc.py ?? null}
        tone={popup?.pc.tone ?? 0}
        onAddToNoPinyin={async () => {
          if (!popup) return;
          const char = popup.pc.char;
          if (!noPinyinChars.includes(char)) {
          const next = [...noPinyinChars, char];
          setNoPinyinChars(next);
          await saveNoPinyinChars(next);
        }
        setPopup(null);
    }}
        onClose={() => setPopup(null)}
      />
    </ScreenFrame>
  );
}
