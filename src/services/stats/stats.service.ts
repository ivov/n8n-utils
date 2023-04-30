import path from "node:path";
import vscode from "vscode";
import { parseNodeClassName } from "./stats.parser";

const nodeStatsToken = vscode.workspace
  .getConfiguration("n8n-utils")
  .get<string>("nodeStats.token");

export let extensionContext: vscode.ExtensionContext | undefined;

export async function init(context: vscode.ExtensionContext) {
  if (!nodeStatsToken) return;

  const doc = vscode.window.activeTextEditor?.document;

  if (!doc) return;

  extensionContext = context;

  await setNodeTypeNameDecoration(doc);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    const doc = editor?.document;

    if (!doc) return;

    setNodeTypeNameDecoration(doc);
  });
}

async function setNodeTypeNameDecoration(doc: vscode.TextDocument) {
  if (!doc.fileName.endsWith(".node.ts")) return;

  const options = await parseNodeClassName(doc);

  if (!options) return;

  const iconPath = path.join(__dirname, "..", "media", "comment.svg");

  const decoType = vscode.window.createTextEditorDecorationType({
    after: {
      contentIconPath: vscode.Uri.parse(`file://${iconPath}`),
    },
  });

  vscode.window.activeTextEditor?.setDecorations(decoType, options);
}
