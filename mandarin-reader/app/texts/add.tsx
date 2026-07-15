import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { theme } from "../../src/lib/theme";
import { toSimplified } from "../../src/lib/simplify";
import {
  Book,
  getBookByTitle,
  getText,
  listBooks,
  moveTextToBook,
  saveBook,
  saveText,
} from "../../src/db/database";
import { ScreenFrame } from "../../src/components/ScreenFrame";

export default function AddEditScreen() {
  const { id, bookId } = useLocalSearchParams<{ id?: string; bookId?: string }>();
  const editingId = id ?? null;

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [newBookName, setNewBookName] = useState("");
  const [bookPickerMode, setBookPickerMode] = useState<"select" | "create">(
    "select"
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookError, setBookError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalBookId, setOriginalBookId] = useState<string | null>(null);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function load() {
      const loadedBooks = await listBooks();
      setBooks(loadedBooks);

      if (editingId) {
        const t = await getText(editingId);
        if (t) {
          setTitle(t.title);
          setContent(t.content);
          setSelectedBookId(t.book_id);
          setOriginalBookId(t.book_id);
          setOriginalCreatedAt(t.createdAt);
        }
      } else if (bookId) {
        setSelectedBookId(bookId);
        setBookPickerMode("select");
      }

      setLoading(false);
    }
    load();
  }, [editingId, bookId]);

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setBookError(null);

    let resolvedBookId: string | null = null;

    if (bookPickerMode === "select" && selectedBookId) {
      resolvedBookId = selectedBookId;
    } else {
      const trimmed = newBookName.trim();
      if (!trimmed) {
        setBookError("Please enter a book name");
        return;
      }
      const found = await getBookByTitle(trimmed);
      if (found) {
        resolvedBookId = found.id;
      } else {
        const newBook: Book = {
          id: "b-" + Date.now(),
          title: trimmed,
          names: [],
          createdAt: new Date().toISOString(),
        };
        await saveBook(newBook);
        resolvedBookId = newBook.id;
      }
    }

    if (!resolvedBookId) {
      setBookError("Please select or create a book");
      return;
    }

    const simplified = toSimplified(content);

    if (editingId && originalBookId && resolvedBookId !== originalBookId) {
      await moveTextToBook(editingId, resolvedBookId);
    }

    await saveText({
      id: editingId ?? "t-" + Date.now(),
      title: title.trim(),
      content: simplified,
      book_id: resolvedBookId,
      createdAt:
        editingId && originalCreatedAt
          ? originalCreatedAt
          : new Date().toISOString(),
    });

    router.replace(`/books/${resolvedBookId}`);
  }

  if (loading) return null;

  return (
    <ScreenFrame
      title={editingId ? "Edit text" : "Add text"}
      showBackButton
      onBack={() => router.back()}
      rightAction={
        <Pressable onPress={handleSave} disabled={!canSave} style={{ padding: 8 }}>
          <Check size={20} color={canSave ? theme.seal : theme.line} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Label>Book</Label>

        {books.length === 0 && !editingId && (
          <>
            <Text style={{ color: theme.inkSoft, fontSize: 12, marginBottom: 8 }}>
              Type a new book name to get started
            </Text>
            <TextInput
              value={newBookName}
              onChangeText={setNewBookName}
              placeholder="e.g. The Dream of the Red Chamber"
              style={inputStyle}
            />
          </>
        )}

        {books.length > 0 && (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <Pressable
                onPress={() => setBookPickerMode("select")}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor:
                    bookPickerMode === "select" ? theme.seal : theme.card,
                  borderWidth: bookPickerMode === "select" ? 0 : 1,
                  borderColor: theme.line,
                }}
              >
                <Text
                  style={{
                    color: bookPickerMode === "select" ? "white" : theme.ink,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Select existing
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBookPickerMode("create")}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor:
                    bookPickerMode === "create" ? theme.seal : theme.card,
                  borderWidth: bookPickerMode === "create" ? 0 : 1,
                  borderColor: theme.line,
                }}
              >
                <Text
                  style={{
                    color: bookPickerMode === "create" ? "white" : theme.ink,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  New book
                </Text>
              </Pressable>
            </View>

            {bookPickerMode === "select" ? (
              <ScrollView
                style={{
                  maxHeight: 160,
                  borderWidth: 1,
                  borderColor: theme.line,
                  borderRadius: 12,
                  backgroundColor: theme.card,
                }}
                nestedScrollEnabled
              >
                {books.map((b, i) => (
                  <Pressable
                    key={b.id}
                    onPress={() => setSelectedBookId(b.id)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: i === books.length - 1 ? 0 : 0.5,
                      borderBottomColor: theme.line,
                    }}
                  >
                    <Text style={{ color: theme.ink, fontSize: 14 }}>
                      {b.title}
                    </Text>
                    {selectedBookId === b.id && (
                      <Check size={16} color={theme.jade} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                value={newBookName}
                onChangeText={setNewBookName}
                placeholder="New book title"
                style={inputStyle}
              />
            )}
          </>
        )}

        {bookError && (
          <Text style={{ color: theme.seal, fontSize: 12, marginTop: 4 }}>
            {bookError}
          </Text>
        )}

        <Label>Title</Label>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give the text a title"
          style={inputStyle}
        />

        <Label>Text (simplified or traditional — auto-converted on save)</Label>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Paste or type Chinese text…"
          multiline
          numberOfLines={7}
          style={[inputStyle, { height: 160, textAlignVertical: "top" }]}
        />
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
