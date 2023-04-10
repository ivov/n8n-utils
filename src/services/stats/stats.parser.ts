import { SyntaxKind } from "ts-morph";
import vscode from "vscode";
import fetch from "node-fetch";
import * as tsProject from "../../common/tsProject";

export async function parseNodeClassName(doc: vscode.TextDocument) {
  const options: vscode.DecorationOptions[] = [];

  tsProject.addSourceFile(doc.fileName);

  const found = tsProject
    .getSourceFile(doc.fileName)
    ?.getDescendantsOfKind(SyntaxKind.ClassDeclaration);

  if (!found || found.length !== 1) return null;

  const [classNode] = found;

  const nameNode = classNode.compilerNode.getChildAt(2);

  const nameNodeText = nameNode.getText();

  const nodeTypeName = nameNodeText[0].toLowerCase() + nameNodeText.slice(1);

  const json = await fetchNodeStats(nodeTypeName);

  options.push({
    range: new vscode.Range(
      doc.positionAt(nameNode.getStart()),
      doc.positionAt(nameNode.getEnd())
    ),

    hoverMessage: json.output,
  });

  return options;
}

const nodeStatsToken = vscode.workspace
  .getConfiguration("n8n-utils")
  .get<number>("nodeStats.token");

async function fetchNodeStats(nodeTypeName: string) {
  const res = await fetch(
    `https://internal.users.n8n.cloud/webhook/node-stats?node_id=n8n-nodes-base.${nodeTypeName}`,
    {
      method: "POST",
      body: JSON.stringify({ token: nodeStatsToken }),
      headers: { "Content-Type": "application/json" },
    }
  );

  return (await res.json()) as { output: string };
}
