import JSON5 from "json5";
import path from "node:path";
import vscode from "vscode";
import { ERRORS } from "./constants";
import type { RootLocation } from "../types";

export function intersect<T>(a: T[], b: T[]): T[] {
  const map = new Map<T, boolean>();
  const result: T[] = [];

  for (const item of a) {
    map.set(item, true);
  }

  for (const item of b) {
    if (map.get(item)) {
      result.push(item);
      map.delete(item);
    }
  }

  return result;
}

export const now = () => Math.floor(Date.now() / 1000); // unix timestamp

// ----------------------------------
//              json
// ----------------------------------

export const jsonParse = (jsonString: string) => {
  try {
    return JSON5.parse(jsonString);
  } catch (error) {
    vscode.window.showErrorMessage(ERRORS.UNPARSEABLE_JSON);
    return [];
  }
};

export function readJsonAt(path: string) {
  try {
    return require(path);
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ----------------------------------
//          root location
// ----------------------------------

export const REPO_MARKERS: Record<string, string> = {
  "pnpm-workspace.yaml": "main-repo",
  "LOCAL-SETUP.md": "n8n-hosted-backend",
  ".eslintrc.prepublish.js": "community-node",
};

export async function getWorkspaceRootLocation(): Promise<RootLocation> {
  for (const marker of Object.keys(REPO_MARKERS)) {
    const uris = await vscode.workspace.findFiles(marker);

    if (!uris?.length || uris.length > 1) continue;

    const { fsPath } = uris[0];

    return {
      path: path.dirname(fsPath),
      type: REPO_MARKERS[path.basename(fsPath)],
    };
  }

  throw new Error("Failed to find a workspace root path");
}

export const isMainRepo = (rootPath: RootLocation) =>
  rootPath.type === "main-repo";

export const isCommunityNodeRepo = (rootPath: RootLocation) =>
  rootPath.type === "community-node";

export const isHostedBackendRepo = (rootPath: RootLocation) =>
  rootPath.type === "n8n-hosted-backend";
