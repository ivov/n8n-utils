import vscode from "vscode";

import * as launcherService from "./services/launcher/launcher.service";
import * as paramService from "./services/param/param.service";
import * as workflowService from "./services/workflow/workflow.service";
import * as controllerService from "./services/controller/controller.service";
import * as envService from "./services/env/env.service";
import * as definerService from "./services/definer/definer.service";
import * as statsService from "./services/stats/stats.service";

import { WORKSPACE_STORAGE_KEYS } from "./common/constants";
import { navigate } from "./common/navigate";
import {
  getWorkspaceRootLocation,
  isMainRepo,
  isCommunityNodeRepo,
  isHostedBackendRepo,
} from "./common/utils";

import type { RootLocation } from "./types";

export async function activate(context: vscode.ExtensionContext) {
  try {
    await context.workspaceState.update(
      WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_LOCATION,
      await getWorkspaceRootLocation()
    );
  } catch (error) {
    console.error(error);
    return;
  }

  context.subscriptions.push(navigate);

  const rootLoc = context.workspaceState.get<RootLocation>(
    WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_LOCATION
  );

  if (!rootLoc) return;

  const isMain = isMainRepo(rootLoc);

  vscode.commands.executeCommand("setContext", "n8n-utils:isMainRepo", isMain);

  const isCommunity = isCommunityNodeRepo(rootLoc);
  const isHostedBackend = isHostedBackendRepo(rootLoc);

  if (isMain || isCommunity) paramService.init(context);

  if (isMain || isHostedBackend) controllerService.init(context);

  if (isMain) {
    workflowService.init(context);
    launcherService.init(context);
    envService.init();
    definerService.init(context);
    statsService.init(context);
  }
}

export function deactivate() {
  // ...
}

// vscode.commands.executeCommand(
//   "setContext",
//   "n8n-utils:isNodeParamsFile",
//   api.isNodeParamsFile(editor?.document)
// );
