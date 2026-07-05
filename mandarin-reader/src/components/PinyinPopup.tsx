import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { theme } from "../lib/theme";

type Props = {
  visible: boolean;
  char: string | null;
  py: string | null;
  tone: number;
  isVisible: boolean; // is pinyin currently shown for this specific character instance
  onToggle: () => void;
  onClose: () => void;
};

export function PinyinPopup({
  visible,
  char,
  py,
  tone,
  isVisible,
  onToggle,
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
              <Text style={{ fontSize: 12, color: theme.inkSoft }}>
                {isVisible ? "Pinyin being displayed" : "Pinyin hidden"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onToggle}
            style={{
              backgroundColor: theme.seal,
              borderRadius: 16,
              paddingVertical: 14,
              marginBottom: 8,
            }}
          >
            <Text
              style={{ textAlign: "center", color: "white", fontWeight: "600" }}
            >
              {isVisible ? "hide pinyin" : "show pinyin"}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ paddingVertical: 14 }}>
            <Text style={{ textAlign: "center", color: theme.inkSoft }}>
              cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
