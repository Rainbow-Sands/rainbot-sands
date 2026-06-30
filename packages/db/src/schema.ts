import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
  id: varchar("id", { length: 20 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id", { length: 20 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  guildId: varchar("guild_id", { length: 20 })
    .references(() => guilds.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// role: 'dm' | 'player'
export const campaignMembers = pgTable(
  "campaign_members",
  {
    campaignId: uuid("campaign_id")
      .references(() => campaigns.id)
      .notNull(),
    userId: varchar("user_id", { length: 20 })
      .references(() => users.id)
      .notNull(),
    role: varchar("role", { length: 10 }).notNull().default("player"),
  },
  (t) => [primaryKey({ columns: [t.campaignId, t.userId] })]
);

// status: 'recording' | 'transcribing' | 'summarizing' | 'done' | 'failed'
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 30 }).primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  title: text("title"),
  channelId: varchar("channel_id", { length: 20 }).notNull(),
  sessionDir: text("session_dir").notNull(),
  workflowId: text("workflow_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("recording"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const sessionTranscripts = pgTable("session_transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 30 })
    .references(() => sessions.id)
    .notNull()
    .unique(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionRecaps = pgTable("session_recaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 30 })
    .references(() => sessions.id)
    .notNull()
    .unique(),
  summary: text("summary").notNull(),
  recap: text("recap").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
