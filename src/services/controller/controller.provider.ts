import * as vscode from "vscode";
import { isSummary } from "../../guards";
import { parseControllers } from "./controller.parser";
import type {
  EndpointLocation,
  ControllerSummary,
  ControllerSummaryMethod,
} from "../../types";
import * as tsProject from "../../common/tsProject";

export class ControllersTreeProvider
  implements vscode.TreeDataProvider<ControllersTreeItem>
{
  controllerSummaries: ControllerSummary[] = [];

  constructor(paths: string[]) {
    this.controllerSummaries = parseControllers(paths);
  }

  getTreeItem(element: ControllersTreeItem) {
    return element;
  }

  getChildren(element?: ControllersTreeItem) {
    return element === undefined
      ? this.controllerSummaries.map((s) => new ControllersTreeItem(s))
      : element.children?.map((c) => new ControllersTreeItem(c));
  }

  eventEmitter = new vscode.EventEmitter<void>();

  onDidChangeTreeData = this.eventEmitter.event;

  refresh(paths: string[]) {
    paths.forEach((path) => tsProject.removeSourceFile(path));

    this.controllerSummaries = parseControllers(paths);

    this.eventEmitter.fire();
  }

  getEndpointLocations() {
    const locations = this.controllerSummaries.reduce<EndpointLocation[]>(
      (acc, summary) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [controllerName, _, filePath] = summary.name.split("#");

        let controllerDisplayName = controllerName;

        const isNamelessGroup = controllerName.startsWith("group:");

        if (isNamelessGroup) controllerDisplayName = "";

        for (const method of summary.methods) {
          const endpoint =
            method.name +
            " " +
            controllerDisplayName +
            method.endpoint.replace(/\/$/, "").replace(/\(\\\\d\+\)/, ""); // clear stray slash and (\\d+)

          acc.push([
            endpoint,
            {
              controllerName,
              filePath,
              lineNumber: method.lineNumber,
            },
          ]);
        }

        return acc;
      },
      []
    );

    let prevControllerName = null;

    for (let i = 0; i < locations.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, endpointData] = locations[i];

      if (endpointData.controllerName !== prevControllerName) {
        locations.splice(i, 0, [
          "separator",
          { controllerName: "", filePath: "", lineNumber: -1 },
        ]);
      }

      prevControllerName = endpointData.controllerName;
    }

    return locations;
  }
}

class ControllersTreeItem extends vscode.TreeItem {
  children: ControllerSummaryMethod[] | undefined;

  constructor(item: ControllerSummary | ControllerSummaryMethod) {
    if (isSummary(item)) {
      const [originalName, lineNumber, filePath] = item.name.split("#");

      let name = originalName;

      const isNamelessGroup = originalName.startsWith("group:");

      if (isNamelessGroup) name = "/";

      super(name, vscode.TreeItemCollapsibleState.Expanded);

      if (isNamelessGroup) {
        this.description =
          "[group: " + originalName.replace("group:/", "") + "]";
      }

      this.command = {
        command: "n8n-utils.navigate",
        title: "navigate",
        arguments: [parseInt(lineNumber), filePath],
      };

      this.children = item.methods;

      return;
    }

    super(
      item.name + " " + item.endpoint,
      vscode.TreeItemCollapsibleState.None
    );

    this.command = {
      command: "n8n-utils.navigate",
      title: "navigate",
      arguments: [item.lineNumber, item.filePath],
    };

    if (item.documentation) {
      this.tooltip = item.documentation;
    }
  }
}

export class EndpointNavItem implements vscode.QuickPickItem {
  label = "";
  filePath = "";
  lineNumber = -1;
  kind?: vscode.QuickPickItemKind;

  constructor([endpoint, { filePath, lineNumber }]: EndpointLocation) {
    if (endpoint === "separator") {
      this.kind = vscode.QuickPickItemKind.Separator;
      return;
    }

    this.label = endpoint;
    this.filePath = filePath;
    this.lineNumber = lineNumber;
  }
}
