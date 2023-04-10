import vscode from "vscode";
import * as utils from "./common/utils";
import { WORKSPACE_STORAGE_KEYS } from "./common/constants";
import { navigate } from "./common/navigate";

import * as launcherService from "./services/launcher/launcher.service";
import * as paramService from "./services/param/param.service";
import * as workflowService from "./services/workflow/workflow.service";
import * as controllerService from "./services/controller/controller.service";
import * as envService from "./services/env/env.service";
import * as definerService from "./services/definer/definer.service";
import * as statsService from "./services/stats/stats.service";

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(navigate);

  try {
    await context.workspaceState.update(
      WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_PATH,
      await utils.getWorkspaceRootPath()
    );
  } catch (error) {
    console.error(error);
    return;
  }

  workflowService.init(context);
  paramService.init(context);
  controllerService.init(context);
  launcherService.init(context);
  envService.init();
  definerService.init(context);
  statsService.init();
}

export function deactivate() {
  // ...
}

// vscode.commands.executeCommand(
//   "setContext",
//   "n8n-utils:isNodeParamsFile",
//   api.isNodeParamsFile(editor?.document)
// );
