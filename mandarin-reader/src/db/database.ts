import * as SQLite from "expo-sqlite";

export type NameTag = { name: string; color: { bg: string; fg: string } };

export type SavedText = {
  id: string;
  title: string;
  content: string; // always simplified — conversion happens on save
  names: NameTag[];
  createdAt: string;
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
  `);

  const existing = await getNoPinyinChars();
  if (existing.length === 0) {
    await setNoPinyinChars(["的", "了", "是", "我"]);
  }
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

function rowToText(row: any): SavedText {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    names: JSON.parse(row.names),
    createdAt: row.created_at,
  };
}
