import { Connection, Client } from "@temporalio/client";

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_URL,
    });
    client = new Client({ connection, namespace: "rainbot" });
  }
  return client;
}
