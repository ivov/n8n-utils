import path from "path";
import { SyntaxKind } from "ts-morph";
import { ControllerSummary, ControllerSummaryMethod } from "../../types";
import * as tsProject from "../../common/tsProject";

export function parseControllers(paths: string[]) {
  const controllerSummaries: ControllerSummary[] = [];

  for (const path of paths) {
    tsProject.addSourceFile(path);

    const controllerName = findControllerName(path);

    if (!controllerName) continue;

    if (controllerName.endsWith("saml.controller.ee.ts")) continue;

    controllerSummaries.push({
      name: controllerName,
      methods: findControllerMethods(path),
    });
  }

  return controllerSummaries.sort((a, b) => a.name.localeCompare(b.name));
}

function findControllerName(filePath: string) {
  for (const child of tsProject
    .getSourceFile(filePath)
    .getDescendantsOfKind(SyntaxKind.Decorator)) {
    const text = child.getText();

    if (isRestController(text)) {
      let name = text.replace(/(^@RestController\('?)|('?\)$)/g, "");

      if (name === "" || name === "/") {
        name =
          "group:/" + path.basename(filePath).replace(".controller.ts", "");
      }

      return [name, child.getStartLineNumber(), filePath].join("#");
    }
  }

  return null;
}

function findControllerMethods(filePath: string) {
  const methods: ControllerSummary["methods"] = [];

  for (const child of tsProject
    .getSourceFile(filePath)
    .getDescendantsOfKind(SyntaxKind.Decorator)) {
    const text = child.getText();

    if (isMethodDecorator(text)) {
      const [methodName, endpoint] = text
        .replace(/@(.*)\('(.*)'(.*)\)/, "$1 $2")
        .split(" ");

      const method: ControllerSummaryMethod = {
        name: methodName.toUpperCase(),
        endpoint,
        lineNumber: child.getStartLineNumber(),
        filePath,
      };

      const docstring = child
        .getLeadingCommentRanges()
        .map((range) =>
          range
            .getText()
            .split("\n")
            .filter((line) => /\* [a-zA-Z]/.test(line))
            .map((line) => line.replace(/\t \* /, ""))
            .join(" ")
        )
        .pop();

      if (docstring) method.documentation = docstring;

      methods.push(method);
    }
  }

  return methods;
}

const isRestController = (str: string) => str.startsWith("@RestController");
const isMethodDecorator = (str: string) => /@Get|@Post|@Put|@Patch/.test(str);
