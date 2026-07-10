import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { Tag, X } from "lucide-react-native";
import { theme, NAME_COLORS } from "../../src/lib/theme";
import { getText, saveText, getNoPinyinChars, setNoPinyinChars as saveNoPinyinChars, lookupWordAt, saveWord, SavedText, NameTag, DictionaryEntry } from "../../src/db/database";import { getPinyinForText, PinyinChar } from "../../src/lib/pinyin";
import { CharacterCell } from "../../src/components/CharacterCell";
import { PinyinPopup } from "../../src/components/PinyinPopup";
import { DefinitionPopup } from "../../src/components/DefinitionPopup";
import { ScreenFrame } from "../../src/components/ScreenFrame";

type HighlightColor = { bg: string; fg: string } | null;

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState<SavedText | null>(null);
  const [noPinyinChars, setNoPinyinChars] = useState<string[]>([]);
  const [popup, setPopup] = useState<{ index: number; pc: PinyinChar } | null>(
    null
  );
  const [namesBarOpen, setNamesBarOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
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

  function addName() {
    if (!text) return;
    const n = nameInput.trim();
    if (!n) return;
    if (text.names.some((x) => x.name === n)) {
      setNameInput("");
      return;
    }
    const nextText = {
      ...text,
      names: [
        ...text.names,
        { name: n, color: NAME_COLORS[text.names.length % NAME_COLORS.length] },
      ],
    };
    setText(nextText);
    saveText(nextText);
    setNameInput("");
  }

  function removeName(i: number) {
    if (!text) return;
    const nextText = { ...text, names: text.names.filter((_, idx) => idx !== i) };
    setText(nextText);
    saveText(nextText);
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
          onPress={() => setNamesBarOpen((o) => !o)}
          style={{ padding: 8 }}
        >
          <Tag
            size={20}
            color={
              namesBarOpen || text.names.length > 0 ? theme.seal : theme.line
            }
          />
        </Pressable>
      }
    >
      {namesBarOpen && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 4,
            borderBottomWidth: 1,
            borderBottomColor: theme.line,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={addName}
              placeholder="例如：王芳"
              style={{
                flex: 1,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.line,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: theme.ink,
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={addName}
              style={{
                backgroundColor: theme.jade,
                borderRadius: 12,
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white" }}>添加</Text>
            </Pressable>
          </View>

          {text.names.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                paddingBottom: 8,
              }}
            >
              {text.names.map((n, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: n.color.bg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: n.color.fg, fontSize: 12 }}>
                    {n.name}
                  </Text>
                  <Pressable onPress={() => removeName(i)}>
                    <X size={12} color={n.color.fg} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
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
            saved_at: new Date().toISOString(),
          });
        }}
      />
    </ScreenFrame>
  );
}
