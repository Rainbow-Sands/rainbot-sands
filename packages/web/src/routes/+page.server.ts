import { getCampaignsForUser } from "@rainbot/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return { campaigns: [] };
  const campaigns = await getCampaignsForUser(locals.user.id);
  return { campaigns };
};
