import React from "react";
import { Pressable, Text, View } from "react-native";
import { theme } from "../lib/theme";

type Props = {
  char: string;
  py: string | null;
  tone: number;
  visible: boolean;
  highlightBg?: string;
  highlightFg?: string;
  roundLeft?: boolean;
  roundRight?: boolean;
  onLongPress: () => void;
};

export function CharacterCell({
  char,
  py,
  tone,
  visible,
  highlightBg,
  highlightFg,
  roundLeft,
  roundRight,
  onLongPress,
}: Props) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={450}
      style={{
        alignItems: "center",
        backgroundColor: highlightBg ?? "transparent",
        borderTopLeftRadius: roundLeft ? 6 : 0,
        borderBottomLeftRadius: roundLeft ? 6 : 0,
        borderTopRightRadius: roundRight ? 6 : 0,
        borderBottomRightRadius: roundRight ? 6 : 0,
        paddingHorizontal: 1,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          lineHeight: 13,
          height: 13,
          fontWeight: "600",
          color: py ? theme.toneColor(tone) : "transparent",
        }}
      >
        {visible && py ? py : " "}
      </Text>
      <Text
        style={{
          fontSize: 22,
          lineHeight: 30,
          fontFamily: theme.hanziFont,
          color: highlightFg ?? theme.ink,
        }}
      >
        {char}
      </Text>
    </Pressable>
  );
}
