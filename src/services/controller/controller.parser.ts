import path from "path";
import { SyntaxKind } from "ts-morph";
import { ControllerSummary, ControllerSummaryMethod } from "../../types";
import * as tsProject from "../../common/tsProject";

export function parseControllers(paths: string[]) {
  const controllerSummaries: ControllerSummary[] = [];

  for (const path of paths) {
    tsProject.addSourceFile(path);

    let controllerName = findControllerName(path);

    if (!controllerName) continue;

    if (controllerName.endsWith("saml.controller.ee.ts")) continue; // uses enums, skip for now

    if (!controllerName.startsWith("/")) {
      controllerName = "/" + controllerName;
    }

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

    if (isMainRepoController(text) || isHostedBackendController(text)) {
      let name = text.replace(/(^@(Rest)?Controller\('?)|('?\)$)/g, "");

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
      // eslint-disable-next-line prefer-const
      let [methodName, endpoint] = text
        .replace(/@(.*)\('?([^']*)'?(.*)\)/, "$1 $2")
        .split(" ");

      // n8n-hosted-backend allows empty decorator arg
      if (!endpoint) {
        endpoint = "/";
      }

      // n8n-hosted-backend does not enforce starting slash
      if (endpoint && !endpoint.startsWith("/")) {
        endpoint = "/" + endpoint;
      }

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

const isMainRepoController = (str: string) => str.startsWith("@RestController");

const isHostedBackendController = (str: string) =>
  str.startsWith("@Controller");

const isMethodDecorator = (str: string) =>
  /@(Get|Put|Post|Patch|Delete|Options|Head)\(.*\)/.test(str);
