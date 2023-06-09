import path from "path";
import vscode from "vscode";
import * as utils from "../../common/utils";
import { SCHEMA_RELATIVE_PATH } from "../../common/constants";
import { RootLocation } from "../../types";

export async function getSchemaPath() {
  let rootPath: RootLocation;

  try {
    rootPath = await utils.getWorkspaceRootLocation();
  } catch (error) {
    error instanceof Error && vscode.window.showErrorMessage(error.message);
    return null;
  }

  return path.join(rootPath.path, SCHEMA_RELATIVE_PATH);
}

export function toParseable(schema: string) {
  return (
    schema
      .replace(/as const/g, "")
      .replace(/format: (String|Boolean|Number),/g, "format: '$1',")
      .replace(/default: undefined,/g, "default: 'undefined',") // no undefined in JSON
      .replace(/IS_V1_RELEASE \? '\w+' :/g, "") // remove v1 options, @TODO update after v1 release
      .replace(
        /default: 60 \* 60 \* 72, \/\/ 72 hours/g,
        `default: ${60 * 60 * 72},`
      )
      .replace(/default: path\.(.*),/g, 'default: "path.$1",') ?? ""
  );
}

export function toDisplayable(value: unknown) {
  if (typeof value === "boolean") {
    value = value.toString();
  }

  if (value === "") {
    value = "<empty string>";
  }

  return `\`${value}\``;
}

export const isConfigSchemaFile = (doc?: vscode.TextDocument) =>
  doc?.fileName.endsWith("schema.ts");
