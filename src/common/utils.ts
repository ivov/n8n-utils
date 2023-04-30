import JSON5 from "json5";
import vscode from "vscode";
import { ERRORS } from "./constants";

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

export async function getWorkspaceRootPath() {
  const MAIN_REPO_MARKER = "pnpm-workspace.yaml";
  const COMMUNITY_NODE_REPO_MARKER = ".eslintrc.prepublish.js";

  const rootFileGlob = `{${MAIN_REPO_MARKER},${COMMUNITY_NODE_REPO_MARKER}}`;

  const workspaces = await vscode.workspace.findFiles(rootFileGlob);

  if (!workspaces?.length) throw new Error(ERRORS.NO_WORKSPACE);

  if (workspaces.length > 1) throw new Error(ERRORS.MULTIPLE_WORKSPACES);

  return workspaces[0].fsPath.replace(MAIN_REPO_MARKER, "");
}

export const isCommunityNodeRepo = (rootPath: string) =>
  rootPath.endsWith(".eslintrc.prepublish.js");

export function readJsonAt(path: string) {
  try {
    return require(path);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const now = () => Math.floor(Date.now() / 1000); // unix timestamp

export const jsonParse = (jsonString: string) => {
  try {
    return JSON5.parse(jsonString);
  } catch (error) {
    vscode.window.showErrorMessage(ERRORS.UNPARSEABLE_JSON);
    return [];
  }
};
