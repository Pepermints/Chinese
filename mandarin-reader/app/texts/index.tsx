import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Pencil, Plus, Trash2 } from "lucide-react-native";
import { theme } from "../../src/lib/theme";
import {
  Book,
  deleteBook,
  getTextCountForBook,
  listBooks,
  updateBookTitle,
} from "../../src/db/database";
import { ScreenFrame } from "../../src/components/ScreenFrame";

export default function BooksListScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const reload = useCallback(() => {
    listBooks().then(async (list) => {
      setBooks(list);
      const entries = await Promise.all(
        list.map(async (b) => [b.id, await getTextCountForBook(b.id)] as const)
      );
      setCounts(Object.fromEntries(entries));
    });
  }, []);

  // refetch every time this screen regains focus (e.g. after add/edit)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <ScreenFrame title="My texts" showBackButton onBack={() => router.back()}>
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        ListEmptyComponent={
          <View style={{ marginTop: 64, alignItems: "center" }}>
            <Text style={{ color: theme.ink, fontSize: 13 }}>No books yet</Text>
            <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}>
              Tap + to add your first text
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            textCount={counts[item.id] ?? 0}
            onOpen={() => router.push(`/books/${item.id}`)}
            onDelete={async () => {
              await deleteBook(item.id);
              reload();
            }}
            onRename={async (title) => {
              await updateBookTitle(item.id, title);
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

function BookCard({
  book,
  textCount,
  onOpen,
  onDelete,
  onRename,
}: {
  book: Book;
  textCount: number;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (title: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(book.title);
  const [error, setError] = useState<string | null>(null);

  async function submitRename() {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === book.title) {
      setEditing(false);
      setTitleInput(book.title);
      setError(null);
      return;
    }
    try {
      await onRename(trimmed);
      setEditing(false);
      setError(null);
    } catch {
      setError("That name is already taken");
    }
  }

  function cancelRename() {
    setEditing(false);
    setTitleInput(book.title);
    setError(null);
  }

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
      {editing ? (
        <View>
          <TextInput
            value={titleInput}
            onChangeText={setTitleInput}
            onSubmitEditing={submitRename}
            onBlur={cancelRename}
            autoFocus
            style={{
              backgroundColor: theme.paper,
              borderWidth: 1,
              borderColor: theme.line,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              color: theme.ink,
              fontSize: 16,
            }}
          />
          {error && (
            <Text style={{ color: theme.seal, fontSize: 12, marginTop: 4 }}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        <Pressable onPress={onOpen}>
          <Text style={{ color: theme.ink, fontWeight: "600", fontSize: 16 }}>
            {book.title}
          </Text>
          <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 4 }}>
            {textCount} text{textCount === 1 ? "" : "s"}
          </Text>
        </Pressable>
      )}

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
              Delete this book? All texts inside will also be deleted.
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
              onPress={() => {
                setTitleInput(book.title);
                setEditing(true);
              }}
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
