import { Database } from "bun:sqlite";

export type Recapper = {
  id: string;
  position: number;
};

export const db = new Database(Bun.env.DATABASE_URL);

db.exec(`
    CREATE TABLE IF NOT EXISTS recappers (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL UNIQUE
    );
  `);

export const addRecapper = (id: string) => {
  const maxPosition =
    db
      .prepare<
        { max: number },
        []
      >("SELECT MAX(position) as max FROM recappers")
      .get()?.max ?? 0;
  db.run("INSERT INTO recappers (user_id, position) VALUES (?1, ?2)", [
    id,
    maxPosition + 1,
  ]);
};

export const getRecapper = () =>
  db
    .prepare<
      Recapper,
      []
    >("SELECT * FROM recappers ORDER BY position ASC LIMIT 1")
    .get();

export const cycleRecapper = (): void => {
  db.prepare(
    "UPDATE recappers SET position = (SELECT MAX(position) + 1 FROM recappers) WHERE position = (SELECT MIN(position) FROM recappers)"
  ).run();
};
