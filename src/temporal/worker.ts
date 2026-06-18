import { Worker } from "@temporalio/worker";
import { fileURLToPath, URL } from "url";
import { greet } from "./activities/greet.ts";

async function run() {
  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const workflowsPathUrl = new URL("./workflows/example.ts", import.meta.url);
  const worker = await Worker.create({
    workflowsPath: fileURLToPath(workflowsPathUrl),
    activities: {
      greet,
    },
    taskQueue: "hello-javascript",
  });
  // Worker connects to localhost by default and uses console.error for logging.
  // Customize the Worker by passing more options to create():
  // https://typescript.temporal.io/api/classes/worker.Worker
  // If you need to configure server connection parameters, see docs:
  // https://docs.temporal.io/typescript/security#encryption-in-transit-with-mtls

  // Step 2: Start accepting tasks on the `hello-javascript` queue
  await worker.run();

  // You may create multiple Workers in a single process in order to poll on multiple task queues.
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
