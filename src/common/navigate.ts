import vscode from "vscode";

export const navigate = vscode.commands.registerCommand(
  "n8n-utils.navigate",
  async (lineNumber: number, filePath: string) => {
    const atActiveEditor = !filePath;

    if (atActiveEditor) {
      const editor = vscode.window.activeTextEditor;

      if (!editor) return;

      const range = editor.document.lineAt(lineNumber - 1).range;
      editor.selection = new vscode.Selection(range.start, range.end);

      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(filePath);
    const editor = await vscode.window.showTextDocument(doc);

    const range = editor.document.lineAt(lineNumber - 1).range;
    editor.selection = new vscode.Selection(range.start, range.end);

    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  }
);
