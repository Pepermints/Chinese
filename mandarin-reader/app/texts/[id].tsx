import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { Tag } from "lucide-react-native";
import { theme } from "../../src/lib/theme";
import {
  getText,
  getNoPinyinChars,
  setNoPinyinChars as saveNoPinyinChars,
  lookupWordAt,
  saveWord,
  SavedText,
  NameTag,
  DictionaryEntry,
} from "../../src/db/database";
import { getPinyinForText, PinyinChar } from "../../src/lib/pinyin";
import { CharacterCell } from "../../src/components/CharacterCell";
import { PinyinPopup } from "../../src/components/PinyinPopup";
import { DefinitionPopup } from "../../src/components/DefinitionPopup";
import { ScreenFrame } from "../../src/components/ScreenFrame";

type HighlightColor = { bg: string; fg: string } | null;

type TextWithBook = SavedText & { bookNames: NameTag[]; bookTitle: string };

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState<TextWithBook | null>(null);
  const [noPinyinChars, setNoPinyinChars] = useState<string[]>([]);
  const [popup, setPopup] = useState<{ index: number; pc: PinyinChar } | null>(
    null
  );
  const [definitionPopup, setDefinitionPopup] = useState<{ word: string } | null>(
    null
  );
  const [definitionData, setDefinitionData] = useState<
    (DictionaryEntry & { word: string }) | null
  >(null);

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
    const sorted = [...text.bookNames].sort(
      (a, b) => b.name.length - a.name.length
    );
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
    // Walk the character array directly (instead of string-splitting on \n)
    // so paragraph slices stay aligned with pinyinChars/highlight, which are
    // indexed against every character in content including newlines.
    const allChars = Array.from(text.content);
    const result: { chars: PinyinChar[]; hl: HighlightColor[]; startIndex: number }[] = [];
    let i = 0;
    while (i < allChars.length) {
      while (i < allChars.length && allChars[i] === "\n") i++;
      if (i >= allChars.length) break;
      const startIndex = i;
      while (i < allChars.length && allChars[i] !== "\n") i++;
      result.push({
        chars: pinyinChars.slice(startIndex, i),
        hl: highlight.slice(startIndex, i),
        startIndex,
      });
    }
    return result;
  }, [text, pinyinChars, highlight]);

  function isVisible(pc: PinyinChar) {
  return !noPinyinChars.includes(pc.char);
  }

  async function handleCharPress(globalIndex: number) {
    if (!text) return;
    const entry = await lookupWordAt(text.content, globalIndex);
    setDefinitionData(entry);
    setDefinitionPopup({ word: entry?.word ?? "" });
  }

  if (!text) return null;

  return (
    <ScreenFrame
      title={text.title}
      showBackButton
      onBack={() => router.back()}
      rightAction={
        <Pressable
          onPress={() => router.push(`/books/names?bookId=${text.book_id}`)}
          style={{ padding: 8, alignItems: "center" }}
        >
          <Tag size={20} color={theme.ink} />
          <Text style={{ fontSize: 9, color: theme.inkSoft }}>Names</Text>
        </Pressable>
      }
    >
      <FlashList
        style={{ flex: 1 }}
        data={paragraphs}
        //estimatedItemSize={80}
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
                  onPress={() => handleCharPress(globalIndex)}
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
        hidden={popup ? noPinyinChars.includes(popup.pc.char) : false}
        onToggleHidden={async () => {
          if (!popup) return;
          const char = popup.pc.char;
          const isHidden = noPinyinChars.includes(char);
          const next = isHidden
            ? noPinyinChars.filter((c) => c !== char)
            : [...noPinyinChars, char];
          setNoPinyinChars(next);
          await saveNoPinyinChars(next);
          setPopup(null);
        }}
        onClose={() => setPopup(null)}
      />

      <DefinitionPopup
        visible={!!definitionPopup}
        word={definitionData?.word ?? definitionPopup?.word ?? null}
        pinyin={definitionData?.pinyin ?? null}
        definitions={definitionData?.definitions ?? null}
        onClose={() => setDefinitionPopup(null)}
        onSaveWord={async () => {
          if (!definitionPopup || !definitionData || !text) return;
          await saveWord({
            id: definitionPopup.word + "_" + text.id,
            word: definitionPopup.word,
            pinyin: definitionData.pinyin ?? null,
            definitions: definitionData.definitions ?? null,
            source_text_id: text.id,
            source_text_title: text.title,
            source_book_title: text.bookTitle,
            saved_at: new Date().toISOString(),
          });
        }}
      />
    </ScreenFrame>
  );
}
