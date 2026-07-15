import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { theme } from "../lib/theme";

type Props = {
  visible: boolean;
  char: string | null;
  py: string | null;
  tone: number;
  hidden: boolean;
  onToggleHidden: () => void;
  onClose: () => void;
};

export function PinyinPopup({
  visible,
  char,
  py,
  tone,
  hidden,
  onToggleHidden,
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
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
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
            <Text style={{ fontSize: 12, color: theme.inkSoft, marginTop: 8 }}>
              {hidden ? "Pinyin hidden" : "Pinyin visible"}
            </Text>
          </View>

          <Pressable
            onPress={onToggleHidden}
            style={{
              backgroundColor: theme.seal,
              borderRadius: 16,
              paddingVertical: 14,
              marginBottom: 8,
            }}
          >
            <Text style={{ textAlign: "center", color: "white", fontWeight: "600" }}>
              {hidden ? "Show pinyin" : "Hide pinyin"}
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