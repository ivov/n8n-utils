import { SyntaxKind } from "ts-morph";
import vscode from "vscode";
import * as tsProject from "../../common/tsProject";

export function parseNodeClass(doc: vscode.TextDocument) {
  tsProject.addSourceFile(doc.fileName);

  for (const child of tsProject
    .getSourceFile(doc.fileName)
    ?.getDescendantsOfKind(SyntaxKind.ClassDeclaration)) {
    const heritageClause = child.getHeritageClauseByKind(
      SyntaxKind.ImplementsKeyword
    );

    const heritageTypes = heritageClause?.getTypeNodes();

    if (
      heritageTypes?.length === 1 &&
      heritageTypes[0].getText() === "INodeType"
    ) {
      return heritageTypes[0].getStartLineNumber() - 1; // offset
    }
  }

  return -1;
}
