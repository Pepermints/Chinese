import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { theme, NAME_COLORS } from "../src/lib/theme";
import { listVocabulary, deleteWord, VocabEntry } from "../src/db/database";
import { ScreenFrame } from "../src/components/ScreenFrame";

type Group = {
  title: string;
  entries: VocabEntry[];
  latestSavedAt: string;
};

function groupByText(entries: VocabEntry[]): Group[] {
  const map = new Map<string, VocabEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.source_text_title) ?? [];
    list.push(entry);
    map.set(entry.source_text_title, list);
  }
  const groups: Group[] = Array.from(map.entries()).map(([title, es]) => ({
    title,
    entries: es,
    latestSavedAt: es.reduce(
      (max, e) => (e.saved_at > max ? e.saved_at : max),
      es[0].saved_at
    ),
  }));
  groups.sort((a, b) => (a.latestSavedAt < b.latestSavedAt ? 1 : -1));
  return groups;
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

  const groups = groupByText(vocabulary);

  return (
    <ScreenFrame title="我的词语" showBackButton onBack={() => router.back()}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {groups.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 64 }}>
            <Text style={{ color: theme.ink, fontSize: 13 }}>还没有词语</Text>
            <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}>
              Tap any word while reading to look it up and save it
            </Text>
          </View>
        )}

        {groups.map((group, groupIndex) => {
          const color = NAME_COLORS[groupIndex % NAME_COLORS.length];
          return (
            <View key={group.title}>
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: groupIndex === 0 ? 0 : 10,
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
                  {group.title} · {group.entries.length} word
                  {group.entries.length === 1 ? "" : "s"}
                </Text>
              </View>

              {group.entries.map((entry) => {
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
      </ScrollView>
    </ScreenFrame>
  );
}
