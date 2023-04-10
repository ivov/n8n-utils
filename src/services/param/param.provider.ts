import * as vscode from "vscode";
import { parseParams } from "./param.parser";
import { NODE_PARAM_ICONS } from "../../common/constants";
import * as tsProject from "../../common/tsProject";
import {
  isINodeProperties,
  isINodePropertyOptions,
  isINodePropertyCollection,
} from "../../guards";
import type {
  INodeProperties,
  INodePropertyOptions,
  INodePropertyCollection,
} from "../../types";

export class ParamsTreeProvider
  implements vscode.TreeDataProvider<ParamTreeItem>
{
  params: INodeProperties[] = [];

  constructor() {
    this.params = parseParams();
  }

  getTreeItem(element: ParamTreeItem) {
    return element;
  }

  getChildren(element?: ParamTreeItem) {
    return element === undefined
      ? this.params.map((p) => new ParamTreeItem(p))
      : element.children?.map((c) => new ParamTreeItem(c));
  }

  getFlattenedItems() {
    const items: ParamTreeItem[] = [];

    const recurse = (item?: ParamTreeItem) => {
      const children = this.getChildren(item);

      if (!children) return;

      for (const child of children) {
        items.push(child);
        recurse(child);
      }
    };

    recurse();

    return items;
  }

  eventEmitter = new vscode.EventEmitter<void>();

  onDidChangeTreeData = this.eventEmitter.event;

  reparse() {
    this.params = parseParams();

    this.eventEmitter.fire();
  }

  refresh() {
    const path = vscode.window.activeTextEditor?.document.fileName;

    if (!path) return;

    tsProject.removeSourceFile(path);

    this.params = parseParams();

    this.eventEmitter.fire();
  }
}

export class ParamTreeItem extends vscode.TreeItem {
  children: INodeProperties["options"] | undefined;
  type: keyof typeof NODE_PARAM_ICONS;

  constructor(
    param: INodeProperties | INodePropertyOptions | INodePropertyCollection
  ) {
    let label: string;
    let lineNumber: number;
    let collapsibleState: vscode.TreeItemCollapsibleState;

    if (isINodeProperties(param)) {
      const [displayName, marker] = param.displayName.split("#");
      label = displayName;
      lineNumber = parseInt(marker);

      if (param.type === "notice") {
        label = displayName.slice(0, 10) + "...";
      }

      collapsibleState =
        param.options !== undefined
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None;
    } else if (isINodePropertyOptions(param)) {
      const [displayName, marker] = param.name.split("#");
      label = displayName;
      lineNumber = parseInt(marker);
      collapsibleState = vscode.TreeItemCollapsibleState.None;
    } else {
      const [displayName, marker] = param.displayName.split("#");
      label = displayName;
      lineNumber = parseInt(marker);
      collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }

    super(label, collapsibleState);

    this.command = {
      command: "n8n-utils.navigate",
      title: "navigate",
      arguments: [lineNumber],
    };

    if (isINodeProperties(param)) {
      this.type = param.type;
      if (param.options) this.children = param.options;
      this.iconPath = new vscode.ThemeIcon(NODE_PARAM_ICONS[param.type]);
    } else if (isINodePropertyCollection(param)) {
      this.type = "fixedCollectionSection";
      this.children = param.values;
      this.iconPath = new vscode.ThemeIcon("eye");
    } else {
      this.type = "option";
      this.iconPath = new vscode.ThemeIcon("record-small"); // leaf
    }

    if (isINodeProperties(param) || isINodePropertyOptions(param)) {
      this.tooltip = this.description = param.description;
    }

    if (isINodeProperties(param) && param.type === "notice") {
      this.tooltip = this.description = param.displayName;
    }
  }
}

export class ParamNavItem implements vscode.QuickPickItem {
  label: string;
  description: string;
  detail: string;
  lineNumber: number;

  constructor(item: ParamTreeItem) {
    const icon = NODE_PARAM_ICONS[item.type];

    const itemLabel = item.label as string;

    this.label = `$(${icon})  ${itemLabel}`;

    if (item.type === "option") {
      this.label = this.label.replace("  ", " "); // icon already has significant space
    }

    this.lineNumber = item.command?.arguments?.[0] ?? 0;
    this.description = `→ Line ${this.lineNumber}`;

    this.detail = [
      displayableType(item.type),
      displayableDescription(item),
    ].join(" · ");
  }
}

function displayableType(type: keyof typeof NODE_PARAM_ICONS) {
  if (type === "fixedCollectionSection") return "section in fixed collection";
  if (type === "fixedCollection") return "fixed collection";
  if (type === "multiOptions") return "multiple options";

  return type;
}

function displayableDescription(item: ParamTreeItem) {
  if (!item.description || item.description === true) {
    return "No description provided";
  }

  const DESCRIPTION_CUTOFF_CHARS = 60;

  return item.description.length > DESCRIPTION_CUTOFF_CHARS
    ? item.description.slice(0, DESCRIPTION_CUTOFF_CHARS) + "..."
    : item.description;
}
