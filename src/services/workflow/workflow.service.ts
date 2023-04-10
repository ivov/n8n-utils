import fs from "fs";
import path from "path";
import vscode from "vscode";
import { TextEncoder } from "node:util";
import {
  CLI_COMMANDS,
  EXPORT_FILENAME,
  TERMINAL_NAMES,
  WORKSPACE_STORAGE_KEYS,
} from "../../common/constants";
import { WorkflowsTreeProvider } from "./workflow.provider";
import { parseWorkflowRanges } from "./workflow.parser";
import type { Workflow } from "../../types";

let extensionContext: vscode.ExtensionContext | undefined;

export async function init(context: vscode.ExtensionContext) {
  const workflows = await getWorkflows(context);

  context.workspaceState.update("stored-workflows", workflows);

  extensionContext = context;

  const provider = new WorkflowsTreeProvider(workflows);

  vscode.window.registerTreeDataProvider("stored-workflows-view", provider);

  const disposable = vscode.commands.registerCommand(
    "n8n-utils.open-workflow",
    openWorkflowCallback
  );

  context.subscriptions.push(disposable);

  const editor = vscode.window.activeTextEditor;

  if (editor) setWorkflowDecorations(editor.document);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    const doc = editor?.document;

    if (!doc) return;

    setWorkflowDecorations(doc);
  });
}

async function getWorkflows(
  context: vscode.ExtensionContext
): Promise<Workflow[]> {
  const exporter = vscode.window.createTerminal({
    name: TERMINAL_NAMES.EXPORTER,
    isTransient: true,
    hideFromUser: true,
  });

  exporter.sendText(CLI_COMMANDS.EXPORT);

  const rootPath = context.workspaceState.get<string>(
    WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_PATH
  );

  if (!rootPath) throw new Error("No workspace root path found");

  const exportPath = path.join(rootPath, EXPORT_FILENAME);

  const exists = await pollExists(exportPath);

  if (!exists) return []; // no workflows were exported

  let workflows;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    workflows = require(exportPath);
  } catch (error) {
    console.error(error);
  }

  fs.promises.unlink(exportPath);

  return workflows;
}

async function pollExists(
  filepath: string,
  intervalMs = 1000,
  maxAttempts = 15
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      await fs.promises.access(filepath, fs.constants.F_OK);
      return true;
    } catch (error) {
      await sleep(intervalMs);
      attempts++;
    }
  }

  return false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const openWorkflowCallback = async (workflowId: string) => {
  const workflows =
    extensionContext?.workspaceState.get<Workflow[]>("stored-workflows");

  const workflow = workflows?.find((workflow) => workflow.id === workflowId);

  if (!workflow) return;

  const rootPath = extensionContext?.workspaceState.get<string>(
    WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_PATH
  );

  if (!rootPath) return;

  const uri = vscode.Uri.parse(
    path.join(rootPath, ".vscode", workflow.id + ".workflow.json")
  );

  await vscode.workspace.fs.writeFile(
    uri,
    new TextEncoder().encode(JSON.stringify(workflow, null, 2))
  );

  const doc = await vscode.workspace.openTextDocument(uri);

  setWorkflowDecorations(doc);

  vscode.window.showTextDocument(uri);
};

function setWorkflowDecorations(doc: vscode.TextDocument) {
  if (!doc.fileName.endsWith(".json")) return;

  const decoType = vscode.window.createTextEditorDecorationType({
    color: "#fc5a8d",
    fontWeight: "bold",
  });

  vscode.window.activeTextEditor?.setDecorations(
    decoType,
    parseWorkflowRanges(doc)
  );
}
