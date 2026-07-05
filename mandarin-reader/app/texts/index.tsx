import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { theme } from "../../src/lib/theme";
import { TextCard } from "../../src/components/TextCard";
import { deleteText, listTexts, SavedText } from "../../src/db/database";
import { ScreenFrame } from "../../src/components/ScreenFrame";

export default function TextsListScreen() {
  const [texts, setTexts] = useState<SavedText[]>([]);

  const reload = useCallback(() => {
    listTexts().then(setTexts);
  }, []);

  // refetch every time this screen regains focus (e.g. after add/edit)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <ScreenFrame title="我的文章" showBackButton onBack={() => router.back()}>
      <FlatList
        data={texts}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        ListEmptyComponent={
          <View style={{ marginTop: 64, alignItems: "center" }}>
            <Text style={{ color: theme.inkSoft, fontSize: 13 }}>
              还没有文章
            </Text>
            <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}>
              Tap + to add your first text
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TextCard
            text={item}
            onOpen={() => router.push(`/texts/${item.id}`)}
            onEdit={() => router.push(`/texts/add?id=${item.id}`)}
            onDelete={async () => {
              await deleteText(item.id);
              reload();
            }}
          />
        )}
      />

      <Pressable
        onPress={() => router.push("/texts/add")}
        style={{
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: theme.seal,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Plus size={24} color="white" />
      </Pressable>
    </ScreenFrame>
  );
}
