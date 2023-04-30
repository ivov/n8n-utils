import vscode from "vscode";
import {
  ArrayLiteralExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
  ts,
} from "ts-morph";
import { isArrayLiteralExpression } from "../../guards";
import * as tsProject from "../../common/tsProject";
import type { INodeProperties } from "../../types";
import { jsonParse } from "../../common/utils";

export function parseParams(): INodeProperties[] {
  const doc = vscode.window.activeTextEditor?.document;

  if (!doc) return [];

  if (isNodeParamsFile(doc)) {
    tsProject.addSourceFile(doc.fileName);
  }

  if (doc.fileName.endsWith(".node.ts")) {
    const properties = getNodeClassProperties(doc.fileName);

    if (!properties) return [];

    const marked = markParams(properties);

    const toEval = marked.getInitializer()?.getText() ?? "";

    return jsonParse(toEval);
  }

  if (doc.fileName.endsWith("Description.ts")) {
    const descriptions = getNodeResourceDescriptions(doc.fileName);

    if (!descriptions) return [];

    const marked = markDescriptions(descriptions);

    const toEval = marked
      .map((d) => d.getText())
      .join(" <> ")
      .replace("] <> [", " "); // hack: chain into single array

    return jsonParse(toEval);
  }

  return [];
}

const isNodeParamsFile = (doc?: vscode.TextDocument) =>
  [".node.ts", "Description.ts"].some((suffix) =>
    doc?.fileName.endsWith(suffix)
  );

function getNodeResourceDescriptions(filename: string) {
  const sourceFile = tsProject.getSourceFile(filename);

  const collected: ArrayLiteralExpression[] = [];

  for (const child of sourceFile.getDescendantsOfKind(
    SyntaxKind.VariableDeclaration
  )) {
    const found = child
      .getInitializer()
      ?.asKind(SyntaxKind.ArrayLiteralExpression);

    if (found) collected.push(found);
  }

  return collected;
}

/**
 * Get the AST node for `description.properties` in a node class.
 */
function getNodeClassProperties(filename: string) {
  const sourceFile = tsProject.getSourceFile(filename);

  removeSpreadElements(sourceFile);

  for (const child of sourceFile.getDescendantsOfKind(
    SyntaxKind.PropertyAssignment
  )) {
    if (
      child.getName() === "properties" &&
      isArrayLiteralExpression(child.compilerNode.initializer)
    ) {
      return child;
    }
  }

  return null;
}

/**
 * Append `#n` for line number to the AST nodes for the values of
 * `displayName` or (only when meant to be displayed) `name`
 * in node descriptions in `.node.ts` files.
 */
function markParams(node: PropertyAssignment) {
  node.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((child) => {
    if (["displayName", "name"].includes(child.getName())) {
      const paramName = child.getInitializer()?.getText();

      if (!paramName || !isForDisplay(paramName)) return;

      child.replaceWithText(
        [
          child.getText().slice(0, child.getText().length - 1),
          child.getStartLineNumber() + "'",
        ].join("#")
      );
    }
  });

  return node;
}

function markDescriptions(arrays: ArrayLiteralExpression[]) {
  for (const array of arrays) {
    array
      .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
      .forEach((child) => {
        if (["displayName", "name"].includes(child.getName())) {
          const paramName = child.getInitializer()?.getText();

          if (!paramName || !isForDisplay(paramName)) return;

          child.replaceWithText(
            [
              child.getText().slice(0, child.getText().length - 1),
              child.getStartLineNumber() + "'",
            ].join("#")
          );
        }
      });
  }

  return arrays;
}

const isForDisplay = (str: string) => /^'[A-Z]/.test(str);

// workaround for https://github.com/dsherret/ts-morph/issues/1389
function removeSpreadElements(sourceFile: SourceFile) {
  sourceFile.transform((traversal) => {
    const node = traversal.visitChildren();
    if (ts.isSpreadElement(node)) {
      return ts.factory.createJSDocComment();
    }

    return node;
  });
}
