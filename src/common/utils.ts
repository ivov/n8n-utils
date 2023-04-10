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
  const WORKSPACE_ROOT_FILE_MARKER = "pnpm-workspace.yaml";

  const workspaces = await vscode.workspace.findFiles(
    WORKSPACE_ROOT_FILE_MARKER
  );

  if (!workspaces || !workspaces.length) throw new Error(ERRORS.NO_WORKSPACE);

  if (workspaces.length > 1) throw new Error(ERRORS.MULTIPLE_WORKSPACES);

  return workspaces[0].fsPath.replace(WORKSPACE_ROOT_FILE_MARKER, "");
}

export function readJsonAt(path: string) {
  try {
    return require(path);
  } catch (error) {
    console.error(error);
    return null;
  }
}
