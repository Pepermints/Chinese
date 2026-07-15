import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { theme, NAME_COLORS } from "../../src/lib/theme";
import { getBook, NameTag, updateBookNames } from "../../src/db/database";
import { ScreenFrame } from "../../src/components/ScreenFrame";

export default function BookNamesScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [names, setNames] = useState<NameTag[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    getBook(bookId).then((book) => {
      if (book) setNames(book.names);
    });
  }, [bookId]);

  async function addName() {
    const n = input.trim();
    if (!n) return;
    if (names.some((x) => x.name === n)) {
      setInput("");
      return;
    }
    const next = [
      ...names,
      { name: n, color: NAME_COLORS[names.length % NAME_COLORS.length] },
    ];
    setNames(next);
    await updateBookNames(bookId, next);
    setInput("");
  }

  async function removeName(i: number) {
    const next = names.filter((_, idx) => idx !== i);
    setNames(next);
    await updateBookNames(bookId, next);
  }

  return (
    <ScreenFrame
      title="Highlighted names"
      showBackButton
      onBack={() => router.back()}
    >
      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.inkSoft, fontSize: 12, marginBottom: 16 }}>
          Names defined here are highlighted across all texts in this book.
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={addName}
            placeholder="e.g. 林黛玉"
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
            <Text style={{ color: "white" }}>Add</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {names.map((n, i) => (
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
              <Text style={{ color: n.color.fg, fontSize: 12 }}>{n.name}</Text>
              <Pressable onPress={() => removeName(i)}>
                <X size={12} color={n.color.fg} />
              </Pressable>
            </View>
          ))}
          {names.length === 0 && (
            <Text style={{ color: theme.inkSoft, fontSize: 12 }}>
              No names added yet
            </Text>
          )}
        </View>
      </View>
    </ScreenFrame>
  );
}
