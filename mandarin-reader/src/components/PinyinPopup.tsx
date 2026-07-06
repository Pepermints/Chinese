import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { theme } from "../lib/theme";

type Props = {
  visible: boolean;
  char: string | null;
  py: string | null;
  tone: number;
  onAddToNoPinyin: () => void;
  onClose: () => void;
};

export function PinyinPopup({
  visible,
  char,
  py,
  tone,
  onAddToNoPinyin,
  onClose,
}: Props) {
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
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 40, color: theme.ink }}>{char}</Text>
            <View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.toneColor(tone),
                }}
              >
                {py ?? "—"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onAddToNoPinyin}
            style={{
              backgroundColor: theme.seal,
              borderRadius: 16,
              paddingVertical: 14,
              marginBottom: 8,
            }}
          >
            <Text style={{ textAlign: "center", color: "white", fontWeight: "600" }}>
              Hide pinyin
            </Text>
            <Text style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
              Adds to 免拼音字 list
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ paddingVertical: 14 }}>
            <Text style={{ textAlign: "center", color: theme.inkSoft }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}