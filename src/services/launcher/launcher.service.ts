import http from "http";
import vscode from "vscode";
import waitForLocalhost from "wait-for-localhost";
import {
  CLI_COMMANDS,
  MESSAGES,
  TERMINAL_NAMES,
  WEBVIEW,
} from "../../common/constants";

const n8nPort = vscode.workspace
  .getConfiguration("n8n-utils")
  .get<number>("launcher.port");

const n8nBaseUrl = `http://localhost:${n8nPort}`;

export function init(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "n8n-utils.launch",
    async () => {
      runTerminals();

      await waitUntilPortReady();
      await waitUntilServerReady();

      vscode.window.showInformationMessage("n8n is ready!");

      openWebview();
    }
  );

  context.subscriptions.push(disposable);
}

function runTerminals() {
  const watcherExists = vscode.window.terminals.some(
    (t) => t.name === TERMINAL_NAMES.WATCHER
  );

  if (!watcherExists) {
    const watcher = vscode.window.createTerminal({
      name: TERMINAL_NAMES.WATCHER,
      isTransient: true,
    });
    watcher.show(true);
    watcher.sendText(CLI_COMMANDS.WATCH);
  }

  const starterExists = vscode.window.terminals.some(
    (t) => t.name === TERMINAL_NAMES.STARTER
  );

  if (!starterExists) {
    const starter = vscode.window.createTerminal({
      name: TERMINAL_NAMES.STARTER,
      isTransient: true,
    });
    starter.show(true);
    starter.sendText(CLI_COMMANDS.START);
  }

  if (watcherExists && starterExists) {
    vscode.window.showInformationMessage(MESSAGES.BOTH_SKIPPED);
  } else if (watcherExists) {
    vscode.window.showInformationMessage(MESSAGES.WATCHER_SKIPPED);
  } else if (starterExists) {
    vscode.window.showInformationMessage(MESSAGES.STARTER_SKIPPED);
  }

  vscode.window.terminals
    .filter((t) => !t.name.startsWith("n8n"))
    .forEach((t) => t.dispose()); // clear unrelated
}

const waitUntilPortReady = () =>
  waitForLocalhost({ port: n8nPort, path: "/healthz", useGet: true });

function waitUntilServerReady() {
  const HEALTH_CHECK_ENDPOINT = `${n8nBaseUrl}/healthz`;

  return new Promise<void>((resolve, reject) => {
    const healthCheck = setInterval(() => {
      http
        .get(HEALTH_CHECK_ENDPOINT, (res) => {
          if (res.statusCode === 200) {
            clearInterval(healthCheck);
            resolve();
          }
        })
        .on("error", (error) => {
          clearInterval(healthCheck);
          reject(error);
        });
    }, 1_000);
  });
}

let currentWebviewPanel: vscode.WebviewPanel | undefined;

export function openWebview() {
  vscode.commands.executeCommand(
    "workbench.action.webview.reloadWebviewAction" // @TODO: Needed?
  );

  if (currentWebviewPanel) {
    currentWebviewPanel.reveal();
    return;
  }

  const newWebviewPanel = vscode.window.createWebviewPanel(
    "n8n-utils-launcher-webview",
    WEBVIEW.TITLE,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      enableCommandUris: true, // @TODO: Needed?
      localResourceRoots: [], // @TODO: Needed?
    }
  );

  currentWebviewPanel = newWebviewPanel;

  newWebviewPanel.webview.html = iframe(`${n8nBaseUrl}/workflow/new`);

  newWebviewPanel.onDidDispose(() => {
    currentWebviewPanel = undefined;
  });
}

export const iframe = (url: string) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      html, body, iframe { 
        height: 100vh; 
        width: 100vw; 
        margin: 0; 
        border: 0; 
        padding: 0; 
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <iframe src="${url}"></iframe>
    <script>
      window.addEventListener("message", (event) => {
        window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(event.data)));
      }, false);
    </script>
  </body>
</html>
`;
