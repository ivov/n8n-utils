import vscode from "vscode";
import { SyntaxKind } from "ts-morph";
import * as tsProject from "../../common/tsProject";

export function parseWorkflowRanges(doc: vscode.TextDocument) {
  tsProject.addSourceFile(doc.fileName);

  const options: vscode.DecorationOptions[] = [];

  for (const child of tsProject
    .getSourceFile(doc.fileName)
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)) {
    if (child.getText().startsWith('"type": "n8n-nodes-base.')) {
      const initializer = child.getInitializer();

      if (!initializer) continue;

      options.push({
        range: new vscode.Range(
          doc.positionAt(initializer.getStart()),
          doc.positionAt(initializer.getEnd())
        ),
      });
    }
  }

  return options;
}
