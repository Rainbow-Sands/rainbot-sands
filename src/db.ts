import { Database } from "bun:sqlite";

export type Recapper = {
  id: string;
  position: number;
};

export type Quest = {
  id: string;
  name: string;
  description: string;
  position: number;
};

export const db = new Database(Bun.env.DATABASE_URL);

db.exec(`
    CREATE TABLE IF NOT EXISTS recappers (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL UNIQUE
    );
  `);

db.exec(`
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      position INTEGER NOT NULL UNIQUE
    );
  `)

export const replaceRecappers = (recappers: string[]): void => {
  db.transaction(() => {
    db.prepare("DELETE FROM recappers").run();
    const stmt = db.prepare(
      "INSERT INTO recappers (id, position) VALUES (?, ?)"
    );
    recappers.forEach((id, i) => stmt.run(id, i));
  })();
};

export const replaceQuests = (quests: Quest[]): void => {
  db.transaction(() => {
    db.prepare("DELETE FROM quests").run();
    const stmt = db.prepare(
      "INSERT INTO quests (id, name, description, position) VALUES (?, ?, ?, ?)"
    );
    quests.forEach((quest, index) => stmt.run(quest.id, quest.name, quest.description, index));
  })();
};

export const getRecapper = () =>
  db
    .prepare<
      Recapper,
      []
    >("SELECT * FROM recappers ORDER BY position ASC LIMIT 1")
    .get();

export const getQuests = () =>
  db
    .prepare<
      Quest,
      []
    >("SELECT * FROM quests ORDER BY position ASC LIMIT 10")
    .all();

export const cycleRecapper = (): void => {
  db.prepare(
    "UPDATE recappers SET position = (SELECT MAX(position) + 1 FROM recappers) WHERE position = (SELECT MIN(position) FROM recappers)"
  ).run();
};
