import { db } from "./client.ts";
import { guilds, users, campaigns, campaignMembers } from "./schema.ts";

interface DiscordUser {
  id: string;
  username: string;
}

export interface CreateCampaignInput {
  guildId: string;
  guildName: string;
  name: string;
  dm: DiscordUser;
  players: DiscordUser[];
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    await tx
      .insert(guilds)
      .values({ id: input.guildId, name: input.guildName })
      .onConflictDoUpdate({
        target: guilds.id,
        set: { name: input.guildName, updatedAt: new Date() },
      });

    // Dedupe members; the DM takes precedence if also listed as a player.
    const members = new Map<string, { user: DiscordUser; role: "dm" | "player" }>();
    for (const player of input.players) {
      members.set(player.id, { user: player, role: "player" });
    }
    members.set(input.dm.id, { user: input.dm, role: "dm" });

    for (const { user } of members.values()) {
      await tx
        .insert(users)
        .values({ id: user.id, username: user.username })
        .onConflictDoUpdate({
          target: users.id,
          set: { username: user.username, updatedAt: new Date() },
        });
    }

    const [campaign] = await tx
      .insert(campaigns)
      .values({ guildId: input.guildId, name: input.name })
      .returning({ id: campaigns.id });

    await tx.insert(campaignMembers).values(
      [...members.values()].map(({ user, role }) => ({
        campaignId: campaign.id,
        userId: user.id,
        role,
      }))
    );

    return campaign;
  });
}
