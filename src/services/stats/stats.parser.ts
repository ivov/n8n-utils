import { SyntaxKind, ts } from "ts-morph";
import vscode from "vscode";
import * as tsProject from "../../common/tsProject";
import { retrieveNodeStats } from "./stats.retriever";

export async function parseNodeClassName(doc: vscode.TextDocument) {
  tsProject.addSourceFile(doc.fileName);

  const classDeclarations = tsProject
    .getSourceFile(doc.fileName)
    ?.getDescendantsOfKind(SyntaxKind.ClassDeclaration);

  if (classDeclarations?.length !== 1) return null;

  const [classDeclaration] = classDeclarations;

  const heritageClauses = tsProject
    .getSourceFile(doc.fileName)
    ?.getDescendantsOfKind(SyntaxKind.HeritageClause);

  if (classDeclarations?.length !== 1) return null;

  const [heritageClause] = heritageClauses;

  const implementee = heritageClause.compilerNode.getChildAt(1).getText();

  if (implementee !== "INodeType") return null;

  const nameNode = classDeclaration.compilerNode.getChildAt(2);

  const result = await retrieveNodeStats(toNodeTypeName(nameNode));

  if (!result) return null;

  return [
    {
      range: new vscode.Range(
        doc.positionAt(nameNode.getStart()),
        doc.positionAt(nameNode.getEnd())
      ),
      hoverMessage: result.output,
    },
  ];
}

function toNodeTypeName(nameNode: ts.Node) {
  const nameNodeText = nameNode.getText();

  return nameNodeText[0].toLowerCase() + nameNodeText.slice(1);
}
