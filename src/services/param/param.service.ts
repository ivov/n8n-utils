import vscode from "vscode";
import { ParamsTreeProvider, ParamNavItem } from "./param.provider";

export function init(context: vscode.ExtensionContext) {
  const provider = new ParamsTreeProvider();

  vscode.window.registerTreeDataProvider("node-params-view", provider);

  vscode.window.onDidChangeActiveTextEditor(() => {
    provider.reparse();
  });

  const refreshParamsDisposable = vscode.commands.registerCommand(
    "n8n-utils.refreshParams",
    () => {
      vscode.window.showInformationMessage("Refreshing params...");
      provider.refresh();
    }
  );

  context.subscriptions.push(refreshParamsDisposable);

  const navigateToParamDisposable = vscode.commands.registerCommand(
    "n8n-utils.navigateToParam",
    async () => {
      await vscode.commands.executeCommand("node-params-view.focus");

      const quickPick = vscode.window.createQuickPick<ParamNavItem>();

      quickPick.placeholder = "Enter a node parameter...";

      const items = provider.getFlattenedItems();

      if (!items.length) {
        vscode.window.showInformationMessage(
          'No node parameters found on this file. To use the "Navigate to node parameter" command, open a "*.node.ts" or "*Description.ts" file in the active editor.'
        );
        return;
      }

      quickPick.items = items.map((item) => new ParamNavItem(item));

      quickPick.onDidChangeActive((actives) => {
        const item = actives[0];

        if (!item) return;

        vscode.commands.executeCommand("n8n-utils.navigate", item.lineNumber);
      });

      quickPick.onDidAccept(() => {
        const doc = vscode.window.activeTextEditor?.document;
        if (doc) vscode.window.showTextDocument(doc);

        quickPick.hide();
      });

      quickPick.show();
    }
  );

  context.subscriptions.push(navigateToParamDisposable);
}
