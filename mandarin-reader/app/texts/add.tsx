import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check, X } from "lucide-react-native";
import { theme, NAME_COLORS } from "../../src/lib/theme";
import { toSimplified } from "../../src/lib/simplify";
import { getText, saveText, NameTag } from "../../src/db/database";
import { ScreenFrame } from "../../src/components/ScreenFrame";

export default function AddEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ?? null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [names, setNames] = useState<NameTag[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [loaded, setLoaded] = useState(!editingId);

  useEffect(() => {
    if (editingId) {
      getText(editingId).then((t) => {
        if (t) {
          setTitle(t.title);
          setContent(t.content);
          setNames(t.names);
        }
        setLoaded(true);
      });
    }
  }, [editingId]);

  function addName() {
    const n = nameInput.trim();
    if (!n) return;
    if (names.some((x) => x.name === n)) {
      setNameInput("");
      return;
    }
    setNames([
      ...names,
      { name: n, color: NAME_COLORS[names.length % NAME_COLORS.length] },
    ]);
    setNameInput("");
  }

  function removeName(i: number) {
    setNames(names.filter((_, idx) => idx !== i));
  }

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    const simplified = toSimplified(content);
    await saveText({
      id: editingId ?? "t-" + Date.now(),
      title: title.trim(),
      content: simplified,
      names,
      createdAt: editingId ? "" /* preserved by ON CONFLICT UPDATE not touching it */ : new Date().toLocaleDateString(),
    });
    router.replace("/texts");
  }

  if (!loaded) return null;

  return (
    <ScreenFrame
      title={editingId ? "编辑文章" : "添加文章"}
      showBackButton
      onBack={() => router.back()}
      rightAction={
        <Pressable onPress={handleSave} disabled={!canSave} style={{ padding: 8 }}>
          <Check size={20} color={canSave ? theme.seal : theme.line} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Label>标题 Title</Label>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="给文章起个名字"
          style={inputStyle}
        />

        <Label>正文 Text (简体 or 繁體 — auto-converted to simplified on save)</Label>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="粘贴或输入中文文本…"
          multiline
          numberOfLines={7}
          style={[inputStyle, { height: 160, textAlignVertical: "top" }]}
        />

        <Label>名字 Names to highlight (people, places…)</Label>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            onSubmitEditing={addName}
            placeholder="例如：王芳"
            style={[inputStyle, { flex: 1, marginBottom: 0 }]}
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
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: theme.inkSoft,
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
        marginTop: 12,
      }}
    >
      {children}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: theme.card,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: theme.ink,
  fontSize: 14,
  marginBottom: 4,
};
