import { SyntaxKind } from "ts-morph";
import type { ts } from "ts-morph";
import type {
  INodeProperties,
  INodePropertyOptions,
  INodePropertyCollection,
  ControllerSummary,
  ControllerSummaryMethod,
  Node,
  Workflow,
  ConfigSchemaNode,
  ConfigSchema,
} from "./types";

export function isINodeProperties(
  param: INodeProperties | INodePropertyOptions | INodePropertyCollection
): param is INodeProperties {
  return "default" in param;
}

export function isINodePropertyOptions(
  param: INodeProperties | INodePropertyOptions | INodePropertyCollection
): param is INodePropertyOptions {
  return "value" in param;
}

export function isINodePropertyCollection(
  param: INodeProperties | INodePropertyOptions | INodePropertyCollection
): param is INodePropertyCollection {
  return "values" in param;
}

export function isArrayLiteralExpression(
  node: ts.Expression
): node is ts.ArrayLiteralExpression {
  return node.kind === SyntaxKind.ArrayLiteralExpression;
}

export function isSummary(
  item: ControllerSummary | ControllerSummaryMethod
): item is ControllerSummary {
  return "methods" in item;
}

export function isWorkflow(item: Workflow | Node): item is Workflow {
  return "active" in item;
}

export function isConfigSchemaNode(
  node: ConfigSchema | ConfigSchemaNode
): node is ConfigSchemaNode {
  return typeof node === "object" && "env" in node;
}
