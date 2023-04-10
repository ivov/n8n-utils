import path from "node:path";
import vscode from "vscode";
import {
  NODE_CLASS_LOCATIONS_PATH,
  WORKSPACE_STORAGE_KEYS,
} from "../../common/constants";
import { NodeTypeDefinitionProvider } from "./definer.provider";
import * as utils from "../../common/utils";

export async function init(context: vscode.ExtensionContext) {
  await cacheNodeClassLocations(context);

  const provider = new NodeTypeDefinitionProvider(context);

  const disposable = vscode.languages.registerDefinitionProvider(
    { scheme: "file", language: "json" },
    provider
  );

  context.subscriptions.push(disposable);
}

async function cacheNodeClassLocations(context: vscode.ExtensionContext) {
  const rootPath = context.workspaceState.get<string>(
    WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_PATH
  );

  if (!rootPath) throw new Error("No workspace root path found");

  const locationsUri = vscode.Uri.parse(
    "file://" + path.join(rootPath, NODE_CLASS_LOCATIONS_PATH),
    true
  );

  const classLocations = utils.readJsonAt(locationsUri.fsPath);

  if (!classLocations) throw new Error("No node class locations found");

  context.workspaceState.update(
    WORKSPACE_STORAGE_KEYS.NODE_CLASS_LOCATIONS,
    classLocations
  );
}
