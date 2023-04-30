import { REPO_MARKERS } from "./common/utils";

// ----------------------------------
//           node params
// ----------------------------------

export interface INodeProperties {
  displayName: string;
  name: string;
  type: string;
  typeOptions?: object;
  default: unknown;
  description?: string;
  hint?: string;
  displayOptions?: object;
  options?: Array<
    INodePropertyOptions | INodeProperties | INodePropertyCollection
  >;
  placeholder?: string;
  isNodeSetting?: boolean;
  noDataExpression?: boolean;
  required?: boolean;
  routing?: object;
  credentialTypes?: string[];
  extractValue?: object;
  modes?: string;
  requiresDataPath?: string;
}

export interface INodePropertyOptions {
  name: string;
  value: string | number | boolean;
  action?: string;
  description?: string;
  routing?: object;
}

export interface INodePropertyCollection {
  displayName: string;
  name: string;
  values: INodeProperties[];
}

// ----------------------------------
//           config schema
// ----------------------------------

export type ConfigSchema = {
  [key: string]: ConfigSchema | ConfigSchemaNode;
};

export type ConfigSchemaNode = {
  env: string;
  default: string;
};

export type EnvVars = Record<string, string>; // uppercase names to default values

// ----------------------------------
//           controllers
// ----------------------------------

export type ControllerSummary = {
  name: string;
  methods: ControllerSummaryMethod[];
};

export type ControllerSummaryMethod = {
  name: string;
  endpoint: string;
  lineNumber: number;
  filePath: string;
  documentation?: string;
};

// ----------------------------------
//           workflows
// ----------------------------------

export type Workflow = {
  createdAt: string;
  updatedAt: string;
  id: string;
  name: string;
  active: boolean;
  nodes: Node[];
  settings: object;
  staticData: string | null; // @TODO
  pinData: object; // @TODO
  versionId: string;
  triggerCount: number;
  tags: Array<unknown>; // @TODO
};

export type Node = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: {
    [paramName: string]: unknown;
  };
};

// ----------------------------------
//             misc
// ----------------------------------

export type NodeClassLocations = {
  [nodeName: string]: { className: string; sourcePath: string };
};

export type EndpointLocation = [
  string,
  {
    controllerName: string;
    filePath: string;
    lineNumber: number;
  }
];

export namespace NodeStats {
  export type ResponsesCache = {
    [nodeTypeName: string]: {
      output: string; // markdown stats summary
      expiresAt: number; // Unix timestamp
    };
  };
}

export type RootLocation = {
  path: string;
  type: keyof typeof REPO_MARKERS;
};
