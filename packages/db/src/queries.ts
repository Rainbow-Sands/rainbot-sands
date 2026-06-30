import { and, desc, eq } from "drizzle-orm";
import { db } from "./client.ts";
import {
  campaigns,
  campaignMembers,
  sessions,
  users,
} from "./schema.ts";

export async function getCampaignsForGuild(guildId: string) {
  return db
    .select({ id: campaigns.id, name: campaigns.name })
    .from(campaigns)
    .where(eq(campaigns.guildId, guildId))
    .orderBy(campaigns.name);
}

export async function getCampaignsForUser(userId: string) {
  return db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      role: campaignMembers.role,
    })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaignMembers.campaignId, campaigns.id))
    .where(eq(campaignMembers.userId, userId))
    .orderBy(campaigns.name);
}

export async function isCampaignMember(
  campaignId: string,
  userId: string
): Promise<boolean> {
  const rows = await db
    .select({ userId: campaignMembers.userId })
    .from(campaignMembers)
    .where(
      and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, userId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export interface CampaignMember {
  id: string;
  username: string;
  role: string;
}

export interface CampaignSessionSummary {
  id: string;
  title: string | null;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
}

export interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  members: CampaignMember[];
  sessions: CampaignSessionSummary[];
}

export async function getCampaignDetail(
  campaignId: string
): Promise<CampaignDetail | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  if (!campaign) return null;

  const members = await db
    .select({
      id: users.id,
      username: users.username,
      role: campaignMembers.role,
    })
    .from(campaignMembers)
    .innerJoin(users, eq(campaignMembers.userId, users.id))
    .where(eq(campaignMembers.campaignId, campaignId));

  const sessionRows = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      status: sessions.status,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
    })
    .from(sessions)
    .where(eq(sessions.campaignId, campaignId))
    .orderBy(desc(sessions.startedAt));

  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    members,
    sessions: sessionRows,
  };
}

export interface SessionDetail {
  id: string;
  campaignId: string;
  title: string | null;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  transcript: string | null;
  summary: string | null;
  recap: string | null;
}

export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetail | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session) return null;

  return {
    id: session.id,
    campaignId: session.campaignId,
    title: session.title,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    transcript: session.transcript,
    summary: session.summary,
    recap: session.recap,
  };
}
