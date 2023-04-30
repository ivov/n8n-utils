import path from "node:path";
import vscode from "vscode";
import { parseNodeClass } from "./definer.parser";
import { WORKSPACE_STORAGE_KEYS } from "../../common/constants";
import type { NodeClassLocations } from "../../types";
import { isCommunityNodeRepo } from "../../common/utils";

export class NodeTypeDefinitionProvider implements vscode.DefinitionProvider {
  constructor(public context: vscode.ExtensionContext) {}

  async provideDefinition(
    workflowDoc: vscode.TextDocument,
    workflowPos: vscode.Position
  ) {
    const lineText = workflowDoc.lineAt(workflowPos.line).text.trim();

    if (!lineText.startsWith('"type": "n8n-nodes-base.')) return;

    const wordRange = workflowDoc.getWordRangeAtPosition(workflowPos);
    const word = workflowDoc.getText(wordRange);

    if (word === "type") return;

    const nodeType = extractNodeType(lineText);

    const classLocations = this.context.workspaceState.get<NodeClassLocations>(
      WORKSPACE_STORAGE_KEYS.NODE_CLASS_LOCATIONS
    );

    if (!classLocations) throw new Error("No node class locations found");

    const location = classLocations[nodeType].sourcePath
      .replace("dist", path.join("packages", "nodes-base"))
      .replace(/\.js$/, ".ts");

    if (!location.endsWith(".node.ts")) return;

    const rootPath = this.context.workspaceState.get<string>(
      WORKSPACE_STORAGE_KEYS.WORKSPACE_ROOT_PATH
    );

    if (!rootPath) throw new Error("No workspace root path found");

    if (isCommunityNodeRepo(rootPath)) return;

    const nodeTypeUri = vscode.Uri.parse(
      "file://" + path.join(rootPath, location),
      true
    );

    const nodeTypeDoc = await vscode.workspace.openTextDocument(nodeTypeUri);

    const lineNumber = parseNodeClass(nodeTypeDoc);

    if (lineNumber === -1) return;

    const range = workflowDoc.lineAt(lineNumber).range;

    return new vscode.Location(nodeTypeUri, range);
  }
}

const extractNodeType = (line: string) =>
  line.substring(line.lastIndexOf(".") + 1, line.lastIndexOf('"'));
