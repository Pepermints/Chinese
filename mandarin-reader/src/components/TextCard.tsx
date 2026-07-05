import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";
import { theme } from "../lib/theme";
import { SavedText } from "../db/database";

type Props = {
  text: SavedText;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TextCard({ text, onOpen, onEdit, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderColor: theme.line,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Pressable onPress={onOpen}>
        <Text style={{ color: theme.ink, fontWeight: "600", fontSize: 16 }}>
          {text.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}
        >
          {text.content.slice(0, 18)}…
        </Text>
        <Text style={{ color: theme.inkSoft, fontSize: 11, marginTop: 8 }}>
          {text.createdAt}
        </Text>
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          justifyContent: confirming ? "space-between" : "flex-start",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.line,
        }}
      >
        {confirming ? (
          <>
            <Text style={{ color: theme.seal, fontSize: 12, fontWeight: "600" }}>
              Delete this article?
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setConfirming(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.line,
                }}
              >
                <Text style={{ color: theme.inkSoft, fontSize: 12 }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: theme.seal,
                }}
              >
                <Text style={{ color: "white", fontSize: 12 }}>Delete</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Pressable
              onPress={onEdit}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: theme.jadeSoft,
              }}
            >
              <Pencil size={13} color={theme.jade} />
              <Text style={{ color: theme.jade, fontSize: 12 }}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirming(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: theme.sealSoft,
              }}
            >
              <Trash2 size={13} color={theme.seal} />
              <Text style={{ color: theme.seal, fontSize: 12 }}>Delete</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
