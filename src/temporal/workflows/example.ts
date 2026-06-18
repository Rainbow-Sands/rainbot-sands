import { proxyActivities } from "@temporalio/workflow";

const { greet } = proxyActivities({
  startToCloseTimeout: "1 minute",
});

/** A workflow that simply calls an activity */
export async function example(name: string) {
  return await greet(name);
}
