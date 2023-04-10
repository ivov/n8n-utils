import { Project } from "ts-morph";

export function addSourceFile(filename: string) {
  tsProject().addSourceFileAtPath(filename);
}

export function removeSourceFile(filepath: string) {
  const sourceFile = tsProject().getSourceFile(filepath);

  if (!sourceFile) throw new Error(`Expected source file for: ${filepath}`);

  tsProject().removeSourceFile(sourceFile);
}

export function getSourceFile(filename: string) {
  const sourceFile = tsProject().getSourceFile(filename);

  if (!sourceFile) {
    throw new Error(`Failed to find source file in TS project: ${sourceFile}`);
  }

  return sourceFile;
}

let tsProjectInstance: Project | undefined;

function tsProject() {
  if (!tsProjectInstance) {
    tsProjectInstance = new Project();
  }

  return tsProjectInstance;
}
