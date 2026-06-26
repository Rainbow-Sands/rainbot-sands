import { Connection, Client } from "@temporalio/client";
import { TEMPORAL_URL } from "./env.ts";

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connection = await Connection.connect({
      address: TEMPORAL_URL,
    });
    client = new Client({ connection, namespace: "rainbot" });
  }
  return client;
}
