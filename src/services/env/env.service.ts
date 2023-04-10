import vscode from "vscode";
import { getConfigSchema, reloadConfigSchema } from "./env.parser";
import { isConfigSchemaFile } from "./env.utils";
import * as tsProject from "../../common/tsProject";
import { ConfigSchema } from "../../types";
import {
  getConfigGetEnvDecorationOptions,
  getProcessEnvDecorationOptions,
} from "./env.parser";

export async function init() {
  const schema = await getConfigSchema();

  if (!schema) return;

  setTooltips(schema);

  vscode.window.onDidChangeActiveTextEditor(() => setTooltips(schema));

  vscode.workspace.onDidCloseTextDocument(async (doc) => {
    if (isConfigSchemaFile(doc)) {
      const newSchema = await reloadConfigSchema();
      if (newSchema) setTooltips(newSchema);
    }
  });
}

const decoType = vscode.window.createTextEditorDecorationType({});

export function setTooltips(schema: ConfigSchema) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) return;

  const doc = editor.document;

  if (!doc.fileName.endsWith(".ts")) return;

  tsProject.addSourceFile(doc.fileName);

  const options = getProcessEnvDecorationOptions(doc);

  if (isInCliPackage(doc)) {
    options.push(...getConfigGetEnvDecorationOptions(doc, schema));
  }

  editor.setDecorations(decoType, options);
}

const isInCliPackage = (doc?: vscode.TextDocument) =>
  doc?.fileName.includes("packages/cli");
