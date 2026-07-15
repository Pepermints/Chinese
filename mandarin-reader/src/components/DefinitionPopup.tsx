import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { theme } from "../lib/theme";

type Props = {
  visible: boolean;
  word: string | null;
  pinyin: string | null;
  definitions: string | null;
  onClose: () => void;
  onSaveWord: () => void;
};

export function DefinitionPopup({
  visible,
  word,
  pinyin,
  definitions,
  onClose,
  onSaveWord,
}: Props) {
  const defList = definitions ? definitions.split("|").filter(Boolean) : [];
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) setSaved(false);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(20,16,10,0.35)",
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
          }}
        >
          <View
            style={{
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 40, color: theme.ink }}>{word}</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: theme.inkSoft,
                marginTop: 4,
              }}
            >
              {pinyin ?? "—"}
            </Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            {defList.length > 0 ? (
              defList.map((def, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 15,
                    color: theme.ink,
                    marginBottom: 6,
                    lineHeight: 20,
                  }}
                >
                  {i + 1}. {def}
                </Text>
              ))
            ) : (
              <Text style={{ fontSize: 15, color: theme.inkSoft }}>
                No definition found.
              </Text>
            )}
          </View>

          <Pressable
            onPress={
              saved
                ? undefined
                : () => {
                    onSaveWord();
                    setSaved(true);
                  }
            }
            style={{
              backgroundColor: theme.jade,
              borderRadius: 16,
              paddingVertical: 14,
              marginBottom: 8,
              opacity: saved ? 0.6 : 1,
            }}
          >
            <Text style={{ textAlign: "center", color: "white", fontWeight: "600" }}>
              {saved ? "✓ Saved" : "Save word"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ paddingVertical: 14 }}>
            <Text style={{ textAlign: "center", color: theme.inkSoft }}>
              Close
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
