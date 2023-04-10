import vscode from "vscode";
import JSON5 from "json5";
import { SyntaxKind } from "ts-morph";

import { toParseable, toDisplayable, getSchemaPath } from "./env.utils";
import { isConfigSchemaNode } from "../../guards";
import { ConfigSchema, ConfigSchemaNode, EnvVars } from "../../types";
import { ERRORS } from "../../common/constants";
import * as tsProject from "../../common/tsProject";
import { intersect } from "../../common/utils";

let configSchema: ConfigSchema | undefined;
let envVars: EnvVars | undefined; // uppercase names to default values

// ----------------------------------
//        parse config schema
// ----------------------------------

async function parseSchema() {
  const schemaPath = await getSchemaPath();

  if (!schemaPath) throw new Error(ERRORS.NO_SCHEMA_PATH);

  tsProject.addSourceFile(schemaPath);

  for (const child of tsProject
    .getSourceFile(schemaPath)
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    if (child.getName() === "schema") {
      const schemaText = child.getInitializer()?.getText();

      if (!schemaText) return;

      try {
        const parsed = JSON5.parse(toParseable(schemaText)) as ConfigSchema;
        configSchema = parsed;
        envVars = getSchemaEnvVars(parsed);
        return parsed;
      } catch {
        vscode.window.showErrorMessage(ERRORS.UNPARSEABLE_SCHEMA);
      }
    }
  }
}

function getSchemaEnvVars(
  obj: ConfigSchema | ConfigSchemaNode,
  envVars: EnvVars = {}
) {
  for (const key in obj) {
    if (isConfigSchemaNode(obj)) {
      envVars[obj.env] = obj.default;
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      getSchemaEnvVars(obj[key], envVars);
    }
  }

  return envVars;
}

export async function reloadConfigSchema() {
  const schemaPath = await getSchemaPath();

  if (!schemaPath) throw new Error(ERRORS.NO_SCHEMA_PATH);

  tsProject.removeSourceFile(schemaPath);

  configSchema = await parseSchema();

  return configSchema;
}

export async function getConfigSchema() {
  if (!configSchema) {
    configSchema = await parseSchema();
  }

  return configSchema;
}

/**
 * Whether a default config env var has been overridden in
 * the user's `process.env` in their VSCode context.
 */
function isOverridden(envVarName: string) {
  if (!envVars) return [];

  const envVarNames = Object.keys(envVars);

  return intersect(Object.keys(process.env), envVarNames).includes(envVarName);
}

/**
 * Whether an env var name is declared in `schema.ts`. Some env vars like
 * `NODE_FUNCTION_ALLOW_BUILTIN`, `WEBHOOK_TUNNEL_URL`, etc. are not.
 */
export function isDeclared(envVarName: string) {
  if (!envVars) return [];

  return Object.keys(envVars).includes(envVarName);
}

// ----------------------------------
//    parse ranges for decorations
// ----------------------------------

export function getProcessEnvDecorationOptions(doc: vscode.TextDocument) {
  const options: vscode.DecorationOptions[] = [];

  for (const child of tsProject
    .getSourceFile(doc.fileName)
    .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
    if (child.getExpression().getText() === "process.env") {
      const envVarName = child.getName();

      const overridden = isOverridden(envVarName);
      const undeclared = !isDeclared(envVarName);

      const value =
        overridden || undeclared
          ? process.env[envVarName]
          : envVars?.[envVarName];

      let details = "n8n default";

      if (overridden) {
        details = "(overridden by user)";
      } else if (undeclared) {
        details = "(not declared in `schema.ts`)";
      }

      const prefix = "Env var value";

      options.push({
        range: new vscode.Range(
          doc.positionAt(child.getStart()),
          doc.positionAt(child.getEnd())
        ),

        hoverMessage: `${prefix}: ${toDisplayable(value)} ${details}`,
      });
    }
  }

  return options;
}

export function getConfigGetEnvDecorationOptions(
  doc: vscode.TextDocument,
  schema: ConfigSchema
) {
  const paths: string[] = [];
  const options: vscode.DecorationOptions[] = [];

  for (const child of tsProject
    .getSourceFile(doc.fileName)
    .getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (child.getExpression().getText() === "config.getEnv") {
      const [arg] = child.getArguments();

      if (!arg) continue;

      paths.push(arg.getText().replace(/'/g, ""));

      options.push({
        range: new vscode.Range(
          doc.positionAt(arg.getStart()),
          doc.positionAt(arg.getEnd())
        ),
        hoverMessage: "",
      });
    }
  }

  const envVarNames = paths.map((path) => {
    const schemaNode = path
      .split(".")
      .reduce<ConfigSchema | ConfigSchemaNode>((acc, key) => {
        if (isConfigSchemaNode(acc)) return acc;

        return acc[key];
      }, schema) as ConfigSchemaNode;

    return schemaNode.env;
  });

  for (let i = 0; i < envVarNames.length; i++) {
    const envVarName = envVarNames[i];

    const overridden = isOverridden(envVarName);

    let value;

    if (overridden) {
      value = process.env[envVarName];
    } else {
      value = envVars?.[envVarName];

      /**
       * `config.getEnv()` is sometimes used to get an object, in which case
       * no default value is found, e.g. `config.getEnv('queue.bull.redis')`
       */
      if (value === null) continue;
    }

    const prefix = "Env var value";
    const details = overridden ? "(overridden by user)" : "(n8n default)";

    options[i].hoverMessage = `${prefix}: ${toDisplayable(value)} ${details}`;
  }

  return options.filter((o) => o.hoverMessage !== "");
}
