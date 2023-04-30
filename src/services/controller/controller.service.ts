import vscode from "vscode";
import { WORKSPACE_STORAGE_KEYS } from "../../common/constants";
import { isHostedBackendRepo } from "../../common/utils";
import { RootLocation } from "../../types";
import {
  ControllersTreeProvider,
  EndpointNavItem,
} from "./controller.provider";

export async function init(context: vscode.ExtensionContext) {
  const filepaths = await getControllerFilepaths(context);

  const provider = new ControllersTreeProvider(filepaths);

  vscode.window.registerTreeDataProvider("n8n-endpoints-view", provider);

  const refreshDisposble = vscode.commands.registerCommand(
    "n8n-utils.refreshControllers",
    async () => {
      vscode.window.showInformationMessage("Refreshing controllers...");

      const paths = await getControllerFilepaths(context);

      provider.refresh(paths);
    }
  );

  context.subscriptions.push(refreshDisposble);

  const navigateToEndpointDisposable = vscode.commands.registerCommand(
    "n8n-utils.navigateToEndpoint",
    async () => {
      await vscode.commands.executeCommand("n8n-endpoints-view.focus");

      const quickPick = vscode.window.createQuickPick<EndpointNavItem>();

      quickPick.placeholder = "Enter an endpoint...";

      quickPick.items = provider
        .getEndpointLocations()
        .map((el) => new EndpointNavItem(el));

      quickPick.onDidAccept(() => {
        const item = quickPick.activeItems[0];

        if (!item) return;

        vscode.commands.executeCommand(
          "n8n-utils.navigate",
          item.lineNumber,
          item.filePath
        );
      });

      quickPick.show();
    }
  );

  context.subscriptions.push(navigateToEndpointDisposable);
}

export async function getControllerFilepaths(context: vscode.ExtensionContext) {
  const rootLoc = context.workspaceState.get<RootLocation>(
    WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_LOCATION
  );

  if (!rootLoc) throw new Error("No workspace root path found");

  const glob = isHostedBackendRepo(rootLoc)
    ? "packages/dashboard-backend/src/**/*.controller*.ts"
    : "packages/cli/src/**/*.controller*.ts";

  const found = await vscode.workspace.findFiles(
    new vscode.RelativePattern(rootLoc.path, glob)
  );

  const filtered = found.filter((file) => !file.path.includes(".spec.ts")); // glob negation not working

  return filtered.map((file) => file.path);
}
