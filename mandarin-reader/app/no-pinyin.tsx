import React, { useEffect, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { theme } from "../src/lib/theme";
import { getNoPinyinChars, setNoPinyinChars } from "../src/db/database";
import { ScreenFrame } from "../src/components/ScreenFrame";

export default function NoPinyinScreen() {
  const [chars, setChars] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    getNoPinyinChars().then(setChars);
  }, []);

  async function addChars() {
    const toAdd = Array.from(input.trim()).filter(
      (c) => c.trim() && !chars.includes(c)
    );
    if (toAdd.length) {
      const next = [...chars, ...toAdd];
      setChars(next);
      await setNoPinyinChars(next);
    }
    setInput("");
  }

  async function removeChar(c: string) {
    const next = chars.filter((x) => x !== c);
    setChars(next);
    await setNoPinyinChars(next);
  }

  return (
    <ScreenFrame title="免拼音字" showBackButton onBack={() => router.back()}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.inkSoft, fontSize: 12, marginBottom: 16 }}>
          Characters in this list won't show pinyin in the reading view —
          useful for words you already know well.
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={addChars}
            placeholder="example：的"
            style={{
              flex: 1,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.line,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: theme.ink,
            }}
          />
          <Pressable
            onPress={addChars}
            style={{
              backgroundColor: theme.jade,
              borderRadius: 12,
              paddingHorizontal: 16,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white" }}>add</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {chars.map((c) => (
            <View
              key={c}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.line,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: theme.ink, fontSize: 15 }}>{c}</Text>
              <Pressable onPress={() => removeChar(c)}>
                <X size={12} color={theme.inkSoft} />
              </Pressable>
            </View>
          ))}
          {chars.length === 0 && (
            <Text style={{ color: theme.inkSoft, fontSize: 12 }}>
              No characters added yet
            </Text>
          )}
        </View>
      </View>
    </ScreenFrame>
  );
}
