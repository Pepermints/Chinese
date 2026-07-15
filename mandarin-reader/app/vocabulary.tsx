import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { theme, NAME_COLORS } from "../src/lib/theme";
import { listVocabulary, deleteWord, VocabEntry } from "../src/db/database";
import { ScreenFrame } from "../src/components/ScreenFrame";

type TextSubgroup = {
  title: string;
  entries: VocabEntry[];
};

type BookGroup = {
  title: string;
  subgroups: TextSubgroup[];
};

function groupVocabulary(entries: VocabEntry[]): BookGroup[] {
  const byBook = new Map<string, VocabEntry[]>();
  for (const entry of entries) {
    const list = byBook.get(entry.source_book_title) ?? [];
    list.push(entry);
    byBook.set(entry.source_book_title, list);
  }

  const bookTitles = Array.from(byBook.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return bookTitles.map((bookTitle) => {
    const bookEntries = byBook.get(bookTitle)!;
    const byText = new Map<string, VocabEntry[]>();
    for (const entry of bookEntries) {
      const list = byText.get(entry.source_text_title) ?? [];
      list.push(entry);
      byText.set(entry.source_text_title, list);
    }

    const textTitles = Array.from(byText.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    const subgroups = textTitles.map((textTitle) => ({
      title: textTitle,
      entries: byText
        .get(textTitle)!
        .sort((a, b) => (a.saved_at < b.saved_at ? 1 : -1)),
    }));

    return { title: bookTitle, subgroups };
  });
}

function toneFromPinyin(pinyin: string | null): number | null {
  if (!pinyin) return null;
  const firstSyllable = pinyin.trim().split(/\s+/)[0] ?? "";
  const match = firstSyllable.match(/[1-4]$/);
  return match ? parseInt(match[0], 10) : null;
}

export default function VocabularyScreen() {
  const [vocabulary, setVocabulary] = useState<VocabEntry[]>([]);

  const reload = useCallback(() => {
    listVocabulary().then(setVocabulary);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleDelete(id: string) {
    await deleteWord(id);
    reload();
  }

  const groups = groupVocabulary(vocabulary);

  return (
    <ScreenFrame title="Vocabulary" showBackButton onBack={() => router.back()}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {groups.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 64 }}>
            <Text style={{ color: theme.ink, fontSize: 13 }}>
              No words saved yet
            </Text>
            <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}>
              Tap any word while reading to look it up and save it
            </Text>
          </View>
        )}

        {groups.map((book, bookIndex) => (
          <View key={book.title}>
            <Text
              style={{
                color: theme.ink,
                fontWeight: "500",
                fontSize: 13,
                marginTop: bookIndex === 0 ? 0 : 16,
                marginBottom: 6,
              }}
            >
              {book.title}
            </Text>

            {book.subgroups.map((sub, subIndex) => {
              const color = NAME_COLORS[subIndex % NAME_COLORS.length];
              return (
                <View key={sub.title}>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      marginTop: subIndex === 0 ? 0 : 10,
                      marginBottom: 6,
                      backgroundColor: color.bg,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: color.fg,
                        fontSize: 9,
                        fontWeight: "600",
                      }}
                    >
                      {sub.title} · {sub.entries.length} word
                      {sub.entries.length === 1 ? "" : "s"}
                    </Text>
                  </View>

                  {sub.entries.map((entry) => {
                    const tone = toneFromPinyin(entry.pinyin);
                    const firstDef = entry.definitions
                      ? entry.definitions.split("|")[0]
                      : "";
                    return (
                      <View
                        key={entry.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor: theme.card,
                          borderWidth: 1,
                          borderColor: theme.line,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          marginBottom: 5,
                        }}
                      >
                        <Text
                          style={{ fontSize: 22, color: theme.ink, minWidth: 40 }}
                        >
                          {entry.word}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 8,
                              fontWeight: "600",
                              color:
                                tone !== null
                                  ? theme.toneColor(tone)
                                  : theme.inkSoft,
                            }}
                          >
                            {entry.pinyin ?? "—"}
                          </Text>
                          <Text style={{ fontSize: 8, color: theme.inkSoft }}>
                            {firstDef}
                          </Text>
                        </View>
                        <Pressable onPress={() => handleDelete(entry.id)}>
                          <Trash2 size={14} color={theme.line} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </ScreenFrame>
  );
}
