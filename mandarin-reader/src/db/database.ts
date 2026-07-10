import * as SQLite from "expo-sqlite";
import { CEDICT_TSV } from "../data/cedict";

export type NameTag = { name: string; color: { bg: string; fg: string } };

export type SavedText = {
  id: string;
  title: string;
  content: string; // always simplified — conversion happens on save
  names: NameTag[];
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
    CREATE TABLE IF NOT EXISTS texts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      names TEXT NOT NULL,
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

export async function listTexts(): Promise<SavedText[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM texts ORDER BY created_at DESC"
  );
  return rows.map(rowToText);
}

export async function getText(id: string): Promise<SavedText | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>("SELECT * FROM texts WHERE id = ?", [
    id,
  ]);
  return row ? rowToText(row) : null;
}

export async function saveText(text: SavedText): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO texts (id, title, content, names, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       content = excluded.content,
       names = excluded.names`,
    [
      text.id,
      text.title,
      text.content,
      JSON.stringify(text.names),
      text.createdAt,
    ]
  );
}

export async function deleteText(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM texts WHERE id = ?", [id]);
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
       (id, word, pinyin, definitions, source_text_id, source_text_title, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.word,
      entry.pinyin,
      entry.definitions,
      entry.source_text_id,
      entry.source_text_title,
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

function rowToText(row: any): SavedText {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    names: JSON.parse(row.names),
    createdAt: row.created_at,
  };
}
