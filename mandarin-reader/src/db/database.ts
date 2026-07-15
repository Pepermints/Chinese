import * as SQLite from "expo-sqlite";
import { CEDICT_TSV } from "../data/cedict";

export type NameTag = { name: string; color: { bg: string; fg: string } };

export type Book = {
  id: string;
  title: string;
  names: NameTag[];
  createdAt: string;
};

export type SavedText = {
  id: string;
  title: string;
  content: string; // always simplified — conversion happens on save
  book_id: string;
  createdAt: string;
};

export type DictionaryEntry = {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string; // pipe-separated
};

export type VocabEntry = {
  id: string;
  word: string;
  pinyin: string | null;
  definitions: string | null;
  source_text_id: string;
  source_text_title: string;
  source_book_title: string;
  saved_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("mandarin_reader.db");
  }
  return dbPromise;
}

export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      names TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS texts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      book_id TEXT NOT NULL REFERENCES books(id),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dictionary (
      traditional TEXT,
      simplified TEXT,
      pinyin TEXT,
      definitions TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_dictionary_simplified ON dictionary(simplified);
    CREATE INDEX IF NOT EXISTS idx_dictionary_traditional ON dictionary(traditional);
    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      pinyin TEXT,
      definitions TEXT,
      source_text_id TEXT NOT NULL,
      source_text_title TEXT NOT NULL,
      source_book_title TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );
  `);

  const existing = await getNoPinyinChars();
  if (existing.length === 0) {
    await setNoPinyinChars(["的", "了", "是", "我"]);
  }

  await ensureDictionaryLoaded();
}

// One-time, idempotent migration: bulk-loads the bundled CC-CEDICT subset
// (src/data/cedict.ts) into the dictionary table on first run.
async function ensureDictionaryLoaded(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM dictionary"
  );
  if (row && row.count > 0) return;

  const lines = CEDICT_TSV.split("\n");
  await db.withTransactionAsync(async () => {
    const statement = await db.prepareAsync(
      "INSERT INTO dictionary (traditional, simplified, pinyin, definitions) VALUES (?, ?, ?, ?)"
    );
    try {
      for (const line of lines) {
        const [traditional, simplified, pinyin, definitions] = line.split("\t");
        await statement.executeAsync([traditional, simplified, pinyin, definitions]);
      }
    } finally {
      await statement.finalizeAsync();
    }
  });
}

async function queryDictionaryExact(word: string): Promise<DictionaryEntry | null> {
  const db = await getDb();
  const bySimplified = await db.getFirstAsync<DictionaryEntry>(
    "SELECT traditional, simplified, pinyin, definitions FROM dictionary WHERE simplified = ? LIMIT 1",
    [word]
  );
  if (bySimplified) return bySimplified;
  return db.getFirstAsync<DictionaryEntry>(
    "SELECT traditional, simplified, pinyin, definitions FROM dictionary WHERE traditional = ? LIMIT 1",
    [word]
  );
}

export async function lookupWord(word: string): Promise<DictionaryEntry | null> {
  const found = await queryDictionaryExact(word);
  if (found) return found;
  const chars = Array.from(word);
  if (chars.length > 1) {
    return queryDictionaryExact(chars[0]);
  }
  return null;
}

const MAX_LOOKUP_WORD_LEN = 8;

// Dictionary-based maximum-match word segmentation: finds the longest
// dictionary entry starting at `charIndex` in `content`. Used instead of
// pinyin-pro's segmenter, which only groups a handful of polyphonic words
// (verified: 电话/朋友/学校 etc. all stay single-character under segmentation:true).
export async function lookupWordAt(
  content: string,
  charIndex: number
): Promise<(DictionaryEntry & { word: string }) | null> {
  const chars = Array.from(content);
  const maxLen = Math.min(MAX_LOOKUP_WORD_LEN, chars.length - charIndex);
  for (let len = maxLen; len >= 1; len--) {
    const candidate = chars.slice(charIndex, charIndex + len).join("");
    const entry = await queryDictionaryExact(candidate);
    if (entry) return { ...entry, word: candidate };
  }
  return null;
}

export async function listBooks(): Promise<Book[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM books ORDER BY title COLLATE NOCASE ASC"
  );
  return rows.map(rowToBook);
}

export async function getBook(id: string): Promise<Book | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>("SELECT * FROM books WHERE id = ?", [
    id,
  ]);
  return row ? rowToBook(row) : null;
}

export async function getBookByTitle(title: string): Promise<Book | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM books WHERE title = ? COLLATE NOCASE",
    [title]
  );
  return row ? rowToBook(row) : null;
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO books (id, title, names, created_at) VALUES (?, ?, ?, ?)`,
    [book.id, book.title, JSON.stringify(book.names), book.createdAt]
  );
}

export async function updateBookNames(
  bookId: string,
  names: NameTag[]
): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE books SET names = ? WHERE id = ?", [
    JSON.stringify(names),
    bookId,
  ]);
}

export async function updateBookTitle(
  bookId: string,
  title: string
): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>(
    "SELECT id FROM books WHERE title = ? COLLATE NOCASE AND id != ?",
    [title, bookId]
  );
  if (existing) {
    throw new Error("A book with that name already exists");
  }
  await db.runAsync("UPDATE books SET title = ? WHERE id = ?", [title, bookId]);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM texts WHERE book_id = ?", [id]);
    await db.runAsync("DELETE FROM books WHERE id = ?", [id]);
  });
}

export async function getTextCountForBook(bookId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM texts WHERE book_id = ?",
    [bookId]
  );
  return row?.count ?? 0;
}

export async function listTextsForBook(bookId: string): Promise<SavedText[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM texts WHERE book_id = ? ORDER BY title COLLATE NOCASE ASC",
    [bookId]
  );
  return rows.map(rowToText);
}

export async function getText(
  id: string
): Promise<(SavedText & { bookNames: NameTag[]; bookTitle: string }) | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT texts.*, books.names AS book_names, books.title AS book_title
     FROM texts JOIN books ON texts.book_id = books.id
     WHERE texts.id = ?`,
    [id]
  );
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    book_id: row.book_id,
    createdAt: row.created_at,
    bookNames: JSON.parse(row.book_names),
    bookTitle: row.book_title,
  };
}

export async function saveText(text: {
  id: string;
  title: string;
  content: string;
  book_id: string;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO texts (id, title, content, book_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [text.id, text.title, text.content, text.book_id, text.createdAt]
  );
}

export async function deleteText(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM texts WHERE id = ?", [id]);
}

export async function moveTextToBook(
  textId: string,
  newBookId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE texts SET book_id = ? WHERE id = ?", [
    newBookId,
    textId,
  ]);
}

export async function getNoPinyinChars(): Promise<string[]> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT value FROM settings WHERE key = 'no_pinyin_chars'"
  );
  return row ? JSON.parse(row.value) : [];
}

export async function setNoPinyinChars(chars: string[]): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES ('no_pinyin_chars', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [JSON.stringify(chars)]
  );
}

export async function saveWord(entry: VocabEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO vocabulary
       (id, word, pinyin, definitions, source_text_id, source_text_title, source_book_title, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.word,
      entry.pinyin,
      entry.definitions,
      entry.source_text_id,
      entry.source_text_title,
      entry.source_book_title,
      entry.saved_at,
    ]
  );
}

export async function listVocabulary(): Promise<VocabEntry[]> {
  const db = await getDb();
  return db.getAllAsync<VocabEntry>(
    "SELECT * FROM vocabulary ORDER BY saved_at DESC"
  );
}

export async function deleteWord(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM vocabulary WHERE id = ?", [id]);
}

function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    names: JSON.parse(row.names),
    createdAt: row.created_at,
  };
}

function rowToText(row: any): SavedText {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    book_id: row.book_id,
    createdAt: row.created_at,
  };
}
