import path from "node:path";

export const TERMINAL_NAMES = {
  WATCHER: "n8n utils · Watcher",
  STARTER: "n8n utils · Starter",
  EXPORTER: "n8n utils · Exporter",
};

export const MESSAGES = {
  WATCHER_SKIPPED: "Watcher process already running - skipped",
  STARTER_SKIPPED: "Starter process already running - skipped",
  BOTH_SKIPPED: "Watcher and starter processes already running - skipped",
};

export const ERRORS = {
  NO_WORKSPACE:
    'No workspace found. Please click "File > Open Folder" and select your root n8n directory',
  // @TODO: Or just find which workspace is n8n
  MULTIPLE_WORKSPACES:
    "Multiple workspaces detected. Please close any non-n8n workspace, keeping n8n as your only workspace",
  NO_SCHEMA_PATH:
    "Failed to find schema.ts. Please check your n8n directory for errors",
  UNPARSEABLE_SCHEMA:
    "Failed to parse schema.ts. Please check your schema.ts file for errors",
};

export const WEBVIEW = {
  TITLE: "n8n utils",
};

export const EXPORT_FILENAME = "workflows.json";

export const CLI_COMMANDS = {
  WATCH: "pnpm --filter n8n-nodes-base watch",
  START: "N8N_DEV_RELOAD=true N8N_USER_MANAGEMENT_DISABLED=true pnpm start",
  EXPORT: `./packages/cli/bin/n8n export:workflow --all --pretty --output=./${EXPORT_FILENAME}`,
};

export const NODE_PARAM_ICONS: Record<string, string> = {
  options: "list-unordered",
  multiOptions: "checklist",
  collection: "symbol-constant",
  fixedCollection: "layers",
  string: "text-size",
  number: "symbol-numeric",
  boolean: "color-mode",
  color: "symbol-color",
  json: "json",
  notice: "note",
  dateTime: "calendar",
  option: "record-small",
  fixedCollectionSection: "eye",
};

export const SCHEMA_RELATIVE_PATH = "./packages/cli/src/config/schema.ts";

export const MANUAL_TRIGGER_NODE_TYPE_NAME = 'When clicking "Execute Workflow"';

export const WORKSPACE_STORAGE_KEYS = {
  WORKSPACE_ROOT_PATH: "workspace-root-path",
  NODE_CLASS_LOCATIONS: "node-class-locations",
  ENV_VAR_NAMES_AND_DEFAULTS: "env-var-names-and-defaults",
};

export const NODE_CLASS_LOCATIONS_PATH = path.join(
  "packages",
  "nodes-base",
  "dist",
  "known",
  "nodes.json"
);
