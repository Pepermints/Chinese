import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Plus, Tag } from "lucide-react-native";
import { theme } from "../../src/lib/theme";
import { TextCard } from "../../src/components/TextCard";
import {
  Book,
  deleteText,
  getBook,
  listTextsForBook,
  SavedText,
} from "../../src/db/database";
import { ScreenFrame } from "../../src/components/ScreenFrame";

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [texts, setTexts] = useState<SavedText[]>([]);

  const reload = useCallback(() => {
    getBook(id).then(setBook);
    listTextsForBook(id).then(setTexts);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  if (!book) return null;

  return (
    <ScreenFrame
      title={book.title}
      showBackButton
      onBack={() => router.back()}
      rightAction={
        <Pressable
          onPress={() => router.push(`/books/names?bookId=${id}`)}
          style={{ padding: 8, alignItems: "center" }}
        >
          <Tag size={20} color={theme.ink} />
          <Text style={{ fontSize: 9, color: theme.inkSoft }}>Names</Text>
        </Pressable>
      }
    >
      <FlatList
        data={texts}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        ListEmptyComponent={
          <View style={{ marginTop: 64, alignItems: "center" }}>
            <Text style={{ color: theme.ink, fontSize: 13 }}>No texts yet</Text>
            <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}>
              Tap + to add the first text
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
        onPress={() => router.push(`/texts/add?bookId=${id}`)}
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
