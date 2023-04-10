import vscode from "vscode";
import { WORKSPACE_STORAGE_KEYS } from "../../common/constants";
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
  const rootPath = context.workspaceState.get<string>(
    WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_PATH
  );

  if (!rootPath) throw new Error("No workspace root path found");

  const found = await vscode.workspace.findFiles(
    new vscode.RelativePattern(rootPath, "packages/cli/src/**/*.controller*.ts")
  );

  return found.map((file) => file.path);
}
