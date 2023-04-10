import vscode from "vscode";
import { MANUAL_TRIGGER_NODE_TYPE_NAME } from "../../common/constants";
import { isWorkflow } from "../../guards";
import type { Node, Workflow } from "../../types";

export class WorkflowsTreeProvider
  implements vscode.TreeDataProvider<WorkflowTreeItem>
{
  constructor(public workflows: Workflow[]) {}

  getTreeItem(element: WorkflowTreeItem) {
    if (element.label === MANUAL_TRIGGER_NODE_TYPE_NAME) {
      element.label = "Manual Trigger";
      return element;
    }

    return element;
  }

  getChildren(element?: WorkflowTreeItem) {
    return element === undefined
      ? this.workflows.map((s) => new WorkflowTreeItem(s))
      : element.children?.map((c) => new WorkflowTreeItem(c));
  }

  eventEmitter = new vscode.EventEmitter<void>();

  onDidChangeTreeData = this.eventEmitter.event;

  refresh(workflows: Workflow[]) {
    this.workflows = workflows;

    this.eventEmitter.fire();
  }
}

class WorkflowTreeItem extends vscode.TreeItem {
  children: Node[] | undefined;

  constructor(item: Workflow | Node) {
    if (isWorkflow(item)) {
      super(item.name, vscode.TreeItemCollapsibleState.Expanded);

      this.command = {
        command: "n8n-utils.open-workflow",
        title: "Open workflow",
        arguments: [item.id],
      };

      this.children = item.nodes;
      this.iconPath = new vscode.ThemeIcon("git-merge");
      this.description = "#" + item.id;

      return;
    }

    super(item.name, vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon("git-commit");
    this.description = item.type.split(".").pop();
  }
}
