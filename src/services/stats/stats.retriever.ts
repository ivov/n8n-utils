import { URL } from "node:url";
import vscode from "vscode";
import fetch from "node-fetch";
import { extensionContext } from "./stats.service";
import { WORKSPACE_STORAGE_KEYS } from "../../common/constants";
import { now } from "../../common/utils";
import type { NodeStats } from "../../types";

type Cache = NodeStats.ResponsesCache;
type CachedResult = Cache[string];
type FetchedResult = ReturnType<typeof fetchNodeStats>;

export async function retrieveNodeStats(
  nodeTypeName: string
): Promise<CachedResult | FetchedResult> {
  const cache = extensionContext?.workspaceState.get<Cache>(
    WORKSPACE_STORAGE_KEYS.NODE_STATS_RESPONSES
  );

  const cachedResult = cache?.[nodeTypeName];

  if (cachedResult && now() < cachedResult.expiresAt) return cachedResult;

  const fetchedResult = await fetchNodeStats(nodeTypeName);

  if (!fetchedResult) return null;

  await extensionContext?.workspaceState.update(
    WORKSPACE_STORAGE_KEYS.NODE_STATS_RESPONSES,
    {
      ...cache,
      [nodeTypeName]: {
        output: fetchedResult.output + "\n\n_Retrieved from 7-day cache_",
        expiresAt: now() + 60 * 60 * 24 * 7, // 7 days
      },
    }
  );

  return fetchedResult;
}

const nodeStatsToken = vscode.workspace
  .getConfiguration("n8n-utils")
  .get<string>("nodeStats.token") as string; // existence already checked at statsService.init()

async function fetchNodeStats(nodeTypeName: string) {
  const nodeStatsUrl = new URL(
    "https://internal.users.n8n.cloud/webhook/node-stats"
  );

  nodeStatsUrl.searchParams.set("node_id", `n8n-nodes-base.${nodeTypeName}`);

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: nodeStatsToken }),
  };

  const response = await fetch(nodeStatsUrl, options);

  if (response.status !== 200) {
    console.error("Failed to fetch node stats", response.statusText);
    return null;
  }

  return (await response.json()) as { output: string };
}
